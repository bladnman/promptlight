/**
 * Promptlight Color Palette
 *
 * Based on app icon colors (avocado theme):
 * - Dark avocado: #486325 (rgb 72, 99, 37)
 * - Light lime: #CFD886 (rgb 207, 216, 134)
 *
 * See DESIGN.md for color theory rationale.
 */

/**
 * Primary brand color - Avocado green
 * HSL base: 87°, 46%, 27%
 */
export const avocado = {
  50: '#F4F7ED',
  100: '#E8EFDB',
  200: '#D4E1BC',
  300: '#B8CE93',
  400: '#9AB86E',
  500: '#7FA04E',
  600: '#648339',
  700: '#4D6530', // Closest to icon dark (#486325)
  800: '#41512B',
  900: '#384527',
  950: '#1C2512',
} as const;

/**
 * Accent color - Light lime (from icon speech bubble)
 * Used sparingly for highlights and emphasis
 */
export const lime = {
  50: '#F9FAEF',
  100: '#F1F5DB',
  200: '#E4ECBC',
  300: '#CFD886', // Exact match from icon
  400: '#BCC963',
  500: '#A0B144',
  600: '#7D8C33',
  700: '#5F6B2B',
  800: '#4D5627',
  900: '#414924',
  950: '#222810',
} as const;

/**
 * Neutral palette - Stone (warm gray)
 * Warm undertones complement the green
 */
export const stone = {
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#57534E',
  700: '#44403C',
  800: '#292524',
  900: '#1C1917',
  950: '#0C0A09',
} as const;

/**
 * Success - Emerald green
 * Cleaner green for positive states (distinct from brand)
 */
export const emerald = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
  950: '#022C22',
} as const;

/**
 * Warning - Amber
 * Warm yellow-orange for caution states
 */
export const amber = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
  950: '#451A03',
} as const;

/**
 * Error - Red
 * Classic red for error and destructive states
 */
export const red = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
  950: '#450A0A',
} as const;

/**
 * Info - Slate blue
 * Cool tone for informational states
 */
export const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
  950: '#020617',
} as const;

/**
 * Pure values for special cases
 */
export const pure = {
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Semantic color mappings for dark theme
 */
export const darkTheme = {
  // Backgrounds
  bgPrimary: stone[900],
  bgSecondary: stone[800],
  bgElevated: stone[700],
  bgOverlay: 'rgba(0, 0, 0, 0.6)',

  // Text
  textPrimary: stone[50],
  textSecondary: stone[300],
  textMuted: stone[400],
  textAccent: avocado[400],

  // Borders
  borderDefault: 'rgba(255, 255, 255, 0.1)',
  borderFocus: avocado[500],

  // Accent
  accentPrimary: avocado[500],
  accentSecondary: avocado[600],
  accentMuted: avocado[700],

  // Status
  success: emerald[500],
  warning: amber[400],
  error: red[500],
  info: slate[400],

  // Interactive
  pillBg: avocado[700],
  pillText: lime[200],
  selectionBg: 'rgba(127, 160, 78, 0.2)', // avocado-500 @ 20%
  hoverBg: 'rgba(255, 255, 255, 0.05)',
  activeBg: 'rgba(255, 255, 255, 0.1)',
} as const;

/**
 * Semantic color mappings for light theme
 */
export const lightTheme = {
  // Backgrounds
  bgPrimary: pure.white,
  bgSecondary: stone[100],
  bgElevated: pure.white,
  bgOverlay: 'rgba(0, 0, 0, 0.3)',

  // Text
  textPrimary: stone[900],
  textSecondary: stone[600],
  textMuted: stone[500],
  textAccent: avocado[700],

  // Borders
  borderDefault: stone[200],
  borderFocus: avocado[600],

  // Accent
  accentPrimary: avocado[600],
  accentSecondary: avocado[700],
  accentMuted: avocado[500],

  // Status
  success: emerald[600],
  warning: amber[500],
  error: red[600],
  info: slate[500],

  // Interactive
  pillBg: avocado[100],
  pillText: avocado[800],
  selectionBg: 'rgba(100, 131, 57, 0.15)', // avocado-600 @ 15%
  hoverBg: stone[100],
  activeBg: stone[200],
} as const;

// Re-export all palettes
export const palette = {
  avocado,
  lime,
  stone,
  emerald,
  amber,
  red,
  slate,
  pure,
} as const;
