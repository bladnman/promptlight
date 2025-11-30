#!/bin/bash
# PromptLight Build & Install Script
# Builds a release version and installs to /Applications (macOS only)

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "PromptLight Build & Install"
echo "==========================="
echo ""

# Check for macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script currently only supports macOS."
    echo "PromptLight can be built for other platforms - see Tauri documentation."
    exit 1
fi

echo "Stopping any running PromptLight instances..."
pkill -9 -f "Promptlight" 2>/dev/null || true
pkill -9 -f "promptlight" 2>/dev/null || true
sleep 1

echo "Building release version..."
npm run tauri build

echo "Installing to /Applications..."
rm -rf /Applications/Promptlight.app 2>/dev/null || true
cp -R src-tauri/target/release/bundle/macos/Promptlight.app /Applications/

echo ""
echo "Done! PromptLight installed to /Applications/Promptlight.app"
echo "Launch it from Spotlight or Finder."
