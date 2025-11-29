/**
 * Centralized configuration - no magic numbers in components
 * Per CLAUDE.md: All literal values must be extracted to configuration
 */

/** Keyboard shortcuts */
export const HOTKEYS = {
  /** Global hotkey to summon the launcher */
  GLOBAL_SUMMON: 'Command+Shift+Space',
  /** Keys that trigger promotion of selected prompt */
  PROMOTE: ['Space', 'Tab', 'ArrowRight'] as const,
  /** Key to select/paste the prompt */
  SELECT: 'Enter',
  /** Key to dismiss the launcher */
  DISMISS: 'Escape',
  /** Navigate up in results */
  NAVIGATE_UP: 'ArrowUp',
  /** Navigate down in results */
  NAVIGATE_DOWN: 'ArrowDown',
} as const;

/** Search configuration */
export const SEARCH_CONFIG = {
  /** Debounce delay for search input (ms) */
  DEBOUNCE_MS: 50,
  /** Maximum number of results to display */
  MAX_RESULTS: 15,
  /** Minimum query length to trigger search */
  MIN_QUERY_LENGTH: 1,
} as const;

/** Window configuration */
export const WINDOW_CONFIG = {
  LAUNCHER: {
    /** Width of the launcher window (px) */
    WIDTH: 650,
    /** Minimum height of the launcher window (px) */
    MIN_HEIGHT: 80,
    /** Maximum height of the launcher window (px) */
    MAX_HEIGHT: 400,
    /** Border radius of the launcher window (px) */
    BORDER_RADIUS: 12,
    /** Padding inside the launcher window (px) */
    PADDING: 16,
  },
  EDITOR: {
    /** Minimum width of the editor window (px) */
    MIN_WIDTH: 800,
    /** Minimum height of the editor window (px) */
    MIN_HEIGHT: 600,
  },
} as const;

/** Paste configuration */
export const PASTE_CONFIG = {
  /** Delay before simulating paste after hiding window (ms) */
  DELAY_MS: 100,
} as const;

/** Animation durations (ms) */
export const ANIMATION_CONFIG = {
  /** Fade in duration */
  FADE_IN: 150,
  /** Fade out duration */
  FADE_OUT: 100,
  /** Slide in duration */
  SLIDE_IN: 200,
  /** Highlight transition duration */
  HIGHLIGHT_TRANSITION: 100,
} as const;

/** Auto-save configuration */
export const AUTO_SAVE_CONFIG = {
  /** Debounce delay for auto-save (ms) */
  DEBOUNCE_MS: 1000,
} as const;

/** Launcher cache configuration */
export const CACHE_CONFIG = {
  /**
   * TTL for search results cache (ms)
   * When a search is performed, results are cached for this duration.
   * Opening/closing the launcher within this window shows cached results.
   * Set to 10000 (10s) for dev, 60000 (60s) for production.
   */
  SEARCH_RESULTS_TTL_MS: 10000,
  /**
   * Launch results (empty query) never expire within a session.
   * They're only invalidated by editor save/create/delete operations.
   */
} as const;

/** Sidebar configuration */
export const SIDEBAR_CONFIG = {
  /** Debounce delay for search filter (ms) */
  FILTER_DEBOUNCE_MS: 150,
  /** Minimum folder name length */
  MIN_FOLDER_NAME_LENGTH: 1,
  /** Maximum folder name length */
  MAX_FOLDER_NAME_LENGTH: 32,
  /** Animation duration for folder collapse (ms) */
  COLLAPSE_ANIMATION_MS: 200,
} as const;

/** Icons used in the UI (Unicode characters) */
export const ICONS = {
  FOLDER: '\u25A0', // ■
  DOCUMENT: '\u25CB', // ○
  CHEVRON_DOWN: '\u25BC', // ▼
  CHEVRON_RIGHT: '\u25B6', // ▶
  SEARCH: '\u2315', // ⌕
  PLUS: '+',
  CLEAR: '\u2715', // ✕
} as const;

/** Keyboard hint display labels */
export const KEYBOARD_HINT_LABELS = {
  NAVIGATE: '\u2191\u2193', // ↑↓
  PROMOTE: 'Tab',
  PASTE: 'Enter',
  DISMISS: 'Esc',
  NEW_PROMPT: '\u2318N', // ⌘N
  EDIT_PROMPT: '\u21E7\u21B5', // ⇧↵
} as const;

/** Available icon names for prompts and folders (Lucide icon names) */
export const PROMPT_ICONS = [
  // Documents & Text
  'file-text',
  'message-square',
  'align-left',
  'type',
  'list',
  'clipboard',
  'file-code',
  // Development
  'code',
  'terminal',
  'git-branch',
  'database',
  'bug',
  'cpu',
  'braces',
  // Actions & Workflow
  'edit',
  'pen-tool',
  'send',
  'mail',
  'search',
  'settings',
  'wrench',
  'check-circle',
  'help-circle',
  'info',
  // Organization
  'bookmark',
  'tag',
  'folder',
  'archive',
  'inbox',
  'layers',
  // People & Social
  'user',
  'users',
  'smile',
  'meh',
  'frown',
  // Fun & Expression
  'star',
  'heart',
  'zap',
  'lightbulb',
  'sparkles',
  'flame',
  'rocket',
  'trophy',
  'crown',
  'gem',
  'gift',
  // Nature & Weather
  'sun',
  'moon',
  'cloud',
  'snowflake',
  'umbrella',
  'leaf',
  // Food & Drink
  'coffee',
  'pizza',
  'apple',
  'cookie',
  'cake',
  'wine',
  'beer',
  // Animals
  'cat',
  'dog',
  'bird',
  'fish',
  'rabbit',
  // Media & Entertainment
  'music',
  'video',
  'image',
  'camera',
  'mic',
  'headphones',
  'gamepad-2',
  'tv',
  'radio',
  // Travel & Places
  'globe',
  'map',
  'compass',
  'plane',
  'car',
  'bike',
  'home',
  'building',
  // Time & Calendar
  'calendar',
  'clock',
  'timer',
  'hourglass',
  // Business
  'briefcase',
  'wallet',
  'credit-card',
  'shopping-cart',
  // Misc
  'puzzle',
  'palette',
  'scissors',
  'glasses',
  'wand-2',
] as const;

export type PromptIconName = (typeof PROMPT_ICONS)[number];

/** Available colors for prompts and folders */
export const PROMPT_COLORS = {
  gray: '#6b7280',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
} as const;

export type PromptColorName = keyof typeof PROMPT_COLORS;

/** Default icon and color for new prompts */
export const DEFAULT_PROMPT_ICON: PromptIconName = 'file-text';
export const DEFAULT_PROMPT_COLOR: PromptColorName = 'blue';

/** Default icon and color for folders */
export const DEFAULT_FOLDER_ICON: PromptIconName = 'folder';
export const DEFAULT_FOLDER_COLOR: PromptColorName = 'gray';
