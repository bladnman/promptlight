#!/bin/bash
#
# Sync version across all config files
# Uses package.json as the source of truth
#
# Usage: ./scripts/sync-version.sh [version]
#
# If no version is provided, reads from package.json and syncs to other files.
# If a version is provided, sets that version in all files.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Files containing version
PACKAGE_JSON="$ROOT_DIR/package.json"
TAURI_CONF="$ROOT_DIR/src-tauri/tauri.conf.json"
CARGO_TOML="$ROOT_DIR/src-tauri/Cargo.toml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

get_version_from_package() {
    grep '"version"' "$PACKAGE_JSON" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/'
}

get_version_from_tauri() {
    grep '"version"' "$TAURI_CONF" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/'
}

get_version_from_cargo() {
    grep '^version = ' "$CARGO_TOML" | head -1 | sed 's/.*= *"\([^"]*\)".*/\1/'
}

update_all_versions() {
    local version="$1"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$PACKAGE_JSON"
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$TAURI_CONF"
        sed -i '' "s/^version = \"[^\"]*\"/version = \"$version\"/" "$CARGO_TOML"
    else
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$PACKAGE_JSON"
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$TAURI_CONF"
        sed -i "s/^version = \"[^\"]*\"/version = \"$version\"/" "$CARGO_TOML"
    fi
}

show_versions() {
    echo "Current versions:"
    echo "  package.json:     $(get_version_from_package)"
    echo "  tauri.conf.json:  $(get_version_from_tauri)"
    echo "  Cargo.toml:       $(get_version_from_cargo)"
}

main() {
    local target_version="$1"

    if [[ -z "$target_version" ]]; then
        # No version provided, sync from package.json
        target_version=$(get_version_from_package)
        echo -e "${YELLOW}Syncing version from package.json: $target_version${NC}"
    else
        # Validate version format
        if [[ ! "$target_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "Error: Invalid version format '$target_version' (expected: X.Y.Z)"
            exit 1
        fi
        echo -e "${YELLOW}Setting version: $target_version${NC}"
    fi

    echo ""
    echo "Before:"
    show_versions

    update_all_versions "$target_version"

    echo ""
    echo "After:"
    show_versions

    echo ""
    echo -e "${GREEN}Version sync complete!${NC}"
}

main "$@"
