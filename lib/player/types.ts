export interface VideoPlayerAdapter {
  play(): void;
  pause(): void;
  seekTo(seconds: number): void;
  getCurrentTime(): Promise<number>;
  getDuration(): Promise<number>;
  isPaused(): Promise<boolean>;
  setPlaybackRate(rate: number): void;
  onTimeUpdate(cb: (seconds: number) => void): () => void;
  onEnded(cb: () => void): () => void;
  onReady(cb: () => void): () => void;
  destroy(): void;
}

export type AdapterKind = "youtube" | "vimeo" | "html5";
