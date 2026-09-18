import type { RealtimeChannel } from "@supabase/supabase-js";
import type { VideoPlayerAdapter } from "@/lib/player/types";
import { createClient } from "@/lib/supabase/client";
import type { PlaybackAnchor, SyncBroadcastEvent } from "./types";

const HEARTBEAT_INTERVAL_MS = 3000;
const PERSIST_INTERVAL_MS = 15000;
const DRIFT_IGNORE_S = 0.75;
const DRIFT_NUDGE_S = 2.5;
const NUDGE_DURATION_MS = 1500;
const NUDGE_RATE_DELTA = 0.1;

/**
 * Host drives state, followers listen and self-correct. Two channels of
 * truth: ephemeral Realtime Broadcast (`sync:*` events) for low-latency
 * play/pause/seek/rate + a 3s heartbeat while playing, and the persisted
 * `rooms` row (write-through per action + throttled every ~15s) as the
 * cold-join/reconnect anchor.
 */
export class SyncEngine {
  private adapter: VideoPlayerAdapter | null = null;
  private unsubTimeUpdate: (() => void) | null = null;
  private unsubReady: (() => void) | null = null;
  private heartbeatHandle: ReturnType<typeof setInterval> | null = null;
  private persistHandle: ReturnType<typeof setInterval> | null = null;
  private nudgeTimeout: ReturnType<typeof setTimeout> | null = null;
  private supabase = createClient();

  constructor(
    private roomId: string,
    private channel: RealtimeChannel,
    public isHost: boolean,
    private anchor: PlaybackAnchor,
  ) {
    this.channel.on("broadcast", { event: "sync" }, ({ payload }) => {
      this.handleBroadcast(payload as SyncBroadcastEvent);
    });
  }

  attachPlayer(adapter: VideoPlayerAdapter) {
    this.detachPlayer();
    this.adapter = adapter;

    this.unsubReady = adapter.onReady(() => {
      this.applyAnchorOnLoad();
      if (this.isHost) {
        this.startHeartbeat();
        this.startPersistLoop();
      } else {
        this.broadcast({ type: "sync:request-state" });
      }
    });

    if (!this.isHost) {
      this.unsubTimeUpdate = adapter.onTimeUpdate((seconds) => this.correctDrift(seconds));
    }
  }

  detachPlayer() {
    this.unsubTimeUpdate?.();
    this.unsubReady?.();
    this.unsubTimeUpdate = null;
    this.unsubReady = null;
    this.adapter = null;
  }

  destroy() {
    this.detachPlayer();
    if (this.heartbeatHandle) clearInterval(this.heartbeatHandle);
    if (this.persistHandle) clearInterval(this.persistHandle);
    if (this.nudgeTimeout) clearTimeout(this.nudgeTimeout);
  }

  private computeExpectedPosition(anchor: PlaybackAnchor): number {
    if (anchor.state !== "playing") return anchor.positionSeconds;
    const elapsed = (Date.now() - new Date(anchor.updatedAt).getTime()) / 1000;
    return anchor.positionSeconds + elapsed * anchor.rate;
  }

  private applyAnchorOnLoad() {
    if (!this.adapter) return;
    const expected = this.computeExpectedPosition(this.anchor);
    this.adapter.seekTo(expected);
    this.adapter.setPlaybackRate(this.anchor.rate);
    if (this.anchor.state === "playing") this.adapter.play();
    else this.adapter.pause();
  }

  // ---- Host actions, called from RoomPlayer's transport controls ----

  async hostPlay() {
    if (!this.adapter || !this.isHost) return;
    const positionSeconds = await this.adapter.getCurrentTime();
    this.adapter.play();
    this.broadcast({ type: "sync:play", positionSeconds, rate: this.anchor.rate, emittedAt: Date.now() });
    this.updateAnchor({ state: "playing", positionSeconds });
    this.persistNow();
  }

  async hostPause() {
    if (!this.adapter || !this.isHost) return;
    const positionSeconds = await this.adapter.getCurrentTime();
    this.adapter.pause();
    this.broadcast({ type: "sync:pause", positionSeconds, emittedAt: Date.now() });
    this.updateAnchor({ state: "paused", positionSeconds });
    this.persistNow();
  }

  async hostSeek(positionSeconds: number) {
    if (!this.adapter || !this.isHost) return;
    this.adapter.seekTo(positionSeconds);
    this.broadcast({ type: "sync:seek", positionSeconds, emittedAt: Date.now() });
    this.updateAnchor({ positionSeconds });
    this.persistNow();
  }

  async hostSetRate(rate: number) {
    if (!this.adapter || !this.isHost) return;
    const positionSeconds = await this.adapter.getCurrentTime();
    this.adapter.setPlaybackRate(rate);
    this.broadcast({ type: "sync:rate", rate, emittedAt: Date.now() });
    this.updateAnchor({ rate, positionSeconds });
    this.persistNow();
  }

  // ---- Incoming broadcast handling ----

  private handleBroadcast(event: SyncBroadcastEvent) {
    if (event.type === "sync:request-state") {
      if (this.isHost) this.answerStateRequest();
      return;
    }

    if (this.isHost || !this.adapter) return;

    switch (event.type) {
      case "sync:play": {
        const expected = event.positionSeconds + ((Date.now() - event.emittedAt) / 1000) * event.rate;
        this.adapter.seekTo(expected);
        this.adapter.setPlaybackRate(event.rate);
        this.adapter.play();
        this.anchor = {
          state: "playing",
          positionSeconds: event.positionSeconds,
          rate: event.rate,
          updatedAt: new Date(event.emittedAt).toISOString(),
        };
        break;
      }
      case "sync:pause": {
        this.adapter.seekTo(event.positionSeconds);
        this.adapter.pause();
        this.anchor = {
          ...this.anchor,
          state: "paused",
          positionSeconds: event.positionSeconds,
          updatedAt: new Date(event.emittedAt).toISOString(),
        };
        break;
      }
      case "sync:seek": {
        this.adapter.seekTo(event.positionSeconds);
        this.anchor = {
          ...this.anchor,
          positionSeconds: event.positionSeconds,
          updatedAt: new Date(event.emittedAt).toISOString(),
        };
        break;
      }
      case "sync:rate": {
        this.adapter.setPlaybackRate(event.rate);
        this.anchor = { ...this.anchor, rate: event.rate };
        break;
      }
      case "sync:heartbeat": {
        this.anchor = {
          state: event.state,
          positionSeconds: event.positionSeconds,
          rate: event.rate,
          updatedAt: new Date(event.emittedAt).toISOString(),
        };
        break;
      }
    }
  }

  private async answerStateRequest() {
    if (!this.adapter) return;
    const positionSeconds = await this.adapter.getCurrentTime();
    this.broadcast({
      type: "sync:heartbeat",
      positionSeconds,
      rate: this.anchor.rate,
      state: this.anchor.state,
      emittedAt: Date.now(),
    });
  }

  // ---- Drift correction (followers only) ----

  private correctDrift(currentSeconds: number) {
    if (this.isHost || this.anchor.state !== "playing") return;
    const expected = this.computeExpectedPosition(this.anchor);
    const drift = expected - currentSeconds;
    const absDrift = Math.abs(drift);

    if (absDrift < DRIFT_IGNORE_S) return;

    if (absDrift <= DRIFT_NUDGE_S) {
      if (this.nudgeTimeout) return;
      const nudged = this.anchor.rate * (1 + (drift > 0 ? NUDGE_RATE_DELTA : -NUDGE_RATE_DELTA));
      this.adapter?.setPlaybackRate(nudged);
      this.nudgeTimeout = setTimeout(() => {
        this.adapter?.setPlaybackRate(this.anchor.rate);
        this.nudgeTimeout = null;
      }, NUDGE_DURATION_MS);
    } else {
      this.adapter?.seekTo(expected);
    }
  }

  // ---- Host: heartbeat + throttled persistence ----

  private startHeartbeat() {
    this.heartbeatHandle = setInterval(async () => {
      if (!this.adapter || this.anchor.state !== "playing") return;
      const positionSeconds = await this.adapter.getCurrentTime();
      this.broadcast({
        type: "sync:heartbeat",
        positionSeconds,
        rate: this.anchor.rate,
        state: "playing",
        emittedAt: Date.now(),
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private startPersistLoop() {
    this.persistHandle = setInterval(() => {
      if (this.anchor.state === "playing") this.persistNow();
    }, PERSIST_INTERVAL_MS);
  }

  private updateAnchor(patch: Partial<PlaybackAnchor>) {
    this.anchor = { ...this.anchor, ...patch, updatedAt: new Date().toISOString() };
  }

  private async persistNow() {
    if (!this.adapter || !this.isHost) return;
    const positionSeconds = await this.adapter.getCurrentTime();
    await this.supabase
      .from("rooms")
      .update({
        playback_state: this.anchor.state,
        playback_position_seconds: positionSeconds,
        playback_rate: this.anchor.rate,
        playback_updated_at: new Date().toISOString(),
      })
      .eq("id", this.roomId);
  }

  private broadcast(event: SyncBroadcastEvent) {
    this.channel.send({ type: "broadcast", event: "sync", payload: event });
  }
}
