#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BIN="${NOTEPUB_BIN:-notepub}"
CFG="${NOTEPUB_CONFIG:-./config.yaml}"
RULES="${NOTEPUB_RULES:-./rules.yaml}"
ART="./.notepub/artifacts"
OUT="./dist"

BASE_URL="$(awk -F'"' '/base_url:/ {print $2; exit}' "$CFG")"
BASE_URL="${BASE_URL%/}"

if ! command -v "$BIN" >/dev/null 2>&1; then
  echo "notepub binary not found: $BIN"
  echo "Set NOTEPUB_BIN, for example:"
  echo "  NOTEPUB_BIN=/path/to/notepub $0"
  exit 1
fi

echo "[1/6] generate content"
node ./scripts/generate-content.mjs

echo "[2/6] index/build"
"$BIN" index --config "$CFG" --rules "$RULES"
"$BIN" build --config "$CFG" --rules "$RULES" --artifacts "$ART" --dist "$OUT"

echo "[3/6] copy 404.html"
if [[ -f "$OUT/404/index.html" ]]; then
  cp "$OUT/404/index.html" "$OUT/404.html"
fi

echo "[4/6] normalize robots"
cat > "$OUT/robots.txt" <<ROBOTS
User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
ROBOTS

echo "[5/6] export content media"
rm -rf "$OUT/media"
mkdir -p "$OUT/media"
rsync -a --prune-empty-dirs \
  --exclude '.git/' \
  --exclude '.github/' \
  --exclude '.obsidian/' \
  --exclude '*.md' \
  ./content/ "$OUT/media/"

echo "[6/6] done -> $OUT"
