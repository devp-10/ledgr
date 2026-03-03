#!/usr/bin/env bash
# make_icon.sh — Generate Ledgr.app/Contents/Resources/AppIcon.icns from icon.svg
# Run this once on your Mac after cloning the repo.
#
# Requires one of:
#   brew install librsvg        (rsvg-convert)
#   pip install cairosvg        (cairosvg)
#   brew install inkscape       (inkscape)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SVG="$SCRIPT_DIR/icon.svg"
ICONSET="$SCRIPT_DIR/AppIcon.iconset"
RESOURCES="$SCRIPT_DIR/Ledgr.app/Contents/Resources"
OUTPUT="$RESOURCES/AppIcon.icns"

# ── Pick an SVG→PNG converter ──────────────────────────────────────────────
svg_to_png() {
    local size=$1 out=$2
    if command -v rsvg-convert &>/dev/null; then
        rsvg-convert -w "$size" -h "$size" "$SVG" -o "$out"
    elif command -v cairosvg &>/dev/null; then
        python3 -c "
import cairosvg
cairosvg.svg2png(url='$SVG', write_to='$out', output_width=$size, output_height=$size)
"
    elif command -v inkscape &>/dev/null; then
        inkscape -w "$size" -h "$size" --export-type=png --export-filename="$out" "$SVG" \
            2>/dev/null
    else
        echo "Error: no SVG converter found."
        echo "Install one of: brew install librsvg  |  pip install cairosvg  |  brew install inkscape"
        exit 1
    fi
}

echo "Building AppIcon.icns from icon.svg..."
rm -rf "$ICONSET"
mkdir -p "$ICONSET" "$RESOURCES"

# macOS iconset requires these exact filenames
svg_to_png 16   "$ICONSET/icon_16x16.png"
svg_to_png 32   "$ICONSET/icon_16x16@2x.png"
svg_to_png 32   "$ICONSET/icon_32x32.png"
svg_to_png 64   "$ICONSET/icon_32x32@2x.png"
svg_to_png 128  "$ICONSET/icon_128x128.png"
svg_to_png 256  "$ICONSET/icon_128x128@2x.png"
svg_to_png 256  "$ICONSET/icon_256x256.png"
svg_to_png 512  "$ICONSET/icon_256x256@2x.png"
svg_to_png 512  "$ICONSET/icon_512x512.png"
svg_to_png 1024 "$ICONSET/icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$OUTPUT"
rm -rf "$ICONSET"

echo "Done → $OUTPUT"
