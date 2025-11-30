#!/bin/bash
# Ingest an icon SVG and generate all required Tauri icon formats
# Usage: ./scripts/ingest-icon.sh <source.svg>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <source.svg>"
    echo "Example: $0 assets/icons/icon_promptlight_ANGLED_rounded.svg"
    exit 1
fi

SOURCE="$1"
DEST="src-tauri/icons"
ICONSET="/tmp/icon.iconset"

if [ ! -f "$SOURCE" ]; then
    echo "Error: Source file '$SOURCE' not found"
    exit 1
fi

if ! command -v magick &> /dev/null; then
    echo "Error: ImageMagick not found. Install with: brew install imagemagick"
    exit 1
fi

echo "Ingesting icon from: $SOURCE"
echo ""

# Standard Tauri PNGs
echo "Creating standard PNGs..."
magick -background none -density 384 "$SOURCE" -resize 32x32 "$DEST/32x32.png"
magick -background none -density 384 "$SOURCE" -resize 64x64 "$DEST/64x64.png"
magick -background none -density 384 "$SOURCE" -resize 128x128 "$DEST/128x128.png"
magick -background none -density 384 "$SOURCE" -resize 256x256 "$DEST/128x128@2x.png"
magick -background none -density 384 "$SOURCE" -resize 512x512 "$DEST/icon.png"

# Windows .ico
echo "Creating Windows .ico..."
magick -background none -density 384 "$SOURCE" -resize 256x256 \
    -define icon:auto-resize=256,128,64,48,32,16 "$DEST/icon.ico"

# macOS .icns (requires iconutil + sips for proper PNG format)
echo "Creating macOS .icns..."
rm -rf "$ICONSET"
mkdir -p "$ICONSET"
# Create 1024px source PNG first, then use sips to resize (produces iconutil-compatible PNGs)
magick -background none -density 384 "$SOURCE" -resize 1024x1024 /tmp/source_1024.png
sips -z 16 16 /tmp/source_1024.png --out "$ICONSET/icon_16x16.png" > /dev/null
sips -z 32 32 /tmp/source_1024.png --out "$ICONSET/icon_16x16@2x.png" > /dev/null
sips -z 32 32 /tmp/source_1024.png --out "$ICONSET/icon_32x32.png" > /dev/null
sips -z 64 64 /tmp/source_1024.png --out "$ICONSET/icon_32x32@2x.png" > /dev/null
sips -z 128 128 /tmp/source_1024.png --out "$ICONSET/icon_128x128.png" > /dev/null
sips -z 256 256 /tmp/source_1024.png --out "$ICONSET/icon_128x128@2x.png" > /dev/null
sips -z 256 256 /tmp/source_1024.png --out "$ICONSET/icon_256x256.png" > /dev/null
sips -z 512 512 /tmp/source_1024.png --out "$ICONSET/icon_256x256@2x.png" > /dev/null
sips -z 512 512 /tmp/source_1024.png --out "$ICONSET/icon_512x512.png" > /dev/null
sips -z 1024 1024 /tmp/source_1024.png --out "$ICONSET/icon_512x512@2x.png" > /dev/null
iconutil -c icns "$ICONSET" -o "$DEST/icon.icns"
rm -rf "$ICONSET" /tmp/source_1024.png

# Windows Store logos
echo "Creating Windows Store logos..."
magick -background none -density 384 "$SOURCE" -resize 30x30 "$DEST/Square30x30Logo.png"
magick -background none -density 384 "$SOURCE" -resize 44x44 "$DEST/Square44x44Logo.png"
magick -background none -density 384 "$SOURCE" -resize 71x71 "$DEST/Square71x71Logo.png"
magick -background none -density 384 "$SOURCE" -resize 89x89 "$DEST/Square89x89Logo.png"
magick -background none -density 384 "$SOURCE" -resize 107x107 "$DEST/Square107x107Logo.png"
magick -background none -density 384 "$SOURCE" -resize 142x142 "$DEST/Square142x142Logo.png"
magick -background none -density 384 "$SOURCE" -resize 150x150 "$DEST/Square150x150Logo.png"
magick -background none -density 384 "$SOURCE" -resize 284x284 "$DEST/Square284x284Logo.png"
magick -background none -density 384 "$SOURCE" -resize 310x310 "$DEST/Square310x310Logo.png"
magick -background none -density 384 "$SOURCE" -resize 50x50 "$DEST/StoreLogo.png"

echo ""
echo "Done! Icons generated in $DEST"
ls -la "$DEST"/*.png "$DEST"/*.ico "$DEST"/*.icns 2>/dev/null | head -20
