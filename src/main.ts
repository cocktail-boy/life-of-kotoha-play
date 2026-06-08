import "./style.css";
import { Scene } from "./scene";
import { AudioController } from "./audio";
import { timeGradient } from "./theme";
import {
  CITIES,
  TIMES,
  cellActivity,
  chibiAsset,
  chibiBase,
  clockInCity,
  cityShortName,
  cityDisplayName,
  cycled,
  homeMoment,
  hourInCity,
  timeOfDayFromHour,
  type City,
  type TimeOfDay,
} from "./world";

const chibiURL = (name: string) =>
  `${import.meta.env.BASE_URL}assets/chibi/${name}.png`;

const $ = <T extends HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`missing element: ${sel}`);
  return el;
};

const backdrop = $<HTMLDivElement>("#backdrop");
const layerA = $<HTMLVideoElement>("#layer-a");
const layerB = $<HTMLVideoElement>("#layer-b");
const stage = $<HTMLDivElement>("#stage");
const titleBtn = $<HTMLButtonElement>("#title");
const muteBtn = $<HTMLButtonElement>("#mute");
const cityBar = $<HTMLDivElement>("#cities");
const timeBar = $<HTMLDivElement>("#times");
const caption = $<HTMLParagraphElement>("#caption");

class World {
  private scene: Scene;
  private audio = new AudioController();
  private viewedCity: City;
  private viewedTime: TimeOfDay;
  private homeCity: City;
  private homeTime: TimeOfDay;
  private started = false;

  constructor() {
    const home = homeMoment();
    this.homeCity = home.city;
    this.homeTime = home.time;
    this.viewedCity = home.city;
    this.viewedTime = home.time;
    this.scene = new Scene(layerA, layerB, home.city, home.time);
    this.audio.onTrackFinished = () => this.advanceWorld();
  }

  private get isOnHome() {
    return this.viewedCity === this.homeCity && this.viewedTime === this.homeTime;
  }

  async start() {
    this.buildBars();
    await this.scene.show(this.viewedCity, this.viewedTime);
    this.render();
    this.wire();
    // Tick the world clock on each wall-clock minute boundary; if the viewer is
    // sitting on home, advance the scene with it too.
    this.scheduleClockTick();
    // Animate the active time-of-day chibi (matches the native app's 0.25s frames).
    this.tickChibi();
    window.setInterval(() => this.tickChibi(), 250);
  }

  /** Self-rescheduling tick aligned to the next wall-clock minute. */
  private scheduleClockTick() {
    const now = new Date();
    const msToNextMinute = 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds());
    window.setTimeout(() => {
      this.tickClock();
      this.scheduleClockTick();
    }, msToNextMinute + 20);
  }

  private wire() {
    stage.addEventListener("click", () => {
      void this.scene.notice();
    });

    titleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.goHome();
    });

    // Sound starts off (browsers block it pre-gesture anyway, and silent-by-
    // default is calmer). The speaker button is the gate: the first tap unlocks
    // and starts the current cell's bed; later taps mute/unmute.
    muteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleSound();
    });
    this.setSoundButton(true);
  }

  private toggleSound() {
    if (!this.started) {
      this.started = true;
      this.audio.setMuted(false);
      this.audio.play(this.viewedCity, this.viewedTime);
      this.setSoundButton(false);
      return;
    }
    this.setSoundButton(this.audio.toggleMute());
  }

  private setSoundButton(muted: boolean) {
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Turn on sound" : "Mute");
  }

  private buildBars() {
    for (const city of CITIES) {
      const b = document.createElement("button");
      b.dataset.city = city;
      b.className = "chip";
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showCity(city);
      });
      cityBar.appendChild(b);
    }
    for (const time of TIMES) {
      const b = document.createElement("button");
      b.dataset.time = time;
      b.className = "chip-time";
      b.setAttribute("aria-label", time);
      b.title = time;
      const img = document.createElement("img");
      img.className = "chibi";
      img.alt = time;
      img.draggable = false;
      img.dataset.frame = chibiBase(time);
      img.src = chibiURL(chibiBase(time));
      b.appendChild(img);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        this.showTime(time);
      });
      timeBar.appendChild(b);
    }
    this.preloadChibi();
  }

  /** Warm the cache so the active icon's animation frames swap without flicker. */
  private preloadChibi() {
    for (const time of TIMES) {
      for (const suffix of ["", "_blink", "_bounce", "_sway"]) {
        new Image().src = chibiURL(`${chibiBase(time)}${suffix}`);
      }
    }
  }

  /** Drive the active chibi's blink/bounce/sway loop (others rest on base). */
  private tickChibi() {
    const now = new Date();
    const secondInMinute = now.getSeconds() + now.getMilliseconds() / 1000;
    for (const b of timeBar.querySelectorAll<HTMLButtonElement>("button")) {
      const time = b.dataset.time as TimeOfDay;
      const img = b.querySelector<HTMLImageElement>("img.chibi");
      if (!img) continue;
      const frame = time === this.viewedTime
        ? chibiAsset(time, secondInMinute)
        : chibiBase(time);
      if (img.dataset.frame !== frame) {
        img.dataset.frame = frame;
        img.src = chibiURL(frame);
      }
    }
  }

  // --- navigation (ported from IdleSceneModel) ---

  private showCity(city: City) {
    const time = timeOfDayFromHour(hourInCity(city));
    this.setViewed(city, time);
  }

  private showTime(time: TimeOfDay) {
    this.setViewed(this.viewedCity, time);
  }

  private goHome() {
    const home = homeMoment();
    this.homeCity = home.city;
    this.homeTime = home.time;
    this.setViewed(home.city, home.time);
  }

  private tickClock() {
    const wasHome = this.isOnHome;
    const home = homeMoment();
    this.homeCity = home.city;
    this.homeTime = home.time;
    if (wasHome && (this.viewedCity !== home.city || this.viewedTime !== home.time)) {
      this.setViewed(home.city, home.time); // renders
    } else {
      this.render(); // keep the world clock's HH:MM advancing
    }
  }

  /** A finished track advances to the next moment in the day/world cycle. */
  private advanceWorld() {
    if (this.viewedTime === "night") {
      this.setViewed(cycled(CITIES, this.viewedCity, 1), "morning");
    } else {
      this.setViewed(this.viewedCity, cycled(TIMES, this.viewedTime, 1));
    }
  }

  private setViewed(city: City, time: TimeOfDay) {
    const changed = city !== this.viewedCity || time !== this.viewedTime;
    this.viewedCity = city;
    this.viewedTime = time;
    void this.scene.show(city, time);
    if (changed && this.started) this.audio.play(city, time);
    this.render();
  }

  private render() {
    backdrop.style.background = timeGradient[this.viewedTime];
    caption.textContent = cellActivity[this.viewedCity][this.viewedTime];

    for (const b of cityBar.querySelectorAll<HTMLButtonElement>("button")) {
      const city = b.dataset.city as City;
      b.innerHTML = `<span class="chip-name">${cityShortName[city]}</span><span class="chip-sub">${clockInCity(city)}</span>`;
      b.title = cityDisplayName[city];
      b.classList.toggle("is-active", city === this.viewedCity);
    }
    for (const b of timeBar.querySelectorAll<HTMLButtonElement>("button")) {
      b.classList.toggle("is-active", (b.dataset.time as TimeOfDay) === this.viewedTime);
    }
  }
}

void new World().start();
