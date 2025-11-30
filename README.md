# PromptLight

A Spotlight-style desktop app for instantly searching, selecting, and pasting prompts into any application.

## The Problem

Power users accumulate dozens or hundreds of prompts for coding, writing, and analysis. These live scattered across notes apps, text files, and bookmarks. When you need a prompt, you leave your current context, hunt through files, copy, return, and paste. This friction kills flow.

PromptLight removes that friction with a keystroke-summoned launcher that finds and pastes prompts *without leaving your current app*.

## Features

- **Global Hotkey** - Summon with `Cmd+Shift+Space` from anywhere
- **Instant Search** - Type to filter prompts in real-time
- **Keyboard Navigation** - Arrow keys to navigate, Enter to paste
- **Folders** - Organize prompts by project or category
- **Variables** - Use `{{placeholders}}` for dynamic content
- **Cloud Sync** - Optional sync across machines (requires Firebase setup)

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Rust** (via [rustup](https://rustup.rs))
- **macOS** (currently macOS only, though Tauri supports cross-platform builds)

### Clone and Install

```bash
git clone https://github.com/your-org/promptlight.git
cd promptlight
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will launch in development mode with hot reload.

Alternatively, use the shell script directly (which cleans up stale processes first):

```bash
./scripts/dev.sh
```

### Build and Install

To build a release version and install to `/Applications`:

```bash
./scripts/install.sh
```

---

## Cloud Sync (Optional)

> **Note:** Cloud sync is entirely optional. If you just want local prompts, skip this section. Everything works without Firebase.

To sync prompts across multiple machines, you'll need to set up Google OAuth and Firebase. See the [Firebase Setup Guide](docs/firebase-setup.md) for detailed instructions.

---

## Development

### Project Structure

```
src/                   # React frontend
  components/          # UI components (launcher, editor)
  stores/              # Zustand state management
  hooks/               # React hooks
  config/              # Constants and configuration
  theme/               # Design tokens

src-tauri/             # Rust backend
  src/
    os/                # Platform-specific OS interactions
    data/              # Data persistence (JSON files)
    auth/              # Google OAuth + Firebase auth

scripts/               # Shell scripts for dev/build
docs/                  # Documentation
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload (full Tauri app) |
| `npm run dev:vite` | Start Vite only (frontend, no Tauri) |
| `npm run build` | TypeScript check + Vite build (frontend only) |
| `npm run install:local` | Build and install to /Applications |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `./scripts/dev.sh` | Clean start dev server (kills existing processes) |
| `./scripts/install.sh` | Build and install to /Applications |

### Environment Configuration

Copy `.env.example` to `.env.local` and configure as needed:

```bash
cp .env.example .env.local
```

The `VITE_PORT` variable lets you run multiple development instances on different ports (useful for parallel feature development).

### Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run a specific test file
npx vitest run src/__tests__/stores/editorStore.test.ts

# Rust tests
cd src-tauri && cargo test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure tests pass: `npm run test`
5. Ensure build succeeds: `npm run build`
6. Submit a pull request

## License

MIT
