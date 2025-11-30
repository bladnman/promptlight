#!/bin/bash
# PromptLight Development Server
# Kills existing processes and starts fresh dev server with hot reload

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Cleaning up existing dev processes..."

# Kill existing dev processes on default port
lsof -ti:1420 | xargs kill -9 2>/dev/null || true

# Kill any running Tauri dev builds
pkill -9 -f "target/(debug|release)/promptlight" 2>/dev/null || true
pkill -9 -f "node.*tauri" 2>/dev/null || true

sleep 1

# Verify port is free
if lsof -i:1420 >/dev/null 2>&1; then
    echo "Warning: Port 1420 still in use"
    lsof -i:1420
fi

echo "Starting dev server..."
npm run tauri:dev
