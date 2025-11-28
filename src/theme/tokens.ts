/**
 * Design tokens - centralized visual language
 * Per CLAUDE.md: No inline design values, define tokens once
 */

/** Color tokens - reference via CSS custom properties */
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
    focus: 'var(--border-focus)',
  },
  accent: {
    primary: 'var(--accent-primary)',
    secondary: 'var(--accent-secondary)',
  },
  status: {
    success: 'var(--status-success)',
    error: 'var(--status-error)',
    warning: 'var(--status-warning)',
  },
  pill: {
    background: 'var(--pill-bg)',
    text: 'var(--pill-text)',
  },
  selection: {
    background: 'var(--selection-bg)',
  },
} as const;

/** Spacing tokens */
export const spacing = {
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
} as const;

/** Typography tokens */
export const typography = {
  fontFamily: {
    base: 'var(--font-family-base)',
    mono: 'var(--font-family-mono)',
  },
  fontSize: {
    xs: 'var(--font-size-xs)',
    sm: 'var(--font-size-sm)',
    md: 'var(--font-size-md)',
    lg: 'var(--font-size-lg)',
    xl: 'var(--font-size-xl)',
  },
  fontWeight: {
    normal: 'var(--font-weight-normal)',
    medium: 'var(--font-weight-medium)',
    semibold: 'var(--font-weight-semibold)',
  },
  lineHeight: {
    tight: 'var(--line-height-tight)',
    normal: 'var(--line-height-normal)',
    relaxed: 'var(--line-height-relaxed)',
  },
} as const;

/** Border radius tokens */
export const radii = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: 'var(--radius-full)',
} as const;

/** Shadow tokens */
export const shadows = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const;

/** Transition tokens */
export const transitions = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
} as const;
