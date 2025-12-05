#!/bin/bash
# Build script for release DMGs
# Ensures GOOGLE_CLIENT_ID is set before building

set -e

# Load environment variables
if [ -f .env.local ]; then
    # Export all variables from .env.local
    set -a
    source .env.local
    set +a
fi

# Verify GOOGLE_CLIENT_ID is set
if [ -z "$GOOGLE_CLIENT_ID" ]; then
    echo "ERROR: GOOGLE_CLIENT_ID is not set!"
    echo "Please add GOOGLE_CLIENT_ID to .env.local"
    exit 1
fi

echo "Building with GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:20}..."

# Force recompile of auth module to ensure env var is embedded
touch src-tauri/src/auth/google.rs

# Build universal DMG
npm run tauri build -- --target universal-apple-darwin

# Verify the client ID is embedded
BINARY="src-tauri/target/universal-apple-darwin/release/bundle/macos/PromptLight.app/Contents/MacOS/promptlight"
if strings "$BINARY" | grep -q "googleusercontent"; then
    echo ""
    echo "SUCCESS: GOOGLE_CLIENT_ID is embedded in the binary"
    echo "DMG: src-tauri/target/universal-apple-darwin/release/bundle/dmg/PromptLight_1.2.1_universal.dmg"
else
    echo ""
    echo "ERROR: GOOGLE_CLIENT_ID was NOT embedded!"
    exit 1
fi
