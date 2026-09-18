"use client";

import { useEffect, useRef, useState } from "react";
import { getOrCreateChannel, releaseChannel } from "@/lib/realtime/room-channel";
import type { WebRTCSignalEvent } from "./types";

// STUN only, no TURN/SFU — accepted MVP tradeoff for small (2-5 person) rooms.
// Calls behind symmetric NAT / strict corporate firewalls may fail to connect;
// upgrading later just means adding a TURN entry to ICE_SERVERS, no signaling changes.
const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export function usePeerConnections(roomId: string, userId: string, enabled: boolean) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const channel = getOrCreateChannel(roomId, userId);
    const peers = peersRef.current;

    function send(event: WebRTCSignalEvent) {
      channel.send({ type: "broadcast", event: "webrtc", payload: event });
    }

    function removePeer(peerId: string) {
      peers.get(peerId)?.close();
      peers.delete(peerId);
      setRemoteStreams((prev) => {
        if (!prev.has(peerId)) return prev;
        const next = new Map(prev);
        next.delete(peerId);
        return next;
      });
    }

    function createPeerConnection(peerId: string, stream: MediaStream): RTCPeerConnection {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          send({ type: "webrtc:ice-candidate", from: userId, to: peerId, candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev);
          next.set(peerId, event.streams[0]);
          return next;
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          removePeer(peerId);
        }
      };

      peers.set(peerId, pc);
      return pc;
    }

    async function setup() {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        if (!cancelled) setMediaError("Could not access camera/microphone — check your browser permissions.");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      channel.on("broadcast", { event: "webrtc" }, async ({ payload }) => {
        const event = payload as WebRTCSignalEvent;
        if ("to" in event && event.to !== userId) return;

        switch (event.type) {
          case "webrtc:join": {
            if (event.userId === userId) return;
            const pc = createPeerConnection(event.userId, stream);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            send({ type: "webrtc:offer", from: userId, to: event.userId, sdp: offer });
            break;
          }
          case "webrtc:offer": {
            const pc = createPeerConnection(event.from, stream);
            await pc.setRemoteDescription(event.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            send({ type: "webrtc:answer", from: userId, to: event.from, sdp: answer });
            break;
          }
          case "webrtc:answer": {
            await peers.get(event.from)?.setRemoteDescription(event.sdp);
            break;
          }
          case "webrtc:ice-candidate": {
            await peers.get(event.from)?.addIceCandidate(event.candidate);
            break;
          }
          case "webrtc:leave": {
            removePeer(event.userId);
            break;
          }
        }
      });

      // Presence catches tab close / network drop even when a `webrtc:leave` message never sends.
      channel.on("presence", { event: "leave" }, ({ key }: { key: string }) => {
        if (key !== userId) removePeer(key);
      });

      await channel.track({ user_id: userId });
      send({ type: "webrtc:join", userId });
    }

    setup();

    return () => {
      cancelled = true;
      send({ type: "webrtc:leave", userId });
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      peers.forEach((pc) => pc.close());
      peers.clear();
      setLocalStream(null);
      setRemoteStreams(new Map());
      releaseChannel(roomId);
    };
  }, [roomId, userId, enabled]);

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicEnabled(track.enabled);
  }

  function toggleCamera() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraEnabled(track.enabled);
  }

  return { localStream, remoteStreams, micEnabled, cameraEnabled, mediaError, toggleMic, toggleCamera };
}
