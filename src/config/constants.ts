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
