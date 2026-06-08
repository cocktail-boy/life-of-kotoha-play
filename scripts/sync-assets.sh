#!/usr/bin/env bash
# Maintainer step: copy the Calm mood's web-playable assets from the source app
# into public/assets so the web version can serve them. The synced media is
# committed to this repo, so contributors don't need to run this — re-run only
# when the source assets change.
#
# Usage: bash scripts/sync-assets.sh /path/to/source-app
#    or: APP_REPO=/path/to/source-app npm run sync-assets
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_REPO="${1:-${APP_REPO:-}}"
if [[ -z "$APP_REPO" ]]; then
  echo "error: pass the source app repo path (or set APP_REPO):" >&2
  echo "  bash scripts/sync-assets.sh /path/to/source-app" >&2
  exit 1
fi
SRC="$APP_REPO/Moods/Calm/Resources"
DEST="$HERE/public/assets"

if [[ ! -d "$SRC" ]]; then
  echo "error: source not found: $SRC" >&2
  echo "check the app repo path passed to this script" >&2
  exit 1
fi

mkdir -p "$DEST/videos" "$DEST/audio"
echo "Syncing Calm videos -> public/assets/videos"
rsync -a --delete "$SRC/Videos/" "$DEST/videos/"
echo "Syncing Calm audio  -> public/assets/audio"
rsync -a --delete "$SRC/Audio/" "$DEST/audio/"

VID=$(find "$DEST/videos" -name '*.mp4' | wc -l | tr -d ' ')
AUD=$(find "$DEST/audio" -name '*.mp3' | wc -l | tr -d ' ')
TOTAL=$(du -sh "$DEST" | cut -f1)
echo "Done: $VID videos, $AUD audio tracks ($TOTAL total)."
