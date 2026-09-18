"use client";

import { useEffect, useRef, useState } from "react";
import { usePeerConnections } from "@/lib/webrtc/use-peer-connections";
import type { RoomMember } from "@/lib/types";

function VideoTile({ stream, label, muted }: { stream: MediaStream; label: string; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-md bg-zinc-900">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{label}</span>
    </div>
  );
}

export default function VideoCallTiles({
  roomId,
  currentUserId,
  members,
}: {
  roomId: string;
  currentUserId: string;
  members: RoomMember[];
}) {
  const [joined, setJoined] = useState(false);

  const { localStream, remoteStreams, micEnabled, cameraEnabled, mediaError, toggleMic, toggleCamera } =
    usePeerConnections(roomId, currentUserId, joined);

  const nameFor = (userId: string) => members.find((m) => m.user_id === userId)?.profiles?.display_name ?? "Someone";

  if (!joined) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-200 p-4 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-500">Video call is off. Camera/mic only turn on if you join.</p>
        <button
          onClick={() => setJoined(true)}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Join video call
        </button>
        <p className="text-xs text-zinc-400">
          Peer-to-peer, no relay server — calls may fail to connect on strict corporate/school networks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {mediaError && <p className="text-sm text-red-500">{mediaError}</p>}

      <div className="grid grid-cols-2 gap-2">
        {localStream && <VideoTile stream={localStream} label="You" muted />}
        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <VideoTile key={peerId} stream={stream} label={nameFor(peerId)} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
        >
          {micEnabled ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={toggleCamera}
          className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/[.04] dark:border-zinc-700 dark:hover:bg-white/[.06]"
        >
          {cameraEnabled ? "Stop camera" : "Start camera"}
        </button>
        <button
          onClick={() => setJoined(false)}
          className="rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
        >
          Leave call
        </button>
      </div>
    </div>
  );
}
