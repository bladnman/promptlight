#!/bin/bash
# PromptLight Build & Install Script
# Builds a release version and installs to the appropriate location
#
# Supported platforms:
#   - macOS: Installs to /Applications
#   - Linux: Installs to ~/.local/bin (AppImage) or system-wide

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "PromptLight Build & Install"
echo "==========================="
echo ""

# Detect platform
install_macos() {
    echo "Platform: macOS"
    echo ""

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
    echo -e "${GREEN}Done! PromptLight installed to /Applications/Promptlight.app${NC}"
    echo "Launch it from Spotlight or Finder."
}

install_linux() {
    echo "Platform: Linux"
    echo ""

    # Check if system dependencies are installed
    check_linux_deps() {
        local missing_deps=false

        # Check for essential libraries
        if ! pkg-config --exists webkit2gtk-4.1 2>/dev/null && ! pkg-config --exists webkit2gtk-4.0 2>/dev/null; then
            echo -e "${YELLOW}Warning: WebKitGTK development files not found.${NC}"
            missing_deps=true
        fi

        if ! pkg-config --exists gtk+-3.0 2>/dev/null; then
            echo -e "${YELLOW}Warning: GTK 3 development files not found.${NC}"
            missing_deps=true
        fi

        if [[ "$missing_deps" == "true" ]]; then
            echo ""
            echo "Required system dependencies are missing."
            echo "Run this command first:"
            echo "  ./scripts/install-linux-deps.sh"
            echo ""
            read -p "Would you like to install them now? [y/N] " -n 1 -r
            echo ""
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                "$SCRIPT_DIR/install-linux-deps.sh"
            else
                echo "Please install dependencies and try again."
                exit 1
            fi
        fi
    }

    check_linux_deps

    echo "Stopping any running PromptLight instances..."
    pkill -9 -f "promptlight" 2>/dev/null || true
    sleep 1

    echo "Building release version..."
    npm run tauri build

    # Determine installation location
    INSTALL_DIR="${HOME}/.local/bin"
    DESKTOP_DIR="${HOME}/.local/share/applications"

    # Find the built bundle
    # Tauri on Linux can produce: AppImage, deb, rpm
    APPIMAGE=$(find src-tauri/target/release/bundle -name "*.AppImage" 2>/dev/null | head -1)
    DEB=$(find src-tauri/target/release/bundle -name "*.deb" 2>/dev/null | head -1)

    if [[ -n "$APPIMAGE" ]]; then
        echo "Found AppImage bundle."
        echo ""

        # Create install directory if needed
        mkdir -p "$INSTALL_DIR"
        mkdir -p "$DESKTOP_DIR"

        # Copy AppImage
        APPIMAGE_NAME="promptlight.AppImage"
        cp "$APPIMAGE" "$INSTALL_DIR/$APPIMAGE_NAME"
        chmod +x "$INSTALL_DIR/$APPIMAGE_NAME"

        # Create desktop entry
        cat > "$DESKTOP_DIR/promptlight.desktop" << EOF
[Desktop Entry]
Name=PromptLight
Comment=A spotlight-style prompt launcher
Exec=${INSTALL_DIR}/${APPIMAGE_NAME}
Icon=promptlight
Terminal=false
Type=Application
Categories=Utility;
StartupWMClass=PromptLight
EOF

        echo ""
        echo -e "${GREEN}Done! PromptLight installed to ${INSTALL_DIR}/${APPIMAGE_NAME}${NC}"
        echo ""
        echo "Make sure ~/.local/bin is in your PATH."
        echo "You can launch it from your application menu or run:"
        echo "  $INSTALL_DIR/$APPIMAGE_NAME"

    elif [[ -n "$DEB" ]]; then
        echo "Found .deb package: $DEB"
        echo ""
        echo "Install with:"
        echo "  sudo dpkg -i $DEB"

    else
        echo -e "${YELLOW}No installable bundle found.${NC}"
        echo ""
        echo "The binary is available at:"
        echo "  src-tauri/target/release/promptlight"
        echo ""
        echo "You can run it directly or copy it to your preferred location."
    fi
}

# Main
case "$OSTYPE" in
    darwin*)
        install_macos
        ;;
    linux*)
        install_linux
        ;;
    *)
        echo -e "${RED}Error: Unsupported platform: $OSTYPE${NC}"
        echo "PromptLight currently supports macOS and Linux."
        echo "For Windows, see Tauri documentation."
        exit 1
        ;;
esac
