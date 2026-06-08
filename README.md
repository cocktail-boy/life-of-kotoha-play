# Life of Kotoha — web

The free web version of **Life of Kotoha**: an ambient world
clock where Kotoha lives her day across **Tokyo, London, and San Francisco**.
Look in; tap to say hello and she glances back before drifting into her own
world again.

This is the **Calm** mood only — a complete free taste of the paid iPhone/iPad
app. Vanilla **TypeScript + [Vite](https://vite.dev)**, no UI framework: it's
mostly media playback over a small bit of time logic ported from the native app.

> Support & privacy live in the separate
> [life-of-kotoha-site](https://cocktail-boy.github.io/life-of-kotoha-site/) repo
> (the App Store support page); the in-app "About & privacy" link points there.
> That repo is deliberately untouched so the App Store support URL keeps working.

## Develop

```sh
npm install
npm run sync-assets   # (maintainer) copies Calm videos/audio into public/assets
npm run dev           # http://localhost:5173
npm run build         # tsc + vite -> dist/  (static, deploy anywhere)
npm run preview       # serve the built dist/
```

> Use a standard Node (a Homebrew/nvm/official install). Some sandboxed Node
> builds can't load Vite/Rollup's native binary and will fail `npm run build`.

## Project layout

```
index.html        app shell: two <video> layers, gradient backdrop, chrome
src/
  main.ts         World controller — navigation, clock tick, sound gate, render
  world.ts        the city / time-of-day / moment model (ported from the native app)
  scene.ts        video state machine (idle -> notice -> return) w/ crossfade
  audio.ts        one-shot per-cell BGM; advances the world on track end
  theme.ts        per-time-of-day gradient (ported from the native app)
  style.css       9:16 portrait framing + chrome styling
scripts/
  sync-assets.sh  rsync Calm .mp4/.mp3 into public/assets (maintainer-only source)
public/assets/    synced media (committed, ~147 MB)
```

`src/world.ts` mirrors the native app's model so the two stay in sync: home-city
by timezone region, time-of-day buckets (5/11/17/21h), per-cell activity labels,
and the asset-key naming.

## How it works

- **Idle** — the cell's `_candid` clip loops, muted (the mood comes from the BGM).
- **Tap the scene** — plays `_notice` (she looks back) → `_return` (she drifts
  off) → back to the idle loop, **crossfading two `<video>` layers** so cell and
  clip changes never flash black. A generation counter cancels a stale reaction
  if you tap or navigate mid-sequence.
- **Sound** — **off by default**; the speaker button (🔇) is the gate. The first
  tap unlocks audio (browsers block it until a user gesture) and starts the
  current cell's bed; later taps mute/unmute. Tapping the scene or chips never
  touches audio. When a track ends, the world **advances a cell** (night → next
  city's morning), gently touring all twelve.
- **Navigation** — the title returns to *your* moment (nearest city by device
  timezone, current time of day); city chips jump to that city's live moment;
  time chips change time of day. A minute clock-tick keeps "home" following real
  time when you're sitting on it.

## Framing

The painted scenes are **9:16 vertical**. The stage renders as a centered 9:16
portrait card: it fills the screen on a phone in portrait, and stays a centered
card (letterboxed) on a wide/desktop window so the full scene — face included —
is always visible (`src/style.css`).

## Assets

`npm run sync-assets` mirrors the Calm mood's already-web-playable files into
`public/assets/` (committed to this repo). It's a maintainer step pulling from the
source app; contributors just use the committed media. Naming, keyed by cell:

- `public/assets/videos/moment_<city>_<time>_{candid,notice,return}.mp4`
- `public/assets/audio/bgm_<city>_<time>.mp3`

`<city>` ∈ {`tokyo`,`london`,`sf`}, `<time>` ∈ {`morning`,`day`,`evening`,`night`}
→ 36 clips + 12 tracks. The app lazy-loads only the current cell's media.

## Related

- **[life-of-kotoha-site](https://cocktail-boy.github.io/life-of-kotoha-site/)** —
  the App Store support + privacy page (where the in-app "About & privacy" link
  points).
- **this repo** — the free web app.
