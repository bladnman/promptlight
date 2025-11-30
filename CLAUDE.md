# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev                # Start dev server with hot reload (full Tauri app)
npm run dev:vite           # Start Vite only (frontend, no Tauri)

# Build & Install
npm run build              # TypeScript check + Vite build (frontend only)
npm run install:local      # Build release and install to /Applications (macOS)

# Testing
npm run test               # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report

# Run a single test file
npx vitest run src/__tests__/stores/editorStore.test.ts

# Run tests matching a pattern
npx vitest run -t "should load prompts"

# Linting
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix

# Full validation (run before committing)
npm run check              # Runs: lint → build → test

# Rust tests
cd src-tauri && cargo test
```

## Code Quality Requirements

**Before committing any code, run `npm run check`** which validates:
1. ESLint passes (warnings ok, errors fail)
2. TypeScript compiles without errors
3. All tests pass

**TypeScript Strictness**: The build enforces `noUnusedLocals` and `noUnusedParameters`. Unused code will fail the build.

**ESLint Rules**: Key rules enforced:
- No unused variables (prefix with `_` to ignore)
- `console.log` discouraged (use `console.error` or `console.warn` for actual issues)
- Prefer `const` over `let`
- Use `===` instead of `==`

## macOS Performance Critical

**NEVER use AppleScript on macOS.** AppleScript has severe performance penalties (~200ms+ per call) and is unreliable.

Instead, use native APIs:
- **App focus tracking**: `NSRunningApplication` via objc bindings (see `src-tauri/src/os/platform/macos.rs`)
- **Input simulation**: `CGEvent` for keyboard events
- **Window positioning**: `NSScreen` native API (see `src-tauri/src/os/focus.rs`)

The pattern to follow is in `src-tauri/src/os/platform/macos.rs` - direct Cocoa/Core Graphics calls via the `objc` crate.

## Architecture Overview

This is a Tauri 2.0 desktop app (Rust backend + React frontend) - a Spotlight-style prompt launcher.

### Backend Layers (src-tauri/src/)

```
os/                    # Platform-specific OS interactions
├── platform/          # Per-OS implementations (macos.rs, windows.rs, linux.rs)
├── paste.rs           # Clipboard + paste-back to previous app
├── focus.rs           # Screen/window focus detection
├── previous_app.rs    # Track app that was active before launcher
└── window.rs          # Window management

data/                  # Data persistence (JSON files in ~/Library/Application Support)
├── index.rs           # Prompt index + folder management
├── prompt.rs          # Individual prompt CRUD
├── search.rs          # Fuzzy search across prompts
└── stats.rs           # Usage tracking
```

### Frontend Layers (src/)

```
components/
├── launcher/          # Spotlight-style popup (SearchBar, ResultsList, etc.)
└── editor/            # Full prompt editor window (Sidebar, PromptEditor, etc.)

stores/                # Zustand state management
├── launcherStore.ts   # Launcher window state
├── launcherCacheStore.ts  # Search result caching
└── editorStore.ts     # Editor window state

hooks/                 # React hooks for keyboard nav, auto-save, search
config/constants.ts    # All magic numbers and config values
theme/tokens.ts        # Design system tokens (reference CSS variables)
types/                 # TypeScript interfaces for Prompt, Folder, etc.
```

### Adding New Tauri Commands

1. Add function with `#[tauri::command]` in appropriate `src-tauri/src/` module
2. Register in `src-tauri/src/lib.rs` `invoke_handler` array
3. Add TypeScript types in `src/types/` if returning new data structures

## Multi-Agent Development

### Port Configuration
- Each branch can have its own `.env.local` file (gitignored) to set a unique dev port
- Set `VITE_PORT=<port>` in `.env.local` (suggested: 1420, 1430, 1440, 1450)
- Run `npm run dev` to start - it reads from `.env.local` automatically

### Presenting Work to User
When you complete your work and want the user to review it, run the `/dev` slash command.

## Core Principles

**Separation of Concerns**: Keep logic, presentation, and data handling in distinct layers. Components should have single responsibilities.

**Code Reuse**: Extract repeated patterns into shared utilities. Don't duplicate—consolidate.

**No Magic Numbers**: All literal values (numbers, strings, thresholds) must be extracted to `src/config/constants.ts`. If a value appears in code, it should be a named constant.

## Design System

- **No inline design values**: Colors, spacing, typography live in `src/theme/tokens.ts`, not in component code
- Design tokens reference CSS custom properties defined in stylesheets
- Component styling references the design system—never raw hex codes or pixel values in components

## Testing Guidelines

Tests live in `src/__tests__/` and use Vitest + React Testing Library.

### Test Infrastructure

**Test setup** (`src/__tests__/setup.ts`):
- Mocks `@tauri-apps/api/core` invoke function
- Mocks `@tauri-apps/api/event` listen/emit
- Use `getMockInvoke()` to access the mock in tests

**Coverage reporting** (`npm run test:coverage`):
- Generates HTML report in `coverage/` directory
- Enforces minimum thresholds (see `vitest.config.ts`)
- Current focus: stores at 100%, components/hooks lower priority

### What to Test

**High priority** (should have comprehensive tests):
- Store logic (state transitions, async operations, error handling)
- Business logic and data transformations
- Edge cases that could cause regressions

**Medium priority** (test critical paths):
- Component interactions (clicks, keyboard events)
- Form validation

**Lower priority** (test if time permits):
- Pure presentational components
- Styling/layout

### Writing Store Tests

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useMyStore } from '../../stores/myStore';
import { getMockInvoke } from '../setup';

describe('myStore', () => {
  beforeEach(() => {
    useMyStore.getState().reset(); // Reset to initial state
    getMockInvoke().mockReset();    // Clear mock call history
  });

  it('should load data from backend', async () => {
    getMockInvoke().mockResolvedValueOnce({ data: 'test' });

    await useMyStore.getState().loadData();

    expect(useMyStore.getState().data).toBe('test');
  });
});
```

### Test File Organization

```
src/__tests__/
├── setup.ts              # Global test setup and mocks
├── stores/               # Store tests (high coverage)
│   ├── editorStore.test.ts
│   ├── launcherStore.test.ts
│   ├── launcherCacheStore.test.ts
│   ├── settingsStore.test.ts
│   └── authStore.test.ts
└── components/           # Component tests
    ├── IconButton.test.tsx
    └── InlineEdit.test.tsx
```

**Test file naming**: `*.test.ts` or `*.test.tsx` mirroring source structure

## File Organization

- Group by feature/domain, not by file type
- Colocate related files (component + styles + tests + types)
- Clear naming conventions that indicate purpose
