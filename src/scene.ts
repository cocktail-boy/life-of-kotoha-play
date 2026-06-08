// The looping-video scene with a notice -> return reaction flow, using two
// stacked <video> layers that crossfade so cell/clip changes never flash black.
// Mirrors the Calm flow in IdleSceneModel (candid idle, tap = notice -> return).

import {
  candidVideo,
  noticeVideo,
  returnVideo,
  type City,
  type TimeOfDay,
} from "./world";

const videoURL = (name: string) =>
  `${import.meta.env.BASE_URL}assets/videos/${name}.mp4`;

interface PlayOpts {
  loop: boolean;
}

export class Scene {
  private front: HTMLVideoElement;
  private back: HTMLVideoElement;
  // Bumped on every cell change / new tap so a stale reaction step bails out.
  private generation = 0;
  private city: City;
  private time: TimeOfDay;
  private reacting = false;

  constructor(layerA: HTMLVideoElement, layerB: HTMLVideoElement, city: City, time: TimeOfDay) {
    this.front = layerA;
    this.back = layerB;
    this.city = city;
    this.time = time;
    for (const v of [layerA, layerB]) {
      v.muted = true; // video is silent; the mood comes from the BGM track
      v.playsInline = true;
      v.preload = "auto";
    }
  }

  get isReacting() {
    return this.reacting;
  }

  /** Switch to a cell and start its candid idle loop. */
  async show(city: City, time: TimeOfDay) {
    this.city = city;
    this.time = time;
    const gen = ++this.generation;
    this.reacting = false;
    await this.swapTo(candidVideo(city, time), { loop: true }, gen);
  }

  /** The player reached out: glance back (notice) then drift away (return). */
  async notice() {
    if (this.reacting) return;
    const gen = ++this.generation;
    this.reacting = true;
    try {
      await this.swapTo(noticeVideo(this.city, this.time), { loop: false }, gen);
      await this.untilEndedOrCancelled(this.front, gen);
      if (gen !== this.generation) return;

      await this.swapTo(returnVideo(this.city, this.time), { loop: false }, gen);
      await this.untilEndedOrCancelled(this.front, gen);
      if (gen !== this.generation) return;

      await this.swapTo(candidVideo(this.city, this.time), { loop: true }, gen);
    } finally {
      if (gen === this.generation) this.reacting = false;
    }
  }

  /** Load `name` into the back layer, start it, then crossfade it to front. */
  private async swapTo(name: string, opts: PlayOpts, gen: number) {
    const next = this.back;
    next.loop = opts.loop;
    next.src = videoURL(name);
    next.currentTime = 0;
    try {
      await this.untilCanPlay(next, gen);
      if (gen !== this.generation) return;
      await next.play().catch(() => {});
    } catch {
      // Missing/undecodable clip — keep the current layer rather than flash.
      return;
    }
    if (gen !== this.generation) return;

    next.classList.add("is-front");
    this.front.classList.remove("is-front");
    const prev = this.front;
    this.front = next;
    this.back = prev;
    // Let the crossfade finish, then pause the now-hidden layer.
    window.setTimeout(() => {
      if (prev !== this.front) prev.pause();
    }, 650);
  }

  private untilCanPlay(v: HTMLVideoElement, gen: number) {
    return new Promise<void>((resolve, reject) => {
      if (v.readyState >= 3) return resolve();
      const ok = () => {
        cleanup();
        resolve();
      };
      const fail = () => {
        cleanup();
        reject(new Error("video error"));
      };
      const tick = () => {
        if (gen !== this.generation) {
          cleanup();
          resolve();
        }
      };
      const id = window.setInterval(tick, 200);
      const cleanup = () => {
        window.clearInterval(id);
        v.removeEventListener("canplay", ok);
        v.removeEventListener("error", fail);
      };
      v.addEventListener("canplay", ok, { once: true });
      v.addEventListener("error", fail, { once: true });
    });
  }

  private untilEndedOrCancelled(v: HTMLVideoElement, gen: number) {
    return new Promise<void>((resolve) => {
      const done = () => {
        cleanup();
        resolve();
      };
      const tick = () => {
        if (gen !== this.generation) done();
      };
      const id = window.setInterval(tick, 120);
      const cleanup = () => {
        window.clearInterval(id);
        v.removeEventListener("ended", done);
      };
      v.addEventListener("ended", done, { once: true });
    });
  }
}
