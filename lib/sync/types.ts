export interface PlaybackAnchor {
  state: "playing" | "paused";
  positionSeconds: number;
  rate: number;
  updatedAt: string;
}

export type SyncBroadcastEvent =
  | { type: "sync:play"; positionSeconds: number; rate: number; emittedAt: number }
  | { type: "sync:pause"; positionSeconds: number; emittedAt: number }
  | { type: "sync:seek"; positionSeconds: number; emittedAt: number }
  | { type: "sync:rate"; rate: number; emittedAt: number }
  | {
      type: "sync:heartbeat";
      positionSeconds: number;
      rate: number;
      state: "playing" | "paused";
      emittedAt: number;
    }
  | { type: "sync:request-state" };
