/**
 * Readiness — Design Tokens
 * "Know before you go."
 *
 * Single source of truth for all visual decisions.
 * Dark mode first. Amber/gold accent. Precision over decoration.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: {
    primary: '#0D0F14',    // Near-black canvas
    secondary: '#151820',  // Slightly lifted surface
    tertiary: '#1C2030',   // Cards, sheets
    elevated: '#222840',   // Modals, dropdowns
  },

  // Brand Accent — Amber/Gold
  amber: {
    50:  '#FFF8E7',
    100: '#FDEFC4',
    200: '#FBE099',
    300: '#F8CC60',
    400: '#F5A623',  // ← Primary accent (#F5A623)
    500: '#E08B00',
    600: '#B86E00',
    700: '#8A5000',
    800: '#5C3500',
    900: '#2E1A00',
  },

  // Score Colors — maps to readiness score 0–100
  score: {
    critical:   '#E53935',  // 0–20   — Deep red
    poor:       '#F4511E',  // 21–40  — Orange-red
    fair:       '#FB8C00',  // 41–60  — Amber-orange
    good:       '#7CB342',  // 61–80  — Muted green
    optimal:    '#43A047',  // 81–100 — Rich green
  },

  // Semantic colors
  success:   '#43A047',
  warning:   '#F5A623',
  error:     '#E53935',
  info:      '#1E88E5',

  // Text
  text: {
    primary:   '#F0F2F8',   // Near-white — headings, scores
    secondary: '#9BA3B8',   // Muted — labels, metadata
    tertiary:  '#5A6180',   // Dimmed — placeholders, disabled
    inverse:   '#0D0F14',   // On light backgrounds
    accent:    '#F5A623',   // Amber text links / highlights
  },

  // Borders & Dividers
  border: {
    subtle:  '#1F2438',     // Barely-there separators
    default: '#2A3050',     // Standard borders
    strong:  '#404870',     // Focused inputs, active states
  },

  // Absolute
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontFamily = {
  // Will be loaded via expo-font
  regular:   'Inter-Regular',
  medium:    'Inter-Medium',
  semiBold:  'Inter-SemiBold',
  bold:      'Inter-Bold',
  // Score number uses a tabular / monospaced variant for clean digits
  mono:      'Inter-Regular',
} as const;

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
  '5xl': 64,   // The big readiness score number
  '6xl': 80,
} as const;

export const fontWeight = {
  regular:  '400' as const,
  medium:   '500' as const,
  semiBold: '600' as const,
  bold:     '700' as const,
} as const;

export const lineHeight = {
  tight:   1.15,
  snug:    1.3,
  normal:  1.5,
  relaxed: 1.7,
} as const;

export const letterSpacing = {
  tight:  -0.5,
  normal:  0,
  wide:    0.5,
  wider:   1.0,
  widest:  2.0,  // Used for uppercase labels / section headers
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────
// 4pt base grid. Every layout measurement should be a multiple of 4.

export const spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  3.5:  14,
  4:    16,
  5:    20,
  6:    24,
  7:    28,
  8:    32,
  9:    36,
  10:   40,
  12:   48,
  14:   56,
  16:   64,
  20:   80,
  24:   96,
  32:   128,
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  none:  0,
  xs:    4,
  sm:    8,
  md:    12,
  lg:    16,
  xl:    24,
  '2xl': 32,
  full:  9999,  // Pill / circle
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────
// React Native shadow props (iOS) + elevation (Android)

export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  // Amber glow — used behind the score ring on high readiness scores
  amberGlow: {
    shadowColor: '#F5A623',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

// ─── Score Helpers ────────────────────────────────────────────────────────────

/**
 * Returns the semantic color for a given readiness score (0–100).
 */
export function getScoreColor(score: number): string {
  if (score <= 20) return colors.score.critical;
  if (score <= 40) return colors.score.poor;
  if (score <= 60) return colors.score.fair;
  if (score <= 80) return colors.score.good;
  return colors.score.optimal;
}

/**
 * Returns a human-readable label for a given readiness score.
 */
export function getScoreLabel(score: number): string {
  if (score <= 20) return 'Rest Up';
  if (score <= 40) return 'Take It Easy';
  if (score <= 60) return 'Moderate';
  if (score <= 80) return 'Good to Go';
  return 'Peak Ready';
}

// ─── Animation Durations ──────────────────────────────────────────────────────

export const duration = {
  instant:  100,
  fast:     200,
  normal:   300,
  slow:     500,
  verySlow: 800,
} as const;

export const easing = {
  // Use with react-native-reanimated
  standard: 'easeInOut',
  enter:    'easeOut',
  exit:     'easeIn',
} as const;

// ─── Layout ───────────────────────────────────────────────────────────────────

export const layout = {
  screenPaddingH: spacing[5],   // 20px horizontal screen padding
  screenPaddingV: spacing[6],   // 24px vertical screen padding
  tabBarHeight:   64,
  headerHeight:   56,
  cardGap:        spacing[3],   // 12px gap between cards
} as const;

// ─── Composite theme object ───────────────────────────────────────────────────

export const theme = {
  colors,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  spacing,
  radius,
  shadow,
  duration,
  easing,
  layout,
  getScoreColor,
  getScoreLabel,
} as const;

export type Theme = typeof theme;
export type ScoreColor = ReturnType<typeof getScoreColor>;
