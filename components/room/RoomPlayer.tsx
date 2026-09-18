"use client";

import { useEffect, useRef, useState } from "react";
import YouTube, { type YouTubeEvent } from "react-youtube";
import Player from "@vimeo/player";
import { getOrCreateChannel, releaseChannel } from "@/lib/realtime/room-channel";
import { SyncEngine } from "@/lib/sync/sync-engine";
import { createAdapter, sourceTypeToAdapterKind } from "@/lib/player/create-adapter";
import { extractYouTubeId, type YouTubeAdapter } from "@/lib/player/youtube-adapter";
import { extractVimeoId, type VimeoAdapter } from "@/lib/player/vimeo-adapter";
import type { Html5Adapter } from "@/lib/player/html5-adapter";
import type { VideoPlayerAdapter } from "@/lib/player/types";
import type { Room } from "@/lib/types";
import SourcePickerForm from "./SourcePickerForm";

export default function RoomPlayer({
  room: initialRoom,
  isHost,
  currentUserId,
}: {
  room: Room;
  isHost: boolean;
  currentUserId: string;
}) {
  const [room, setRoom] = useState(initialRoom);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(initialRoom.playback_state === "playing");

  // "adjusting state when a prop changes" pattern (react.dev/learn/you-might-not-need-an-effect):
  // reset the manual toggle during render, not in an effect, whenever the source itself changes.
  const sourceKey = `${room.source_type}:${room.source_url ?? ""}:${room.uploaded_video_id ?? ""}`;
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);
  const [manuallyOpened, setManuallyOpened] = useState(false);
  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setManuallyOpened(false);
  }
  const showSourcePicker = room.source_type === "none" || manuallyOpened;

  const syncEngineRef = useRef<SyncEngine | null>(null);
  const adapterRef = useRef<VideoPlayerAdapter | null>(null);
  const vimeoContainerRef = useRef<HTMLDivElement | null>(null);
  const vimeoPlayerRef = useRef<Player | null>(null);

  // shared channel + sync engine, created once for the lifetime of this room view
  useEffect(() => {
    const channel = getOrCreateChannel(initialRoom.id, currentUserId);
    const engine = new SyncEngine(initialRoom.id, channel, isHost, {
      state: initialRoom.playback_state,
      positionSeconds: initialRoom.playback_position_seconds,
      rate: initialRoom.playback_rate,
      updatedAt: initialRoom.playback_updated_at,
    });
    syncEngineRef.current = engine;

    channel.on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${initialRoom.id}` },
      (payload) => setRoom(payload.new as Room),
    );

    return () => {
      engine.destroy();
      releaseChannel(initialRoom.id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoom.id]);

  // when the source changes, tear down the previous native player/adapter and attach a fresh one
  useEffect(() => {
    adapterRef.current?.destroy();
    adapterRef.current = null;
    vimeoPlayerRef.current?.destroy().catch(() => {});
    vimeoPlayerRef.current = null;
    // clear the previous source's signed URL immediately so a stale video never flashes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaybackUrl(null);
    setPlaybackError(null);

    if (room.source_type === "none") return;

    const adapter = createAdapter(sourceTypeToAdapterKind(room.source_type));
    adapterRef.current = adapter;
    syncEngineRef.current?.attachPlayer(adapter);

    if (room.source_type === "upload" && room.uploaded_video_id) {
      fetch(`/api/uploads/${room.uploaded_video_id}/playback-url`)
        .then((res) => res.json())
        .then((json) => {
          if (json.url) setPlaybackUrl(json.url);
          else setPlaybackError(json.error ?? "Could not load this video");
        })
        .catch(() => setPlaybackError("Could not load this video"));
    } else if (room.source_type === "direct_url") {
      setPlaybackUrl(room.source_url);
    }
  }, [room.source_type, room.source_url, room.uploaded_video_id]);

  // Vimeo needs a mounted container before the native player can be constructed
  useEffect(() => {
    if (room.source_type !== "vimeo" || !vimeoContainerRef.current || !room.source_url) return;
    const vimeoId = extractVimeoId(room.source_url);
    if (!vimeoId) return;

    vimeoContainerRef.current.innerHTML = "";
    const player = new Player(vimeoContainerRef.current, { id: Number(vimeoId), width: 960 });
    vimeoPlayerRef.current = player;
    (adapterRef.current as VimeoAdapter | null)?.attachNativePlayer(player);

    return () => {
      player.destroy().catch(() => {});
    };
  }, [room.source_type, room.source_url]);

  function handleHtml5Ref(video: HTMLVideoElement | null) {
    if (video) (adapterRef.current as Html5Adapter | null)?.attachNativePlayer(video);
  }

  function handleYouTubeReady(event: YouTubeEvent) {
    (adapterRef.current as YouTubeAdapter | null)?.attachNativePlayer(event.target);
  }

  function handleYouTubeStateChange(event: YouTubeEvent<number>) {
    (adapterRef.current as YouTubeAdapter | null)?.handleStateChange(event.data);
  }

  async function togglePlay() {
    const engine = syncEngineRef.current;
    if (!engine || !isHost) return;
    if (isPlaying) {
      await engine.hostPause();
      setIsPlaying(false);
    } else {
      await engine.hostPlay();
      setIsPlaying(true);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-black">
        {room.source_type === "none" && (
          <p className="text-sm text-zinc-500">
            {isHost ? "Pick a video below to get started" : "Waiting for the host to pick a video…"}
          </p>
        )}

        {room.source_type === "youtube" && room.source_url && (
          <YouTube
            videoId={extractYouTubeId(room.source_url) ?? undefined}
            opts={{ width: "100%", height: "100%", playerVars: { autoplay: 0 } }}
            className="h-full w-full"
            iframeClassName="h-full w-full"
            onReady={handleYouTubeReady}
            onStateChange={handleYouTubeStateChange}
          />
        )}

        {room.source_type === "vimeo" && <div ref={vimeoContainerRef} className="h-full w-full" />}

        {(room.source_type === "upload" || room.source_type === "direct_url") &&
          (playbackError ? (
            <p className="text-sm text-red-400">{playbackError}</p>
          ) : playbackUrl ? (
            <video ref={handleHtml5Ref} src={playbackUrl} className="h-full w-full" controls={!isHost} />
          ) : (
            <p className="text-sm text-zinc-500">Loading video…</p>
          ))}
      </div>

      {isHost && room.source_type !== "none" && (
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={() => setManuallyOpened((v) => !v)}
            className="text-sm text-zinc-500 underline underline-offset-4 hover:text-foreground"
          >
            Change source
          </button>
        </div>
      )}

      {!isHost && room.source_type !== "none" && (
        <p className="text-xs text-zinc-500">Playback is synced to the host — controls are host-only.</p>
      )}

      {isHost && showSourcePicker && <SourcePickerForm roomId={room.id} />}
    </div>
  );
}
