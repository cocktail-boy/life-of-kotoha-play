// One-shot background music per cell. When a track finishes it doesn't loop —
// it advances the world to the next moment (night -> next city's morning),
// mirroring backgroundMusicDidFinish() in IdleSceneModel.

import { bgmTrack, type City, type TimeOfDay } from "./world";

const audioURL = (name: string) =>
  `${import.meta.env.BASE_URL}assets/audio/${name}.mp3`;

export class AudioController {
  private el = new Audio();
  private muted = false;
  /** Called when the current track ends, so the world can advance a cell. */
  onTrackFinished: (() => void) | null = null;

  constructor() {
    this.el.preload = "auto";
    this.el.addEventListener("ended", () => this.onTrackFinished?.());
  }

  /** Load and (best-effort) play the track for a cell. Needs a prior user
   *  gesture on the page for the sound to actually start. */
  play(city: City, time: TimeOfDay) {
    const track = bgmTrack(city, time);
    this.el.src = audioURL(track);
    this.el.muted = this.muted;
    // src just changed; the element rewinds itself. Setting currentTime here
    // (before it can seek) is a no-op at best, so leave it to load fresh.
    this.el.play().then(
      () => console.info(`[audio] playing ${track}`),
      (err) => console.warn(`[audio] blocked (${track}):`, err?.name ?? err),
    );
  }

  get isMuted() {
    return this.muted;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.el.muted = muted;
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Nudge a blocked track into playing (e.g. on the first tap). */
  resume() {
    if (this.el.paused) void this.el.play().catch(() => {});
  }
}
