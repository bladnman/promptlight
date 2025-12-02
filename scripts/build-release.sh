#!/bin/bash
# Build a signed release for distribution
# Creates DMG with stable "PromptLight Dev" certificate identity

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "PromptLight Release Build"
echo "========================="
echo ""

# Check for signing certificate
if ! security find-identity -v -p codesigning | grep -q "PromptLight Dev"; then
    echo -e "${YELLOW}Warning: 'PromptLight Dev' certificate not found.${NC}"
    echo "Run scripts/create-dev-certificate.sh first for stable identity."
    echo ""
    read -p "Continue with ad-hoc signing? [y/N] " -n 1 -r
    echo ""
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
    SIGN_IDENTITY="-"
else
    SIGN_IDENTITY="PromptLight Dev"
    echo "Using certificate: $SIGN_IDENTITY"
fi

# Build release
echo ""
echo "Building release..."
npm run tauri build

# Get version from tauri.conf.json
VERSION=$(grep '"version"' src-tauri/tauri.conf.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "Version: $VERSION"

# Sign the app bundle with entitlements
BUNDLE_PATH="src-tauri/target/release/bundle/macos/Promptlight.app"
ENTITLEMENTS="src-tauri/entitlements.plist"

if [[ -f "$BUNDLE_PATH/Contents/MacOS/promptlight" ]]; then
    echo ""
    echo "Signing with entitlements..."
    codesign --force --deep --sign "$SIGN_IDENTITY" --entitlements "$ENTITLEMENTS" "$BUNDLE_PATH"
    echo "Signed: $BUNDLE_PATH"
fi

# Output locations
echo ""
echo -e "${GREEN}Build complete!${NC}"
echo ""
echo "Release artifacts:"
echo "  DMG: src-tauri/target/release/bundle/dmg/PromptLight_${VERSION}_aarch64.dmg"
echo "  App: $BUNDLE_PATH"
echo ""
echo "To upload to GitHub:"
echo "  1. Go to https://github.com/YOUR_ORG/promptlight/releases"
echo "  2. Create a new release with tag v${VERSION}"
echo "  3. Upload the DMG file"
