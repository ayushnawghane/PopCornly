import type Player from "@vimeo/player";
import type { VideoPlayerAdapter } from "./types";

export class VimeoAdapter implements VideoPlayerAdapter {
  private player: Player | null = null;
  private ready = false;
  private timeUpdateCbs = new Set<(seconds: number) => void>();
  private endedCbs = new Set<() => void>();
  private readyCbs = new Set<() => void>();

  attachNativePlayer(player: Player) {
    this.player = player;
    player.on("timeupdate", (data: { seconds: number }) => {
      this.timeUpdateCbs.forEach((cb) => cb(data.seconds));
    });
    player.on("ended", () => {
      this.endedCbs.forEach((cb) => cb());
    });
    player.ready().then(() => {
      this.ready = true;
      this.readyCbs.forEach((cb) => cb());
    });
  }

  play() {
    this.player?.play();
  }

  pause() {
    this.player?.pause();
  }

  seekTo(seconds: number) {
    this.player?.setCurrentTime(seconds);
  }

  async getCurrentTime() {
    return (await this.player?.getCurrentTime()) ?? 0;
  }

  async getDuration() {
    return (await this.player?.getDuration()) ?? 0;
  }

  async isPaused() {
    return (await this.player?.getPaused()) ?? true;
  }

  setPlaybackRate(rate: number) {
    this.player?.setPlaybackRate(rate);
  }

  onTimeUpdate(cb: (seconds: number) => void) {
    this.timeUpdateCbs.add(cb);
    return () => this.timeUpdateCbs.delete(cb);
  }

  onEnded(cb: () => void) {
    this.endedCbs.add(cb);
    return () => this.endedCbs.delete(cb);
  }

  onReady(cb: () => void) {
    if (this.ready) cb();
    this.readyCbs.add(cb);
    return () => this.readyCbs.delete(cb);
  }

  destroy() {
    this.player?.destroy();
    this.timeUpdateCbs.clear();
    this.endedCbs.clear();
    this.readyCbs.clear();
  }
}

const VIMEO_ID_PATTERN = /vimeo\.com\/(?:video\/)?(\d+)/;

export function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_ID_PATTERN);
  return match ? match[1] : null;
}
