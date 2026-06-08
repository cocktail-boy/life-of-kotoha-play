import type { TimeOfDay } from "./world";

// Per-time-of-day gradients, shown behind the video for instant first paint
// (and as a graceful fallback). Ported from MomentCatalog.placeholder colors.
export const timeGradient: Record<TimeOfDay, string> = {
  morning: "linear-gradient(160deg, #ffd9b3 0%, #fab38c 100%)",
  day: "linear-gradient(160deg, #bfe0fa 0%, #f2ede0 100%)",
  evening: "linear-gradient(160deg, #8c598c 0%, #e68c73 100%)",
  night: "linear-gradient(160deg, #141a38 0%, #332e61 100%)",
};
