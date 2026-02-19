#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SITE_JSON="data/site.json"
CONFIG_YAML="config.yaml"

SITE_JSON_BAK="$(mktemp)"
CONFIG_YAML_BAK="$(mktemp)"
cp "$SITE_JSON" "$SITE_JSON_BAK"
cp "$CONFIG_YAML" "$CONFIG_YAML_BAK"

cleanup() {
  cp "$SITE_JSON_BAK" "$SITE_JSON"
  cp "$CONFIG_YAML_BAK" "$CONFIG_YAML"
  rm -f "$SITE_JSON_BAK" "$CONFIG_YAML_BAK"
}
trap cleanup EXIT

jq '.siteUrl="http://127.0.0.1:8080/" | .basePath="/"' "$SITE_JSON" > "${SITE_JSON}.tmp"
mv "${SITE_JSON}.tmp" "$SITE_JSON"

perl -0777 -i -pe 's|base_url: ".*"|base_url: "http://127.0.0.1:8080/"|; s|media_base_url: ".*"|media_base_url: "http://127.0.0.1:8080/media/"|' "$CONFIG_YAML"

CUSTOM_DOMAIN="" NOTEPUB_BIN="${NOTEPUB_BIN:-./notepub}" ./scripts/build.sh

echo
echo "Local build ready:"
echo "  python3 -m http.server 8080 --directory dist"
echo "Then open:"
echo "  http://127.0.0.1:8080/"
