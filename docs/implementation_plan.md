# Prompt Launcher - Implementation Plan

## Overview

A spotlight-style desktop app for macOS (Tauri + React) that lets users search, select, and paste prompts into any application via a global hotkey.

**Key Decisions:**
- **Approach:** Foundation-First - build solid layers with clear interfaces, then integrate
- **State Management:** Zustand
- **Platform:** macOS first, cross-platform later

---

## Project Structure

```
promptlight/
├── src/                          # React frontend
│   ├── types/                    # Shared TypeScript interfaces
│   ├── config/                   # Centralized configuration (no magic numbers)
│   ├── theme/                    # Design tokens
│   ├── styles/                   # Global CSS, variables
│   ├── components/               # UI Layer
│   │   ├── launcher/            # Launcher window components
│   │   ├── editor/              # Editor window components
│   │   └── shared/              # Shared components
│   ├── stores/                   # Zustand stores
│   ├── hooks/                    # Custom React hooks
│   └── main.tsx
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs               # Tauri command registration
│   │   ├── data/                # Data Layer
│   │   └── os/                  # OS Integration Layer
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## Phase 1: Foundation Setup

### 1.1 Project Scaffold

1. Create Tauri v2 + React + TypeScript project
2. Configure `tauri.conf.json` for borderless, transparent launcher window
3. Set up Vite build configuration
4. Install core dependencies

**Cargo.toml dependencies:**
```toml
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-clipboard-manager = "2"
tauri-plugin-spotlight = { git = "https://github.com/zzzze/tauri-plugin-spotlight" }
window-vibrancy = "0.6"
enigo = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
dirs = "5"
```

**package.json dependencies:**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-global-shortcut": "^2",
    "@tauri-apps/plugin-clipboard-manager": "^2",
    "zustand": "^5"
  }
}
```

### 1.2 Shared Types (`src/types/`)

**`prompt.ts`** - Core data contracts:
```typescript
interface PromptMetadata {
  id: string;
  name: string;
  folder: string;
  description: string;
  filename: string;
  useCount: number;
  lastUsed: string | null;
  created: string;
  updated: string;
}

interface Prompt extends PromptMetadata {
  content: string;
}

interface SearchResult {
  prompt: PromptMetadata;
  score: number;
}
```

**`state.ts`** - Launcher state types:
```typescript
type LauncherMode = 'search' | 'promoted';

interface LauncherState {
  mode: LauncherMode;
  query: string;
  results: SearchResult[];
  selectedIndex: number;
  promotedPrompt: PromptMetadata | null;
  riderText: string;
}
```

### 1.3 Configuration (`src/config/constants.ts`)

All magic numbers externalized:
```typescript
export const CONFIG = {
  hotkey: 'Command+Shift+Space',
  window: { width: 650, maxHeight: 400, borderRadius: 12 },
  search: { debounceMs: 50, maxResults: 15 },
  paste: { delayMs: 100 },
} as const;
```

### 1.4 Design System (`src/theme/tokens.ts`, `src/styles/variables.css`)

CSS custom properties for colors, spacing, typography. Support dark mode via `prefers-color-scheme`.

---

## Phase 2: Data Layer (Rust)

Location: `src-tauri/src/data/`

### Files to Create

| File | Responsibility |
|------|----------------|
| `mod.rs` | Module exports |
| `index.rs` | Load/save `index.json`, CRUD metadata |
| `prompt.rs` | Read/write `.md` files |
| `search.rs` | Query matching, scoring, ranking |
| `stats.rs` | Usage tracking, timestamps |

### Storage Structure

```
~/.prompt-launcher/
├── index.json           # Metadata index
└── prompts/
    ├── coding/
    │   └── code-review.md
    └── writing/
        └── blog-outline.md
```

### Tauri Commands

```rust
#[tauri::command] async fn search_prompts(query: String) -> Result<Vec<SearchResult>, String>;
#[tauri::command] async fn get_prompt(id: String) -> Result<Prompt, String>;
#[tauri::command] async fn save_prompt(prompt: Prompt) -> Result<PromptMetadata, String>;
#[tauri::command] async fn delete_prompt(id: String) -> Result<(), String>;
#[tauri::command] async fn record_usage(id: String) -> Result<(), String>;
#[tauri::command] async fn get_folders() -> Result<Vec<String>, String>;
```

---

## Phase 3: OS Integration Layer (Rust)

Location: `src-tauri/src/os/`

### Files to Create

| File | Responsibility |
|------|----------------|
| `mod.rs` | Module exports |
| `hotkey.rs` | Global shortcut registration |
| `window.rs` | Show/hide launcher, vibrancy setup |
| `paste.rs` | Clipboard + Cmd+V simulation |

### Key Implementation

**Spotlight Window:** Use `tauri-plugin-spotlight` which:
- Creates NSPanel (non-activating panel)
- Tracks previous app focus
- Restores focus on hide

**Paste Flow:**
```rust
#[tauri::command]
async fn paste_and_dismiss(app: AppHandle, window: Window, text: String) -> Result<(), String> {
    // 1. Copy to clipboard
    app.clipboard().write_text(text)?;
    // 2. Hide window (spotlight plugin restores focus)
    window.hide()?;
    // 3. Wait for focus restoration
    thread::sleep(Duration::from_millis(100));
    // 4. Simulate Cmd+V with enigo
    let mut enigo = Enigo::new(&Settings::default())?;
    enigo.key(Key::Meta, Direction::Press)?;
    enigo.key(Key::Unicode('v'), Direction::Click)?;
    enigo.key(Key::Meta, Direction::Release)?;
    Ok(())
}
```

**Accessibility:** macOS requires Accessibility permission for keyboard simulation. App must prompt user to enable in System Preferences.

---

## Phase 4: UI Layer (React)

### Components

**Launcher (`src/components/launcher/`):**
- `LauncherWindow.tsx` - Container with vibrancy styling
- `SearchBar.tsx` - Input with PromptPill support
- `PromptPill.tsx` - Promoted prompt chip
- `ResultsList.tsx` - Filtered results
- `ResultItem.tsx` - Individual result row
- `KeyboardHints.tsx` - Subtle shortcuts guide

**Editor (`src/components/editor/`):**
- `EditorWindow.tsx` - Main layout
- `Sidebar.tsx` - Folder tree + prompt list
- `PromptEditor.tsx` - Markdown editor (basic textarea for MVP)

**Shared (`src/components/shared/`):**
- `Badge.tsx`, `Button.tsx`, `Input.tsx`

### Styling

Borderless window with vibrancy:
```css
.launcher-container {
  background: rgba(30, 30, 30, 0.8);
  border-radius: var(--radius-lg);
  backdrop-filter: blur(20px);
}
```

---

## Phase 5: Interaction Layer (React)

### Zustand Stores (`src/stores/`)

**`launcherStore.ts`:**
```typescript
interface LauncherStore extends LauncherState {
  setQuery: (query: string) => void;
  setResults: (results: SearchResult[]) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  promoteSelected: () => void;
  setRiderText: (text: string) => void;
  reset: () => void;
  getFinalText: () => string;
}
```

### Hooks (`src/hooks/`)

| Hook | Responsibility |
|------|----------------|
| `useSearch.ts` | Debounced search, invoke Tauri command |
| `useKeyboardNav.ts` | Arrow, Enter, Escape, Space/Tab handling |
| `useLauncher.ts` | Orchestrate search + keyboard + OS |
| `useOsEvents.ts` | Listen for hotkey show/hide events |

### Keyboard Flow

```
Arrow Up/Down → Navigate results
Enter         → Paste selected prompt (or promoted + rider)
Space/Tab     → Promote selected prompt (when item selected via arrows)
Escape        → Dismiss window
```

---

## Phase 6: Integration

### Wire Components to Stores
- `LauncherWindow` uses `useLauncher` hook
- State changes trigger re-renders
- Enter invokes `paste_and_dismiss` Tauri command

### Window Configuration (`tauri.conf.json`)
```json
{
  "windows": [{
    "label": "launcher",
    "decorations": false,
    "transparent": true,
    "alwaysOnTop": true,
    "visible": false,
    "width": 650,
    "height": 80,
    "resizable": false
  }]
}
```

### System Tray
- Icon always visible
- Menu: "Open Launcher", "Manage Prompts", "Quit"

---

## Build Order Summary

### Track A: Backend (Can parallelize)
1. Shared types
2. Configuration constants
3. Data Layer (Rust) - full CRUD
4. OS Integration Layer (Rust) - hotkey, window, paste
5. Tauri command registration

### Track B: Frontend (Can parallelize)
1. Design system setup
2. Shared components
3. Launcher components (static)
4. Editor components (static)
5. Zustand stores
6. Hooks

### Integration (Sequential)
1. Wire stores to components
2. Wire hooks to Tauri commands
3. Connect hotkey events
4. End-to-end testing
5. Polish (loading states, errors, animations)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `tauri-plugin-spotlight` incompatible | Fallback to `tauri-nspanel` + manual focus tracking |
| Paste simulation fails | Try `rdev` crate, then AppleScript, then manual paste prompt |
| Accessibility denied | Show clear guidance, degrade to clipboard-only mode |
| Hotkey conflicts | Make configurable immediately |

---

## Success Criteria

MVP complete when:
1. Hotkey summons launcher window
2. Type to search, see filtered results
3. Arrow keys navigate, Enter pastes into previous app
4. Space promotes, rider text appends, Enter pastes combined
5. Prompts persist in `~/.prompt-launcher/`
6. Usage tracking influences sort order
7. Basic editor to add/edit prompts

**"Done" means:** Hit hotkey → type "joke" → Space → type "dogs" → Enter → "Tell me a joke about dogs" appears in ChatGPT.
