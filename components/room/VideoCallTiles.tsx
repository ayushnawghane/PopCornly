"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, PhoneCall } from "lucide-react";
import { usePeerConnections } from "@/lib/webrtc/use-peer-connections";
import Button from "@/components/ui/Button";
import type { RoomMember } from "@/lib/types";

function VideoTile({ stream, label, muted }: { stream: MediaStream; label: string; muted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-black">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-xs font-medium text-white">
        {label}
      </span>
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-raised p-5 text-center">
        <p className="text-sm text-foreground-muted">Video call is off. Camera/mic only turn on if you join.</p>
        <Button onClick={() => setJoined(true)} size="sm">
          <PhoneCall className="h-3.5 w-3.5" />
          Join video call
        </Button>
        <p className="text-xs text-foreground-muted/70">
          Peer-to-peer, no relay server — calls may fail to connect on strict corporate/school networks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-bg-raised p-3">
      {mediaError && <p className="text-sm text-danger">{mediaError}</p>}

      <div className="grid grid-cols-2 gap-2">
        {localStream && <VideoTile stream={localStream} label="You" muted />}
        {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
          <VideoTile key={peerId} stream={stream} label={nameFor(peerId)} />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleMic}
          aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
          className="flex items-center gap-1.5 rounded-xl border border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:border-secondary hover:text-secondary"
        >
          {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5 text-danger" />}
          {micEnabled ? "Mute" : "Unmute"}
        </button>
        <button
          onClick={toggleCamera}
          aria-label={cameraEnabled ? "Stop camera" : "Start camera"}
          className="flex items-center gap-1.5 rounded-xl border border-border-strong px-3 py-1.5 text-xs font-medium transition-colors hover:border-secondary hover:text-secondary"
        >
          {cameraEnabled ? <VideoIcon className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5 text-danger" />}
          {cameraEnabled ? "Stop camera" : "Start camera"}
        </button>
        <button
          onClick={() => setJoined(false)}
          className="ml-auto flex items-center gap-1.5 rounded-xl border border-danger/30 bg-danger/15 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/25"
        >
          <PhoneOff className="h-3.5 w-3.5" />
          Leave call
        </button>
      </div>
    </div>
  );
}
