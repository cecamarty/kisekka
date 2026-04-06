/**
 * Kisekka Online — Design System
 * Typography and palette modelled after Instagram's visual language.
 * Primary action color: #1A73E8 (per spec).
 */

export const Colors = {
  // Brand
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  primaryLight: '#E8F0FE',

  // Instagram-style neutrals
  black: '#000000',
  text: '#262626',          // Instagram near-black
  textSecondary: '#8E8E8E', // Instagram muted gray
  textMuted: '#C7C7C7',

  white: '#FFFFFF',
  background: '#FAFAFA',    // Instagram off-white
  surface: '#FFFFFF',

  border: '#DBDBDB',        // Instagram divider
  divider: '#EFEFEF',
  inputBg: '#FAFAFA',

  error: '#ED4956',         // Instagram red
  success: '#2ECC71',

  overlay: 'rgba(0, 0, 0, 0.5)',
  shimmer: '#F2F2F2',
};

// Instagram-style typography scale using Inter
// Tight letter-spacing on headings, normal tracking for body
export const Typography = {
  display: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    lineHeight: 34,
    color: Colors.text,
  },
  h1: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
    lineHeight: 30,
    color: Colors.text,
  },
  h2: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
    lineHeight: 26,
    color: Colors.text,
  },
  h3: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.1,
    lineHeight: 22,
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
    lineHeight: 20,
    color: Colors.text,
  },
  bodyMedium: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0,
    lineHeight: 20,
    color: Colors.text,
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.1,
    lineHeight: 18,
    color: Colors.text,
  },
  button: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0,
    lineHeight: 20,
  },
  link: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0,
    lineHeight: 20,
    color: Colors.primary,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Instagram-style input style (shared across auth screens)
export const inputStyle = {
  backgroundColor: Colors.inputBg,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.md,
  paddingHorizontal: Spacing.md,
  paddingVertical: 13,
  fontSize: 14,
  fontFamily: 'Inter_400Regular',
  color: Colors.text,
};

// Filled primary button
export const primaryButton = {
  backgroundColor: Colors.primary,
  borderRadius: BorderRadius.md,
  paddingVertical: 13,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

// Outlined secondary button
export const outlineButton = {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.md,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
