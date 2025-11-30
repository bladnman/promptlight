/**
 * Design Tokens - Promptlight Design System
 *
 * TypeScript references to CSS custom properties for type safety.
 * See DESIGN.md for rationale and src/styles/variables.css for values.
 */

/**
 * Color tokens - semantic color references
 */
export const colors = {
  background: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    elevated: 'var(--bg-elevated)',
    overlay: 'var(--bg-overlay)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    muted: 'var(--text-muted)',
    accent: 'var(--text-accent)',
  },
  border: {
    default: 'var(--border-default)',
    subtle: 'var(--border-subtle)',
    focus: 'var(--border-focus)',
  },
  accent: {
    primary: 'var(--accent-primary)',
    secondary: 'var(--accent-secondary)',
    muted: 'var(--accent-muted)',
    subtle: 'var(--accent-subtle)',
  },
  status: {
    success: 'var(--status-success)',
    error: 'var(--status-error)',
    warning: 'var(--status-warning)',
    info: 'var(--status-info)',
  },
  interactive: {
    pillBg: 'var(--pill-bg)',
    pillText: 'var(--pill-text)',
    selectionBg: 'var(--selection-bg)',
    hoverBg: 'var(--hover-bg)',
    activeBg: 'var(--active-bg)',
  },
  // Legacy aliases
  pill: {
    background: 'var(--pill-bg)',
    text: 'var(--pill-text)',
  },
  selection: {
    background: 'var(--selection-bg)',
  },
} as const;

/**
 * Raw color palette access (for special cases)
 */
export const palette = {
  avocado: {
    50: 'var(--color-avocado-50)',
    100: 'var(--color-avocado-100)',
    200: 'var(--color-avocado-200)',
    300: 'var(--color-avocado-300)',
    400: 'var(--color-avocado-400)',
    500: 'var(--color-avocado-500)',
    600: 'var(--color-avocado-600)',
    700: 'var(--color-avocado-700)',
    800: 'var(--color-avocado-800)',
    900: 'var(--color-avocado-900)',
    950: 'var(--color-avocado-950)',
  },
  lime: {
    200: 'var(--color-lime-200)',
    300: 'var(--color-lime-300)',
  },
  stone: {
    50: 'var(--color-stone-50)',
    100: 'var(--color-stone-100)',
    200: 'var(--color-stone-200)',
    300: 'var(--color-stone-300)',
    400: 'var(--color-stone-400)',
    500: 'var(--color-stone-500)',
    600: 'var(--color-stone-600)',
    700: 'var(--color-stone-700)',
    800: 'var(--color-stone-800)',
    900: 'var(--color-stone-900)',
    950: 'var(--color-stone-950)',
  },
} as const;

/**
 * Spacing tokens - 4px base unit
 */
export const spacing = {
  0: 'var(--space-0)',
  1: 'var(--space-1)',
  2: 'var(--space-2)',
  3: 'var(--space-3)',
  4: 'var(--space-4)',
  5: 'var(--space-5)',
  6: 'var(--space-6)',
  8: 'var(--space-8)',
  10: 'var(--space-10)',
  // Legacy aliases
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
} as const;

/**
 * Typography tokens - intentional hierarchy
 */
export const typography = {
  fontFamily: {
    base: 'var(--font-family-base)',
    mono: 'var(--font-family-mono)',
  },
  fontSize: {
    '2xs': 'var(--font-size-2xs)',
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    md: 'var(--font-size-md)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
    '2xl': 'var(--font-size-2xl)',
  },
  fontWeight: {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
  },
  letterSpacing: {
    tighter: 'var(--tracking-tighter)',
    tight: 'var(--tracking-tight)',
    normal: 'var(--tracking-normal)',
    wide: 'var(--tracking-wide)',
    wider: 'var(--tracking-wider)',
  },
  lineHeight: {
    none: 'var(--line-height-none)',
    tight: 'var(--line-height-tight)',
    snug: 'var(--line-height-snug)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
    loose: 'var(--line-height-loose)',
  },
} as const;

/**
 * Text style presets - combine size, weight, tracking, line-height
 * See DESIGN.md for hierarchy rationale
 */
export const textStyles = {
  /** H1 - Display: Hero/empty states (24px semibold) */
  display: {
    fontSize: 'var(--font-size-2xl)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: 'var(--tracking-tighter)',
    lineHeight: 'var(--line-height-tight)',
  },
  /** H2 - Title: Section headers (18px semibold) */
  title: {
    fontSize: 'var(--font-size-xl)',
    fontWeight: 'var(--font-weight-semibold)',
    letterSpacing: 'var(--tracking-tight)',
    lineHeight: 'var(--line-height-snug)',
  },
  /** H3 - Label: Primary item text (14px medium) */
  label: {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: 'var(--tracking-normal)',
    lineHeight: 'var(--line-height-normal)',
  },
  /** H4 - Body: Descriptions (13px normal) */
  body: {
    fontSize: 'var(--font-size-md)',
    fontWeight: 'var(--font-weight-normal)',
    letterSpacing: 'var(--tracking-normal)',
    lineHeight: 'var(--line-height-relaxed)',
  },
  /** H5 - Caption: Supporting info (11px normal) */
  caption: {
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-normal)',
    letterSpacing: 'var(--tracking-wide)',
    lineHeight: 'var(--line-height-normal)',
  },
  /** H6 - Micro: Keyboard hints (10px medium) */
  micro: {
    fontSize: 'var(--font-size-2xs)',
    fontWeight: 'var(--font-weight-medium)',
    letterSpacing: 'var(--tracking-wider)',
    lineHeight: 'var(--line-height-snug)',
  },
} as const;

/**
 * Border radius tokens
 */
export const radii = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

/**
 * Shadow tokens
 */
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const;

/**
 * Transition tokens
 */
export const transitions = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
} as const;
