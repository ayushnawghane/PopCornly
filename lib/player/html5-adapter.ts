import type { VideoPlayerAdapter } from "./types";

export class Html5Adapter implements VideoPlayerAdapter {
  private video: HTMLVideoElement | null = null;
  private ready = false;
  private readyCbs = new Set<() => void>();
  private readyListener = () => {
    this.ready = true;
    this.readyCbs.forEach((cb) => cb());
  };

  attachNativePlayer(video: HTMLVideoElement) {
    this.video = video;
    if (video.readyState >= 1) {
      this.readyListener();
    } else {
      video.addEventListener("loadedmetadata", this.readyListener, { once: true });
    }
  }

  play() {
    this.video?.play().catch(() => {
      // autoplay can be blocked; the sync engine's play button click will retry
    });
  }

  pause() {
    this.video?.pause();
  }

  seekTo(seconds: number) {
    if (this.video) this.video.currentTime = seconds;
  }

  async getCurrentTime() {
    return this.video?.currentTime ?? 0;
  }

  async getDuration() {
    return this.video?.duration || 0;
  }

  async isPaused() {
    return this.video?.paused ?? true;
  }

  setPlaybackRate(rate: number) {
    if (this.video) this.video.playbackRate = rate;
  }

  onTimeUpdate(cb: (seconds: number) => void) {
    const handler = () => cb(this.video?.currentTime ?? 0);
    this.video?.addEventListener("timeupdate", handler);
    return () => this.video?.removeEventListener("timeupdate", handler);
  }

  onEnded(cb: () => void) {
    this.video?.addEventListener("ended", cb);
    return () => this.video?.removeEventListener("ended", cb);
  }

  onReady(cb: () => void) {
    if (this.ready) cb();
    this.readyCbs.add(cb);
    return () => this.readyCbs.delete(cb);
  }

  destroy() {
    this.video?.removeEventListener("loadedmetadata", this.readyListener);
    this.readyCbs.clear();
  }
}
