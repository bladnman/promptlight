#!/bin/bash
# Generate all app icons from SVG sources
#
# Usage:
#   ./scripts/ingest-icon.sh                    # Use default SVGs from assets/icons/
#   ./scripts/ingest-icon.sh <squared.svg>      # Custom squared SVG (bundle icons)
#   ./scripts/ingest-icon.sh <squared.svg> <rounded.svg>  # Both custom
#
# Icons generated:
#   - src-tauri/icons/*  : Bundle icons (squared - macOS rounds them)
#   - public/app-icon.png: In-app UI icon (rounded, with transparency)
#
# Requires: librsvg (brew install librsvg)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DEST="$PROJECT_DIR/src-tauri/icons"
ICONSET="/tmp/icon.iconset"

cd "$PROJECT_DIR"

# Check for rsvg-convert (preferred for proper transparency)
if command -v rsvg-convert &> /dev/null; then
    CONVERTER="rsvg"
elif command -v magick &> /dev/null; then
    echo "Warning: Using ImageMagick. For better transparency, install librsvg:"
    echo "  brew install librsvg"
    CONVERTER="magick"
else
    echo "Error: No SVG converter found. Install librsvg:"
    echo "  brew install librsvg"
    exit 1
fi

# Default SVG sources
DEFAULT_SQUARED="assets/icons/icon_promptlight_ANGLED_squared.svg"
DEFAULT_ROUNDED="assets/icons/icon_promptlight_ANGLED_rounded.svg"

# Parse arguments
SQUARED_SVG="${1:-$DEFAULT_SQUARED}"
ROUNDED_SVG="${2:-$DEFAULT_ROUNDED}"

# Validate files
if [ ! -f "$SQUARED_SVG" ]; then
    echo "Error: Squared SVG not found: $SQUARED_SVG"
    exit 1
fi

if [ ! -f "$ROUNDED_SVG" ]; then
    echo "Warning: Rounded SVG not found: $ROUNDED_SVG"
    echo "         Using squared SVG for in-app icon too."
    ROUNDED_SVG="$SQUARED_SVG"
fi

echo "Icon Generation"
echo "==============="
echo "Squared (bundle): $SQUARED_SVG"
echo "Rounded (in-app): $ROUNDED_SVG"
echo "Converter: $CONVERTER"
echo ""

# Helper function to convert SVG to PNG
convert_svg() {
    local input="$1"
    local size="$2"
    local output="$3"

    if [ "$CONVERTER" = "rsvg" ]; then
        rsvg-convert -w "$size" -h "$size" "$input" -o "$output"
    else
        magick -background none -density 384 "$input" -resize "${size}x${size}" "PNG32:$output"
    fi
}

# === BUNDLE ICONS (squared - macOS will round them) ===
echo "Creating bundle icons (squared)..."
convert_svg "$SQUARED_SVG" 32 "$DEST/32x32.png"
convert_svg "$SQUARED_SVG" 64 "$DEST/64x64.png"
convert_svg "$SQUARED_SVG" 128 "$DEST/128x128.png"
convert_svg "$SQUARED_SVG" 256 "$DEST/128x128@2x.png"
convert_svg "$SQUARED_SVG" 512 "$DEST/icon.png"

# === IN-APP ICON (rounded - with transparency) ===
echo "Creating in-app icon (rounded)..."
convert_svg "$ROUNDED_SVG" 128 "$PROJECT_DIR/public/app-icon.png"

# === WINDOWS .ICO ===
echo "Creating Windows .ico..."
if [ "$CONVERTER" = "rsvg" ]; then
    # Create temp PNGs and combine with ImageMagick (if available) or skip
    if command -v magick &> /dev/null; then
        convert_svg "$SQUARED_SVG" 256 "/tmp/icon_256.png"
        magick /tmp/icon_256.png -define icon:auto-resize=256,128,64,48,32,16 "$DEST/icon.ico"
        rm /tmp/icon_256.png
    else
        echo "  Skipping .ico (requires ImageMagick)"
    fi
else
    magick -background none -density 384 "$SQUARED_SVG" -resize 256x256 \
        -define icon:auto-resize=256,128,64,48,32,16 "$DEST/icon.ico"
fi

# === MACOS .ICNS ===
echo "Creating macOS .icns..."
rm -rf "$ICONSET"
mkdir -p "$ICONSET"

convert_svg "$SQUARED_SVG" 16 "$ICONSET/icon_16x16.png"
convert_svg "$SQUARED_SVG" 32 "$ICONSET/icon_16x16@2x.png"
convert_svg "$SQUARED_SVG" 32 "$ICONSET/icon_32x32.png"
convert_svg "$SQUARED_SVG" 64 "$ICONSET/icon_32x32@2x.png"
convert_svg "$SQUARED_SVG" 128 "$ICONSET/icon_128x128.png"
convert_svg "$SQUARED_SVG" 256 "$ICONSET/icon_128x128@2x.png"
convert_svg "$SQUARED_SVG" 256 "$ICONSET/icon_256x256.png"
convert_svg "$SQUARED_SVG" 512 "$ICONSET/icon_256x256@2x.png"
convert_svg "$SQUARED_SVG" 512 "$ICONSET/icon_512x512.png"
convert_svg "$SQUARED_SVG" 1024 "$ICONSET/icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$DEST/icon.icns"
rm -rf "$ICONSET"

# === WINDOWS STORE LOGOS ===
echo "Creating Windows Store logos..."
convert_svg "$SQUARED_SVG" 30 "$DEST/Square30x30Logo.png"
convert_svg "$SQUARED_SVG" 44 "$DEST/Square44x44Logo.png"
convert_svg "$SQUARED_SVG" 71 "$DEST/Square71x71Logo.png"
convert_svg "$SQUARED_SVG" 89 "$DEST/Square89x89Logo.png"
convert_svg "$SQUARED_SVG" 107 "$DEST/Square107x107Logo.png"
convert_svg "$SQUARED_SVG" 142 "$DEST/Square142x142Logo.png"
convert_svg "$SQUARED_SVG" 150 "$DEST/Square150x150Logo.png"
convert_svg "$SQUARED_SVG" 284 "$DEST/Square284x284Logo.png"
convert_svg "$SQUARED_SVG" 310 "$DEST/Square310x310Logo.png"
convert_svg "$SQUARED_SVG" 50 "$DEST/StoreLogo.png"

echo ""
echo "Done! Icons generated:"
echo "  $DEST/*.png, *.ico, *.icns  (bundle icons)"
echo "  public/app-icon.png         (in-app UI icon)"
