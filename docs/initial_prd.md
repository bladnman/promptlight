# Prompt Launcher — Definition

## One-Line Summary
> A spotlight-style desktop app for instantly searching, selecting, and pasting prompts into any application.

---

## Problem Statement

Power users accumulate dozens or hundreds of prompts—for coding, writing, analysis, brainstorming. Currently, these live scattered across notes apps, text files, and browser bookmarks. When you need a prompt, you:

1. Leave your current context
2. Hunt through files or apps
3. Copy the prompt
4. Return to where you were
5. Paste

This friction kills flow. A keystroke-summoned launcher that finds and pastes prompts *without leaving your current app* removes that friction entirely.

---

## Target User

Developers, writers, and knowledge workers who:
- Use AI assistants (ChatGPT, Claude, Copilot) regularly
- Have accumulated a personal library of prompts
- Value keyboard-driven workflows
- Want instant access without context-switching

---

## Core Capabilities

### MVP (Must Have)

1. **Global Hotkey Summon**
   - Background process listens for hotkey (e.g., Alt+Space)
   - Spotlight-style search bar appears centered on active screen
   - App steals focus (like Spotlight, Raycast, Alfred)

2. **Instant Search**
   - Type to filter prompts in real-time
   - Search priority: name → tags/folder → description
   - Prompt content itself is secondary search (file-based grep, not in-memory)

3. **Keyboard Navigation**
   - Arrow keys to navigate results
   - Enter to select and paste (immediate)
   - Space/Tab/Right Arrow on selected item = "promote" the prompt (see below)
   - Escape to dismiss
   - Fast, snappy, no mouse required

4. **Prompt Promotion with Rider Context**
   - When a prompt is highlighted, pressing Space (or Tab, or →) "promotes" it
   - Promoted prompt appears visually in the input bar (pill/token style, distinct color)
   - Cursor returns to input field, now in "rider mode"
   - Anything typed after promotion is appended as additional context
   - Enter at any point pastes: [promoted prompt] + [rider text]
   - Once promoted, typing does NOT search for more prompts — it's purely additive

   **Example:**
   1. Type "joke" → results show "Tell me a joke about" prompt
   2. Arrow down to highlight it
   3. Press Space → prompt promoted, shown as `[Tell me a joke about]` in bar
   4. Type "dogs"
   5. Press Enter → pastes "Tell me a joke about dogs"

   **Visual Treatment:**
   - Promoted prompt displayed as colored pill/chip in the input area
   - Clear visual distinction between [prompt] and [rider text]
   - User always sees exactly what will be pasted

5. **Paste into Previous App**
   - Track which app had focus before launcher appeared
   - On selection: copy to clipboard → restore focus to previous app → simulate Cmd/Ctrl+V
   - User experiences: select prompt, it appears where their cursor was

6. **Markdown Editor for Prompts**
   - Unified markdown editor (not split-panel, WYSIWYG-style)
   - Used for creating new prompts and editing existing ones
   - Markdown rendering for preview/read mode
   - Lightweight, open-source library (e.g., Milkdown, TipTap, or similar)

7. **Frequency-Based Sorting**
   - Track usage count per prompt
   - Most-used prompts appear higher in results
   - Simple scoring: usage count + recency bonus

8. **File-Based Storage (Not Pure JSON)**
   - Each prompt stored as individual `.md` file
   - Metadata index (JSON or SQLite) holds: name, folder/tags, description, usage stats
   - Prompt content loaded on-demand, not held in memory
   - Enables scaling to large prompt libraries
   - Export-friendly: prompt files are portable markdown

9. **Folder Organization**
   - Prompts organized into folders (coding, writing, analysis, etc.)
   - Folder names are searchable/filterable
   - Folder structure reflected in file system or as metadata

---

## Technical Direction (Non-Binding)

**Stack Recommendation:**
- **Tauri** for cross-platform desktop shell
- **React** frontend for the UI
- **Rust backend** (comes with Tauri, but minimal custom Rust needed)
- Backend choice is flexible—Rust is fine, Node-based would also work

**Why Tauri:**
- Native performance, small bundle (~3MB vs Electron's ~80MB)
- Built-in global shortcuts plugin
- System tray support for headless background operation
- Cross-platform from single codebase

**Note:** Backend complexity is low. The app is primarily:
- File I/O (read/write prompts)
- Metadata indexing (small JSON or SQLite)
- Clipboard operations
- Focus management

If agents write Rust more fluently, use Rust. If Node is simpler, use Node. The backend is not the hard part.

---

## Subsystem Architecture

**Goal:** Separate concerns into distinct subsystems that can be developed in parallel by multiple AI agents with minimal merge conflicts.

### Subsystem 1: Data Layer

**Responsibility:** All data operations — storage, retrieval, indexing, search.

**Scope:**
- File I/O for prompt `.md` files
- Metadata index management (JSON or SQLite)
- CRUD operations: create, read, update, delete prompts
- Search/filter logic (name matching, folder filtering, content grep)
- Usage statistics tracking (increment counts, update timestamps)
- Folder management

**Interface:** Exposes functions like `searchPrompts(query)`, `getPrompt(id)`, `savePrompt(data)`, `recordUsage(id)`.

**Files:** Likely lives in `src/data/` or `src-tauri/src/data/` (if Rust).

---

### Subsystem 2: UI Layer

**Responsibility:** Visual presentation — components, styling, layout, theming.

**Scope:**
- React components (SearchBar, ResultsList, PromptPill, Editor, etc.)
- CSS/styling (transparency, colors, typography, spacing)
- Dark/light mode theming
- Animations and transitions
- Responsive layout for different window sizes
- Markdown rendering

**Does NOT include:** Business logic, state machines, keyboard handling, OS interactions.

**Files:** `src/components/`, `src/styles/`, `src/theme/`

---

### Subsystem 3: Interaction Layer

**Responsibility:** User interaction logic — state management, keyboard navigation, search flow.

**Scope:**
- Application state (search query, selected index, promoted prompt, rider text)
- Keyboard event handling (arrow keys, Enter, Escape, Space/Tab for promotion)
- Search-as-you-type flow and debouncing
- Promotion state machine (normal mode → promoted mode)
- Result selection and execution flow

**Interface:** State and handlers consumed by UI components.

**Files:** `src/hooks/`, `src/state/`, or `src/interactions/`

---

### Subsystem 4: OS Integration Layer

**Responsibility:** Platform-specific OS interactions.

**Scope:**
- Global hotkey registration and handling
- Window management (show, hide, position on active screen)
- Focus tracking (which app had focus before launcher appeared)
- Focus restoration (return focus to previous app)
- Clipboard operations (copy, paste simulation)
- Click-away dismissal (detect clicks outside window)
- System tray integration
- Accessibility permissions handling (macOS)

**Platform-Specific:** This layer will have the most platform-specific code. Tauri plugins handle much of this, but custom Rust may be needed.

**Files:** `src-tauri/src/os/` or integrated with Tauri commands in `src-tauri/src/lib.rs`

---

### Subsystem Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│   (Components, Styling, Rendering)                          │
├─────────────────────────────────────────────────────────────┤
│                   Interaction Layer                         │
│   (State, Keyboard Handling, Search Flow)                   │
├──────────────────────────┬──────────────────────────────────┤
│       Data Layer         │       OS Integration Layer       │
│  (Storage, Search, CRUD) │  (Hotkeys, Focus, Clipboard)     │
└──────────────────────────┴──────────────────────────────────┘
```

**Communication:**
- UI ← Interaction: Components receive state and call handlers
- Interaction ← Data: State layer calls data functions for search/load/save
- Interaction ← OS: OS layer triggers show/hide, provides focus info
- OS → Data: Minimal (maybe clipboard contents if doing context injection later)

**Merge Conflict Mitigation:**
- Each subsystem in separate directories
- Clear interfaces between layers
- Shared types in a common `src/types/` file
- Parallel development: one agent on Data, one on UI, one on OS Integration
- Integration points defined upfront

---

## User Interface Elements

### Launcher Window (Primary)

**Window Appearance:**
- **Borderless:** No title bar, no window chrome, no resize handles
- **Semi-transparent:** Background has blur/transparency (like Spotlight, Raycast)
- **Floating:** Feels like an OS overlay, not an application window
- **Centered on active screen:** Detects which monitor has focus, appears there
- **Fixed width:** ~600-700px wide, height grows with results (max height capped)
- **Rounded corners:** Soft corners matching modern OS aesthetics
- **Shadow:** Subtle drop shadow to lift it off the content behind

**Search/Input Bar:**
- Large, centered text field with placeholder "Search prompts..."
- **Normal mode:** User types to search, results filter below
- **Promoted mode:** Shows `[Prompt Name]` as pill/chip + cursor for rider text
- Clear visual state change when a prompt is promoted

**Results List:**
- Below search, showing matching prompts
- Each result shows: Name, folder/tag badge, truncated preview
- Highlighted match characters
- Usage indicator (subtle, e.g., small dot or count)
- Currently selected item has visible highlight

**Keyboard Hints:** Subtle indicators (↑↓ navigate, Space promote, ⏎ paste, ⎋ dismiss)

**Visual Style:**
- Minimal chrome, dark/light mode following system preference
- The window should feel like part of the OS, not a separate app

**Promoted State Visual:**
```
┌─────────────────────────────────────────────────┐
│ [Tell me a joke about] dogs█                    │
└─────────────────────────────────────────────────┘
```
- `[Tell me a joke about]` = colored pill showing the promoted prompt
- `dogs` = rider text the user is typing
- Results list may hide or show "Press Enter to paste" hint

### Editor Window (Secondary)
- **Accessed via:** System tray menu → "Manage Prompts" or keyboard shortcut
- **Layout:**
  - Left sidebar: folder tree / prompt list
  - Main area: markdown editor
- **Editor Features:**
  - WYSIWYG-style markdown (not split-panel)
  - Code block highlighting
  - Token highlighting if/when tokens are added
  - Auto-save with debounce
- **Actions:** New prompt, delete, move to folder, export

### System Tray
- **Icon:** Always present when app running
- **Menu:**
  - "Open Launcher" (redundant but helpful)
  - "Manage Prompts" → opens editor window
  - "Settings" → opens settings (later)
  - "Quit"

---

## Interaction Flows

### Flow 1: Quick Prompt Insertion (Direct)
1. User is typing in Claude/ChatGPT/VS Code
2. Hits global hotkey (Alt+Space)
3. Launcher appears (steals focus, that's fine)
4. Types "review" → sees "Code Review" prompt highlighted
5. Hits Enter immediately
6. Launcher dismisses, previous app regains focus, prompt is pasted at cursor

### Flow 2: Prompt with Rider Context
1. User is in ChatGPT, wants a joke prompt with specific topic
2. Hits global hotkey (Alt+Space)
3. Types "joke" → "Tell me a joke about" prompt is highlighted
4. Presses Space (or Tab, or →) → prompt is "promoted"
5. Input bar now shows: `[Tell me a joke about]` (pill) + cursor
6. Types "dogs"
7. Hits Enter
8. Launcher dismisses, pastes "Tell me a joke about dogs" into ChatGPT

### Flow 3: Creating a New Prompt
1. User clicks system tray → "Manage Prompts"
2. Editor window opens
3. Clicks "New Prompt"
4. Types name, selects folder, writes prompt content in markdown editor
5. Saves (auto-save or explicit)
6. Prompt now appears in launcher searches

### Flow 4: Browsing/Editing Prompts
1. Opens editor window
2. Browses folder tree or searches
3. Clicks prompt to view/edit
4. Makes changes, saves
5. Changes reflected immediately in launcher

---

## Data Model

### Metadata Index (JSON or SQLite)
```json
{
  "prompts": [
    {
      "id": "uuid-1234",
      "name": "Code Review",
      "folder": "coding",
      "description": "Comprehensive code review prompt with checklist",
      "filename": "code-review.md",
      "useCount": 47,
      "lastUsed": "2024-11-26T10:30:00Z",
      "created": "2024-09-15T08:00:00Z",
      "updated": "2024-11-20T14:22:00Z"
    }
  ],
  "folders": ["coding", "writing", "analysis", "brainstorm"]
}
```

### Individual Prompt Files
```
~/.prompt-launcher/prompts/
├── coding/
│   ├── code-review.md
│   └── explain-code.md
├── writing/
│   └── blog-outline.md
└── uncategorized/
    └── brainstorm.md
```

Each `.md` file contains just the prompt content. Metadata lives in the index.

---

## Out of Scope (MVP)

- **Token/variable system** ({{topic}} placeholders) — defer to v2
- **Type-to-cursor** (simulating keystrokes) — clipboard+paste only for MVP
- **Settings UI** — hardcode sensible defaults
- **Import/Export UI** — files are already markdown, manual copying works
- **Sync across devices** — local-only for now
- **AI enhancement** — no API integration in MVP
- **URL actions** — prompts only, not a general launcher
- **Prompt versioning** — defer to v2
- **Context injection** (read selection from previous app) — defer

---

## Success Criteria

A successful one-hour build delivers:

1. **Working global hotkey** that summons the app
2. **Search that filters** a list of prompts
3. **Enter pastes** the selected prompt into the previous app
4. **Space/Tab promotes** a prompt, allowing rider context to be typed
5. **Promoted prompt + rider text** paste together as one
6. **Escape dismisses** cleanly
7. **Basic editor** to add/edit prompts (markdown)
8. **Prompts persist** between app restarts
9. **Usage tracking** that influences sort order

"Done" means: I can hit a hotkey, type "joke", press Space, type "dogs", hit Enter, and "Tell me a joke about dogs" appears in ChatGPT.

---

## Open Questions

1. **Hotkey choice:** Alt+Space may conflict with some apps. Make configurable from the start, or hardcode and defer?

2. **Focus restoration reliability:** Can we reliably return focus to the previous app and paste? Need to test on macOS. May need accessibility permissions.

3. **Index format:** JSON file vs SQLite? JSON is simpler, SQLite scales better. For MVP, JSON is probably fine.

4. **Promotion trigger key:** Space is intuitive but might conflict if user wants to search for "code review" (two words). Options:
   - Space when an item is arrow-key selected (not just top result)
   - Tab only (less discoverable but safer)
   - Right arrow only
   - Require explicit selection first (arrow down), then Space promotes

5. **App name:** Working title is "Prompt Launcher." Other candidates:
   - PromptBar
   - QuickPrompt
   - Prompter
   - FlashPrompt

---

## Recommended Next Steps

1. **Tech Spec** — Define exact implementation: file structure, Tauri config, React components, data flow
2. **Design Direction** — Visual style, component mockups, interaction polish
3. **Build** — Start with Tauri scaffold, global hotkey, basic search UI

---

## Sources

This definition builds on:
- Initial ideation transcript (`1-SOURCE/app_idea_transcript.md`)
- Detailed concept transcript (`1-SOURCE/trans__spotlight_like_prompt_management.md`)
- Brainstorm exploration (`2-OUTPUT/claude_prompt-launcher-brainstorm.md`)
- User feedback session confirming: Tauri+React, focus stealing OK, paste-to-previous-app desired, markdown editor in MVP, frequency sorting in MVP, file-based storage over pure JSON
