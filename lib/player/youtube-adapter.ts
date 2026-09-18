import type { VideoPlayerAdapter } from "./types";

// The instance react-youtube's onReady hands back via event.target (the
// `youtube-player` package's promise-based wrapper around the IFrame API).
interface YTPlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): Promise<number> | number;
  getDuration(): Promise<number> | number;
  getPlayerState(): Promise<number> | number;
  setPlaybackRate(rate: number): void;
}

const YT_STATE_ENDED = 0;
const YT_STATE_PLAYING = 1;
const POLL_INTERVAL_MS = 250;

export class YouTubeAdapter implements VideoPlayerAdapter {
  private player: YTPlayerLike | null = null;
  private ready = false;
  private pollHandle: ReturnType<typeof setInterval> | null = null;
  private timeUpdateCbs = new Set<(seconds: number) => void>();
  private endedCbs = new Set<() => void>();
  private readyCbs = new Set<() => void>();

  attachNativePlayer(player: YTPlayerLike) {
    this.player = player;
    this.ready = true;
    this.readyCbs.forEach((cb) => cb());
    this.startPolling();
  }

  handleStateChange(state: number) {
    if (state === YT_STATE_ENDED) {
      this.endedCbs.forEach((cb) => cb());
    }
  }

  private startPolling() {
    this.pollHandle = setInterval(async () => {
      if (!this.player) return;
      const t = await this.player.getCurrentTime();
      this.timeUpdateCbs.forEach((cb) => cb(t));
    }, POLL_INTERVAL_MS);
  }

  play() {
    this.player?.playVideo();
  }

  pause() {
    this.player?.pauseVideo();
  }

  seekTo(seconds: number) {
    this.player?.seekTo(seconds, true);
  }

  async getCurrentTime() {
    return (await this.player?.getCurrentTime()) ?? 0;
  }

  async getDuration() {
    return (await this.player?.getDuration()) ?? 0;
  }

  async isPaused() {
    const state = await this.player?.getPlayerState();
    return state !== YT_STATE_PLAYING;
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
    if (this.pollHandle) clearInterval(this.pollHandle);
    this.timeUpdateCbs.clear();
    this.endedCbs.clear();
    this.readyCbs.clear();
  }
}

const YOUTUBE_ID_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
];

export function extractYouTubeId(url: string): string | null {
  for (const pattern of YOUTUBE_ID_PATTERNS) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
