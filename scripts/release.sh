#!/bin/bash
#
# Release script for PromptLight
# Usage: ./scripts/release.sh [major|minor|patch|<version>]
#
# Examples:
#   ./scripts/release.sh patch     # 0.1.0 -> 0.1.1
#   ./scripts/release.sh minor     # 0.1.0 -> 0.2.0
#   ./scripts/release.sh major     # 0.1.0 -> 1.0.0
#   ./scripts/release.sh 2.0.0     # Set specific version
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Files containing version
PACKAGE_JSON="$ROOT_DIR/package.json"
TAURI_CONF="$ROOT_DIR/src-tauri/tauri.conf.json"
CARGO_TOML="$ROOT_DIR/src-tauri/Cargo.toml"

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Get current version from package.json (source of truth)
get_current_version() {
    grep '"version"' "$PACKAGE_JSON" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/'
}

# Bump version based on type
bump_version() {
    local current="$1"
    local bump_type="$2"

    IFS='.' read -r major minor patch <<< "$current"

    case "$bump_type" in
        major)
            echo "$((major + 1)).0.0"
            ;;
        minor)
            echo "$major.$((minor + 1)).0"
            ;;
        patch)
            echo "$major.$minor.$((patch + 1))"
            ;;
        *)
            # Assume it's a specific version
            if [[ "$bump_type" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
                echo "$bump_type"
            else
                print_error "Invalid version format: $bump_type (expected: major|minor|patch|X.Y.Z)"
            fi
            ;;
    esac
}

# Update version in all config files
update_version() {
    local new_version="$1"

    # Update package.json
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$TAURI_CONF"
        sed -i '' "s/^version = \"[^\"]*\"/version = \"$new_version\"/" "$CARGO_TOML"
    else
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$PACKAGE_JSON"
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$TAURI_CONF"
        sed -i "s/^version = \"[^\"]*\"/version = \"$new_version\"/" "$CARGO_TOML"
    fi
}

# Verify versions are in sync
verify_versions() {
    local expected="$1"

    local pkg_version=$(grep '"version"' "$PACKAGE_JSON" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    local tauri_version=$(grep '"version"' "$TAURI_CONF" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    local cargo_version=$(grep '^version = ' "$CARGO_TOML" | head -1 | sed 's/.*= *"\([^"]*\)".*/\1/')

    if [[ "$pkg_version" != "$expected" ]] || [[ "$tauri_version" != "$expected" ]] || [[ "$cargo_version" != "$expected" ]]; then
        print_error "Version mismatch after update:\n  package.json: $pkg_version\n  tauri.conf.json: $tauri_version\n  Cargo.toml: $cargo_version"
    fi
}

# Main release flow
main() {
    local bump_type="${1:-patch}"

    cd "$ROOT_DIR"

    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     PromptLight Release Script       ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""

    # Check for uncommitted changes
    if [[ -n $(git status --porcelain) ]]; then
        print_error "Working directory has uncommitted changes. Please commit or stash them first."
    fi

    # Ensure we're on the main branch (or allow override)
    local current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" && "$current_branch" != "master" ]]; then
        print_warning "Not on main/master branch (current: $current_branch)"
        read -p "Continue anyway? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Get and display current version
    local current_version=$(get_current_version)
    local new_version=$(bump_version "$current_version" "$bump_type")

    print_step "Current version: ${YELLOW}$current_version${NC}"
    print_step "New version:     ${GREEN}$new_version${NC}"
    echo ""

    # Confirm release
    read -p "Proceed with release v$new_version? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Release cancelled."
        exit 0
    fi

    echo ""

    # Step 1: Update version in all files
    print_step "Updating version in config files..."
    update_version "$new_version"
    verify_versions "$new_version"
    print_success "Version updated to $new_version in all files"

    # Step 2: Update Cargo.lock
    print_step "Updating Cargo.lock..."
    (cd "$ROOT_DIR/src-tauri" && cargo check --quiet 2>/dev/null || true)
    print_success "Cargo.lock updated"

    # Step 3: Run validation
    print_step "Running validation (lint, build, test)..."
    if ! npm run check; then
        # Rollback version changes
        git checkout -- "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML" "$ROOT_DIR/src-tauri/Cargo.lock" 2>/dev/null || true
        print_error "Validation failed. Version changes have been rolled back."
    fi
    print_success "All checks passed"

    # Step 4: Commit version bump
    print_step "Committing version bump..."
    git add "$PACKAGE_JSON" "$TAURI_CONF" "$CARGO_TOML" "$ROOT_DIR/src-tauri/Cargo.lock"
    git commit -m "$(cat <<EOF
chore(release): bump version to $new_version

- Updated package.json
- Updated tauri.conf.json
- Updated Cargo.toml
EOF
)"
    print_success "Version bump committed"

    # Step 5: Create git tag
    print_step "Creating git tag v$new_version..."
    git tag -a "v$new_version" -m "Release v$new_version"
    print_success "Tag v$new_version created"

    # Step 6: Push
    echo ""
    print_step "Ready to push. This will:"
    echo "    - Push the version bump commit"
    echo "    - Push the tag v$new_version"
    echo "    - Trigger GitHub Actions to build and create release"
    echo ""

    read -p "Push to origin? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_step "Pushing to origin..."
        git push origin "$current_branch"
        git push origin "v$new_version"
        print_success "Pushed to origin"

        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  Release v$new_version initiated successfully!          ${NC}"
        echo -e "${GREEN}║                                                      ║${NC}"
        echo -e "${GREEN}║  GitHub Actions will now:                            ║${NC}"
        echo -e "${GREEN}║  1. Build the app for all platforms                  ║${NC}"
        echo -e "${GREEN}║  2. Create a GitHub Release with artifacts           ║${NC}"
        echo -e "${GREEN}║                                                      ║${NC}"
        echo -e "${GREEN}║  Monitor progress at:                                ║${NC}"
        echo -e "${GREEN}║  https://github.com/<owner>/<repo>/actions           ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
    else
        echo ""
        print_warning "Push skipped. To complete the release later, run:"
        echo "    git push origin $current_branch"
        echo "    git push origin v$new_version"
    fi
}

main "$@"
