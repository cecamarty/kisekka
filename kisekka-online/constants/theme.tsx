/**
 * Kisekka Online — Design System
 * Modelled after Instagram's visual language (see Design.md).
 *
 * Primary action:  #0095F6  (Instagram blue)
 * Like / danger:   #ED4956  (Instagram red)
 * Text primary:    #262626
 * Text muted:      #8E8E8E
 * Background:      #FAFAFA
 * Base grid:       8px  (Spacing values are multiples of 4/8)
 */

// ── Colors ────────────────────────────────────────────────────────────────────

export const Colors = {
  // Primary action (Follow, Submit, Send, links)
  primary: '#0095F6',
  primaryDark: '#0074CC',
  primaryLight: '#E0F3FF',   // tint for filled-input highlight etc.

  // Brand gradient stops — use only for story rings, live badges, hero moments
  gradientYellow: '#F9CE34',
  gradientPink:   '#EE2A7B',
  gradientPurple: '#6228D7',

  // Text
  text:           '#262626',   // primary body text
  textSecondary:  '#8E8E8E',   // timestamps, counts, muted labels
  textPlaceholder:'#C7C7CC',   // input placeholders
  textLink:       '#00376B',   // hashtags, mentions
  textOnDark:     '#FFFFFF',   // text on dark overlays (use at opacity 0.9)

  // Backgrounds
  white:          '#FFFFFF',
  background:     '#FAFAFA',   // feed / screen background
  surface:        '#FFFFFF',   // cards, modals, sheets
  inputBg:        '#EFEFEF',   // search bar, input fields
  overlay:        'rgba(0, 0, 0, 0.5)',

  // Borders & dividers
  border:         '#DBDBDB',   // post borders, separator lines
  borderLight:    '#EFEFEF',   // subtle separators

  // Icons
  iconDefault:    '#262626',
  iconMuted:      '#8E8E8E',

  // Semantic
  like:           '#ED4956',   // heart / like — reserved for likes only
  error:          '#ED4956',   // errors, destructive actions
  success:        '#78C257',
  verified:       '#0095F6',
  amber:          '#F59E0B',   // looking_for post type badge
  purple:         '#7C3AED',   // announcement post type badge

  // Aliases kept for backward compatibility
  black:          '#000000',
  divider:        '#EFEFEF',   // same as borderLight

  // Skeleton shimmer base
  shimmer:        '#EFEFEF',
  shimmerHighlight:'#E0E0E0',

  // ── Dark mode palette (apply via useColorScheme when dark mode is added) ──
  dark: {
    background:   '#000000',   // true black — OLED optimised
    surface:      '#1C1C1C',
    input:        '#262626',
    border:       '#262626',
    borderLight:  '#1C1C1C',
    text:         '#FAFAFA',
    textSecondary:'#8E8E8E',
    textPlaceholder:'#5C5C5C',
    textLink:     '#E0F1FF',
    icon:         '#FAFAFA',
  },
};

// ── Typography ────────────────────────────────────────────────────────────────
// Scale from Design.md — all using Inter (installed via @expo-google-fonts/inter)

export const Typography = {
  // 28px / 700 — splash screens, onboarding titles
  display: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,     // ×1.2
    letterSpacing: -0.5,
    color: Colors.text,
  },

  // 24px / 700 — large in-screen headings
  h1: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    lineHeight: 30,
    letterSpacing: -0.3,
    color: Colors.text,
  },

  // 20px / 600 — section headings
  h2: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 26,
    letterSpacing: -0.2,
    color: Colors.text,
  },

  // 17px / 600 — screen titles, modal headers
  h3: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 22,     // ×1.3
    letterSpacing: -0.1,
    color: Colors.text,
  },

  // 14px / 400 — captions, descriptions, general body
  body: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 21,     // ×1.5
    letterSpacing: 0,
    color: Colors.text,
  },

  // 14px / 600 — usernames in feed, labels, strong body
  bodyMedium: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 21,
    letterSpacing: 0,
    color: Colors.text,
  },

  // 12px / 400 — timestamps, counts, secondary info
  caption: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,     // ×1.4
    letterSpacing: 0,
    color: Colors.textSecondary,
  },

  // 12px / 600 — label emphasis
  captionBold: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 17,
    letterSpacing: 0,
    color: Colors.text,
  },

  // 10px / 400 — badges, story timestamps
  micro: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    lineHeight: 13,     // ×1.3
    letterSpacing: 0,
    color: Colors.textSecondary,
  },

  // 14px / 600 — button and CTA labels
  button: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 14,     // ×1.0 — optical centering in buttons
    letterSpacing: 0,
  },

  // Link style
  link: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    lineHeight: 21,
    letterSpacing: 0,
    color: Colors.primary,
  },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
// Built on an 8px grid; 4px increments for micro gaps

export const Spacing = {
  xs:   4,   // micro gap — icon-to-label, badge padding
  sm:   8,   // compact list item padding
  md:   12,  // comment padding, chip padding
  base: 16,  // standard horizontal screen gutter
  lg:   20,  // section spacing
  xl:   24,  // between major sections
  xxl:  32,  // hero sections, onboarding
  xxxl: 48,  // very large vertical gaps
};

// ── Border Radius ─────────────────────────────────────────────────────────────

export const BorderRadius = {
  xs:   4,    // chips, small badges
  sm:   8,    // buttons, cards, inputs, modals  ← default
  md:   10,   // search bar (Instagram uses 10px)
  lg:   12,   // bottom sheets, photo thumbnails
  xl:   16,
  full: 9999, // avatars, story rings, FABs
};

// ── Component Sizes ───────────────────────────────────────────────────────────

export const AvatarSize = {
  sm:      32,  // compact lists
  md:      42,  // feed header
  lg:      86,  // profile screen
};

export const TouchTarget = 44; // minimum touch target (Apple HIG / WCAG)

// ── Shared Component Styles ───────────────────────────────────────────────────

/** Form input — full-width, 44px touch target */
export const inputStyle = {
  backgroundColor: Colors.inputBg,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.sm,
  paddingHorizontal: Spacing.base,
  paddingVertical: 13,            // 13×2 + 14 line-height ≈ 44px
  fontSize: 14,
  fontFamily: 'Inter_400Regular',
  color: Colors.text,
} as const;

/** Filled primary button — full width, 44px height */
export const primaryButton = {
  backgroundColor: Colors.primary,
  borderRadius: BorderRadius.sm,
  paddingVertical: 13,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: TouchTarget,
};

/** Outlined secondary button — full width, 44px height */
export const outlineButton = {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.sm,
  paddingVertical: 12,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: TouchTarget,
};

/** Small inline button (e.g. Follow on feed card) — 36px */
export const inlineButton = {
  backgroundColor: Colors.primary,
  borderRadius: BorderRadius.sm,
  paddingVertical: 7,
  paddingHorizontal: Spacing.base,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: 36,
};

/** Small outlined inline button */
export const inlineOutlineButton = {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.sm,
  paddingVertical: 6,
  paddingHorizontal: Spacing.base,
  borderWidth: 1,
  borderColor: Colors.border,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  minHeight: 36,
};
