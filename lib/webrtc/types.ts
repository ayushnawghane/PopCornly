export type WebRTCSignalEvent =
  | { type: "webrtc:join"; userId: string }
  | { type: "webrtc:offer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "webrtc:answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "webrtc:ice-candidate"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: "webrtc:leave"; userId: string };
