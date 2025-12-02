#!/bin/bash
# PromptLight Release Script
# Builds locally with code signing, installs, and publishes to GitHub
#
# Usage:
#   ./scripts/release.sh [version]
#   ./scripts/release.sh patch|minor|major
#   ./scripts/release.sh           # Interactive mode

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "PromptLight Release"
echo "==================="
echo ""

# Check we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo -e "${YELLOW}Warning: You're on branch '$CURRENT_BRANCH', not main.${NC}"
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${RED}Error: You have uncommitted changes.${NC}"
    echo "Please commit or stash them before releasing."
    git status --short
    exit 1
fi

# Pull latest
echo "Pulling latest changes..."
git pull --quiet

# Get latest version tag
LATEST_TAG=$(git tag -l 'v*' --sort=-v:refname | head -1)
if [[ -z "$LATEST_TAG" ]]; then
    LATEST_VERSION="0.0.0"
    echo "No existing releases found. Starting fresh."
else
    LATEST_VERSION="${LATEST_TAG#v}"
    echo "Latest release: ${CYAN}v${LATEST_VERSION}${NC}"
fi

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$LATEST_VERSION"
MAJOR=${MAJOR:-0}
MINOR=${MINOR:-0}
PATCH=${PATCH:-0}

# Calculate bump versions
PATCH_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
MINOR_VERSION="$MAJOR.$((MINOR + 1)).0"
MAJOR_VERSION="$((MAJOR + 1)).0.0"

# Determine new version
NEW_VERSION=""
ARG="${1:-}"

case "$ARG" in
    patch)
        NEW_VERSION="$PATCH_VERSION"
        ;;
    minor)
        NEW_VERSION="$MINOR_VERSION"
        ;;
    major)
        NEW_VERSION="$MAJOR_VERSION"
        ;;
    "")
        # Interactive mode
        echo ""
        echo "Select version bump:"
        echo -e "  ${CYAN}1)${NC} Patch  → ${GREEN}$PATCH_VERSION${NC}  (bug fixes)"
        echo -e "  ${CYAN}2)${NC} Minor  → ${GREEN}$MINOR_VERSION${NC}  (new features)"
        echo -e "  ${CYAN}3)${NC} Major  → ${GREEN}$MAJOR_VERSION${NC}  (breaking changes)"
        echo -e "  ${CYAN}4)${NC} Custom version"
        echo ""
        read -p "Choice [1-4]: " -n 1 -r CHOICE
        echo ""

        case "$CHOICE" in
            1) NEW_VERSION="$PATCH_VERSION" ;;
            2) NEW_VERSION="$MINOR_VERSION" ;;
            3) NEW_VERSION="$MAJOR_VERSION" ;;
            4)
                read -p "Enter version (without 'v' prefix): " NEW_VERSION
                ;;
            *)
                echo -e "${RED}Invalid choice.${NC}"
                exit 1
                ;;
        esac
        ;;
    *)
        # Assume it's a version number
        NEW_VERSION="$ARG"
        # Strip 'v' prefix if provided
        NEW_VERSION="${NEW_VERSION#v}"
        ;;
esac

# Validate version format
if [[ ! "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo -e "${RED}Error: Invalid version format '$NEW_VERSION'.${NC}"
    echo "Expected format: X.Y.Z (e.g., 1.2.3)"
    exit 1
fi

NEW_TAG="v$NEW_VERSION"

# Check if tag already exists
if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Tag '$NEW_TAG' already exists.${NC}"
    read -p "Delete and recreate? [y/N] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Deleting existing tag..."
        git tag -d "$NEW_TAG"
        git push origin ":refs/tags/$NEW_TAG" 2>/dev/null || true
        gh release delete "$NEW_TAG" --yes 2>/dev/null || true
    else
        exit 1
    fi
fi

# Confirm release
echo ""
echo -e "Ready to release ${GREEN}v${NEW_VERSION}${NC}"
echo ""
echo "This will:"
echo "  1. Update version in package.json, Cargo.toml, tauri.conf.json"
echo "  2. Build and sign the app with PromptLight Dev certificate"
echo "  3. Install to /Applications"
echo "  4. Create git tag and push"
echo "  5. Create GitHub release with DMG"
echo ""
read -p "Proceed? [Y/n] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Update version in files
echo ""
echo "Updating version to $NEW_VERSION..."
sed -i.bak 's/"version": "[^"]*"/"version": "'"$NEW_VERSION"'"/' package.json
sed -i.bak 's/^version = "[^"]*"/version = "'"$NEW_VERSION"'"/' src-tauri/Cargo.toml
sed -i.bak 's/"version": "[^"]*"/"version": "'"$NEW_VERSION"'"/' src-tauri/tauri.conf.json
rm -f package.json.bak src-tauri/Cargo.toml.bak src-tauri/tauri.conf.json.bak

# Build universal binary
ENTITLEMENTS="src-tauri/entitlements.plist"
SIGN_IDENTITY="PromptLight Dev"

sign_bundle() {
    local bundle_path="$1"
    if [[ ! -d "$bundle_path" ]]; then
        return
    fi
    if security find-identity -v -p codesigning | grep -q "$SIGN_IDENTITY"; then
        codesign --force --deep --sign "$SIGN_IDENTITY" --entitlements "$ENTITLEMENTS" "$bundle_path"
    else
        codesign --force --deep --sign - --entitlements "$ENTITLEMENTS" "$bundle_path"
    fi
}

echo ""
echo "Building Universal binary (works on all Macs)..."
npm run tauri build -- --target universal-apple-darwin

# Sign the bundle
echo ""
echo "Signing bundle..."
sign_bundle "src-tauri/target/universal-apple-darwin/release/bundle/macos/Promptlight.app"
echo "Bundle signed"

# Install universal build locally
echo ""
echo "Installing to /Applications..."
pkill -9 -f "[Pp]romptlight" 2>/dev/null || true
sleep 1
rm -rf /Applications/Promptlight.app
cp -R "src-tauri/target/universal-apple-darwin/release/bundle/macos/Promptlight.app" /Applications/
echo -e "${GREEN}Installed to /Applications/Promptlight.app${NC}"

# Find the DMG
DMG_UNIVERSAL=$(find src-tauri/target/universal-apple-darwin/release/bundle/dmg -name "*.dmg" 2>/dev/null | head -1)

echo ""
echo "DMG built: $DMG_UNIVERSAL"

# Commit version bump (if there are changes)
echo ""
echo "Committing version bump..."
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
if git diff --cached --quiet; then
    echo "Version already at $NEW_VERSION, no commit needed"
else
    git commit -m "chore: bump version to v$NEW_VERSION"
fi

# Create and push tag
echo ""
echo "Creating tag $NEW_TAG..."
git tag "$NEW_TAG"

echo "Pushing to GitHub..."
git push origin "$CURRENT_BRANCH" --tags

# Create GitHub release
echo ""
echo "Creating GitHub release..."

gh release create "$NEW_TAG" \
    --title "PromptLight v$NEW_VERSION" \
    --notes "## PromptLight v$NEW_VERSION

### Installation

**macOS (Intel & Apple Silicon):**
- Download \`PromptLight_${NEW_VERSION}_universal.dmg\`
- Open the DMG and drag PromptLight to Applications

> **macOS Gatekeeper:** Since this app is not signed with an Apple Developer certificate, macOS may show a warning. To open the app:
> 1. Try to open PromptLight - you'll see a warning that it can't be opened
> 2. Go to **System Settings → Privacy & Security**
> 3. Scroll down and click **\"Open Anyway\"** next to the PromptLight message
> 4. Click **Open** in the confirmation dialog

**First-time Accessibility Setup:**
For the paste-into-previous-app feature to work, you need to grant Accessibility permission:
1. Open **System Settings → Privacy & Security → Accessibility**
2. Click **+** and add PromptLight from Applications
3. Ensure the toggle is **ON**

This permission persists across app updates.

### Changelog
See commit history for changes." \
    "$DMG_UNIVERSAL"

echo ""
echo -e "${GREEN}Release v${NEW_VERSION} complete!${NC}"
echo ""
echo "Release URL:"
echo "  https://github.com/bladnman/promptlight/releases/tag/$NEW_TAG"
