// The shape of Kotoha's world, ported from the Swift app's Scene/ enums.
// One activity per (city, time-of-day) cell; assets are keyed by city x time.

export type City = "tokyo" | "london" | "sf";
export type TimeOfDay = "morning" | "day" | "evening" | "night";

export const CITIES: City[] = ["tokyo", "london", "sf"];
export const TIMES: TimeOfDay[] = ["morning", "day", "evening", "night"];

export const cityDisplayName: Record<City, string> = {
  tokyo: "Tokyo",
  london: "London",
  sf: "San Francisco",
};

export const cityShortName: Record<City, string> = {
  tokyo: "Tokyo",
  london: "London",
  sf: "SF",
};

const cityTimeZone: Record<City, string> = {
  tokyo: "Asia/Tokyo",
  london: "Europe/London",
  sf: "America/Los_Angeles",
};

// One chosen activity per cell — display label only (assets are keyed by
// city x time, not by activity). Mirrors MomentCatalog.cellActivity.
export const cellActivity: Record<City, Record<TimeOfDay, string>> = {
  tokyo: { morning: "morning coffee", day: "studying", evening: "evening stroll", night: "winding down" },
  london: { morning: "garden yoga", day: "reading", evening: "with a friend", night: "rainy night" },
  sf: { morning: "waterfront yoga", day: "working", evening: "hillside walk", night: "late unwind" },
};

/** The player's "home" city — the nearest of Kotoha's three, from the device
 *  timezone region. Mirrors City.home(for:). Defaults to SF (Americas). */
export function homeCity(timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone): City {
  const region = timeZone.split("/")[0] ?? "";
  switch (region) {
    case "Asia":
    case "Australia":
    case "Indian":
    case "Antarctica":
      return "tokyo";
    case "Europe":
    case "Africa":
    case "Atlantic":
    case "Arctic":
      return "london";
    default:
      return "sf";
  }
}

/** Time-of-day bucket from an hour (0–23). Mirrors TimeOfDay.from. */
export function timeOfDayFromHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/** Current local hour in a given city, via the Intl API. */
export function hourInCity(city: City, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: cityTimeZone[city],
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  return hour === 24 ? 0 : hour;
}

/** The live "home" moment: your nearest city + its current time of day. */
export function homeMoment(now: Date = new Date()): { city: City; time: TimeOfDay } {
  const city = homeCity();
  return { city, time: timeOfDayFromHour(hourInCity(city, now)) };
}

/** Wrap-around cycling over an ordered list (swipe / world-advance nav). */
export function cycled<T>(list: T[], value: T, offset: number): T {
  const n = list.length;
  const i = list.indexOf(value);
  const idx = i < 0 ? 0 : i;
  return list[(((idx + offset) % n) + n) % n];
}

// Asset key helpers — file names baked by the asset pipeline.
const slug = (city: City, time: TimeOfDay) => `moment_${city}_${time}`;

export const candidVideo = (city: City, time: TimeOfDay) => `${slug(city, time)}_candid`;
export const noticeVideo = (city: City, time: TimeOfDay) => `${slug(city, time)}_notice`;
export const returnVideo = (city: City, time: TimeOfDay) => `${slug(city, time)}_return`;
export const bgmTrack = (city: City, time: TimeOfDay) => `bgm_${city}_${time}`;
