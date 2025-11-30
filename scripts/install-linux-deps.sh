#!/bin/bash
# PromptLight Linux System Dependencies Installer
# Installs required system packages for building Tauri apps on Linux
#
# Usage: ./scripts/install-linux-deps.sh
#
# Supported distributions:
#   - Ubuntu/Debian (apt)
#   - Fedora/RHEL (dnf)
#   - Arch Linux (pacman)
#   - openSUSE (zypper)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "PromptLight Linux Dependencies Installer"
echo "========================================="
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux"* ]]; then
    echo -e "${RED}Error: This script is for Linux only.${NC}"
    echo "On macOS, dependencies are handled automatically."
    exit 1
fi

# Detect the package manager and distribution
detect_distro() {
    if command -v apt &> /dev/null; then
        echo "debian"
    elif command -v dnf &> /dev/null; then
        echo "fedora"
    elif command -v pacman &> /dev/null; then
        echo "arch"
    elif command -v zypper &> /dev/null; then
        echo "opensuse"
    else
        echo "unknown"
    fi
}

DISTRO=$(detect_distro)
echo "Detected package manager: $DISTRO"
echo ""

# Check if running as root or with sudo available
check_sudo() {
    if [[ $EUID -eq 0 ]]; then
        SUDO=""
    elif command -v sudo &> /dev/null; then
        SUDO="sudo"
        echo -e "${YELLOW}Some commands require sudo. You may be prompted for your password.${NC}"
        echo ""
    else
        echo -e "${RED}Error: This script requires root privileges or sudo.${NC}"
        exit 1
    fi
}

check_sudo

# Install dependencies based on distribution
case $DISTRO in
    debian)
        echo "Installing dependencies for Debian/Ubuntu..."
        echo ""

        $SUDO apt update

        # Core build tools
        $SUDO apt install -y \
            build-essential \
            curl \
            wget \
            file \
            libssl-dev \
            pkg-config

        # GTK and WebKit dependencies for Tauri
        # Try webkit2gtk-4.1 first (Ubuntu 22.04+), fall back to 4.0
        if apt-cache show libwebkit2gtk-4.1-dev &> /dev/null; then
            echo "Installing WebKitGTK 4.1..."
            $SUDO apt install -y \
                libwebkit2gtk-4.1-dev \
                libgtk-3-dev \
                libayatana-appindicator3-dev \
                librsvg2-dev \
                libxdo-dev \
                libgdk-pixbuf2.0-dev \
                libpango1.0-dev \
                libcairo2-dev \
                libglib2.0-dev \
                libatk1.0-dev
        else
            echo "Installing WebKitGTK 4.0 (older distro)..."
            $SUDO apt install -y \
                libwebkit2gtk-4.0-dev \
                libgtk-3-dev \
                libappindicator3-dev \
                librsvg2-dev \
                libxdo-dev \
                libgdk-pixbuf2.0-dev \
                libpango1.0-dev \
                libcairo2-dev \
                libglib2.0-dev \
                libatk1.0-dev
        fi
        ;;

    fedora)
        echo "Installing dependencies for Fedora/RHEL..."
        echo ""

        $SUDO dnf install -y \
            webkit2gtk4.1-devel \
            openssl-devel \
            curl \
            wget \
            file \
            libappindicator-gtk3-devel \
            librsvg2-devel \
            gtk3-devel \
            libxdo-devel \
            gdk-pixbuf2-devel \
            pango-devel \
            cairo-devel \
            glib2-devel \
            atk-devel \
            gcc-c++
        ;;

    arch)
        echo "Installing dependencies for Arch Linux..."
        echo ""

        $SUDO pacman -Syu --noconfirm \
            webkit2gtk \
            base-devel \
            curl \
            wget \
            file \
            openssl \
            libappindicator-gtk3 \
            librsvg \
            gtk3 \
            xdotool \
            gdk-pixbuf2 \
            pango \
            cairo \
            glib2 \
            atk
        ;;

    opensuse)
        echo "Installing dependencies for openSUSE..."
        echo ""

        $SUDO zypper install -y \
            webkit2gtk3-soup2-devel \
            libopenssl-devel \
            curl \
            wget \
            file \
            libappindicator3-1 \
            librsvg-devel \
            gtk3-devel \
            xdotool \
            gdk-pixbuf-devel \
            pango-devel \
            cairo-devel \
            glib2-devel \
            atk-devel \
            gcc-c++
        ;;

    *)
        echo -e "${RED}Error: Unsupported Linux distribution.${NC}"
        echo ""
        echo "Please install the following dependencies manually:"
        echo "  - WebKitGTK 4.0 or 4.1 development files"
        echo "  - GTK 3 development files"
        echo "  - OpenSSL development files"
        echo "  - libappindicator3 development files"
        echo "  - librsvg development files"
        echo "  - xdotool (libxdo) development files"
        echo "  - Standard build tools (gcc, make, pkg-config)"
        echo ""
        echo "See: https://tauri.app/start/prerequisites/#linux"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done! Linux dependencies installed successfully.${NC}"
echo ""
echo "You can now build PromptLight with:"
echo "  npm run tauri build"
echo ""
echo "Or run in development mode:"
echo "  npm run dev"
