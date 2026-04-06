# Instagram-Inspired Design Reference
> AI Agent Design Guide — Typography, Color, Spacing, and UI Patterns

---

## 1. Design Philosophy

Instagram's UI is built around **content-first minimalism**. The chrome (UI shell) disappears so photos, videos, and stories take center stage. Every design decision should ask: *does this compete with the content, or support it?*

Core principles:
- **Invisible UI** — navigation and controls are minimal, thin-stroked, and monochromatic so media pops
- **White space as breathing room** — generous padding prevents crowding
- **Hierarchy through weight, not color** — differentiate with font-weight and opacity before reaching for color
- **Touch-friendly** — all interactive targets ≥ 44px / 44pt

---

## 2. Typography

### Typeface Stack

Instagram uses **Instagram Sans** (a custom-commissioned typeface, a spiritual cousin of Proxima Nova) for brand moments. For app UI, it falls back to the system sans-serif stack.

```css
/* Brand / Display (headings, wordmarks, splash screens) */
font-family: 'Instagram Sans', 'Proxima Nova', -apple-system, BlinkMacSystemFont, sans-serif;

/* UI Body (all in-app text) */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Type Scale

| Role              | Size  | Weight      | Line Height | Usage                              |
|-------------------|-------|-------------|-------------|------------------------------------|
| Display / Hero    | 28px  | 700 Bold    | 1.2         | Splash screens, onboarding titles  |
| Title / Header    | 17px  | 600 SemiBold| 1.3         | Screen titles, modal headers       |
| Body              | 14px  | 400 Regular | 1.5         | Post captions, descriptions        |
| Body Strong       | 14px  | 600 SemiBold| 1.5         | Usernames in feeds, labels         |
| Label / Meta      | 12px  | 400 Regular | 1.4         | Timestamps, counts, secondary info |
| Micro             | 10px  | 400 Regular | 1.3         | Badges, story timestamps           |
| Button / CTA      | 14px  | 600 SemiBold| 1.0         | Primary and secondary buttons      |

### Typography Rules

- **Usernames are always SemiBold (600)** — this is the most consistent rule in Instagram's UI
- **Captions use Regular (400)** immediately after the bold username, no extra space
- **Never use ALL CAPS** in body or label text — Instagram avoids it except in rare UI labels
- **Letter spacing** — keep at 0 (default); avoid tight tracking on body text
- **Avoid mixing more than 2 weights** in a single component
- Use **tabular figures** (`font-variant-numeric: tabular-nums`) for counts, likes, follower numbers so they don't jitter

---

## 3. Color System

### Brand Gradient (Logo / Accent Moments)

Instagram's iconic gradient runs yellow → orange → pink → purple. Use sparingly — only for brand moments like story rings, live badges, or hero CTAs.

```css
/* Instagram Brand Gradient */
--ig-gradient: linear-gradient(
  45deg,
  #f9ce34,   /* Yellow */
  #ee2a7b,   /* Pink */
  #6228d7    /* Purple */
);

/* Story ring gradient (circular use) */
--ig-story-gradient: conic-gradient(
  from 0deg,
  #f9ce34,
  #ee2a7b,
  #6228d7,
  #f9ce34
);
```

### Light Mode Palette

```css
:root {
  /* Backgrounds */
  --bg-primary:        #FFFFFF;   /* Main screen background */
  --bg-secondary:      #FAFAFA;   /* Feed background, alt surfaces */
  --bg-elevated:       #FFFFFF;   /* Cards, modals, sheets */
  --bg-input:          #EFEFEF;   /* Search bar, input fields */
  --bg-overlay:        rgba(0, 0, 0, 0.5); /* Bottom sheets, modals */

  /* Text */
  --text-primary:      #262626;   /* All primary body text */
  --text-secondary:    #8E8E8E;   /* Timestamps, follower counts, muted labels */
  --text-placeholder:  #C7C7CC;   /* Input placeholders */
  --text-link:         #00376B;   /* Hashtags, mentions (dark blue) */
  --text-on-dark:      #FFFFFF;   /* Text on dark overlays */

  /* Borders & Dividers */
  --border-primary:    #DBDBDB;   /* Post borders, separator lines */
  --border-light:      #EFEFEF;   /* Subtle separators */

  /* Icons */
  --icon-default:      #262626;   /* Home, search, profile icons (inactive) */
  --icon-muted:        #8E8E8E;   /* Secondary icons */
  --icon-active:       #262626;   /* Active / filled nav icon */

  /* Interactive */
  --color-like:        #ED4956;   /* Heart / like — red */
  --color-cta:         #0095F6;   /* Follow button, links — Instagram blue */
  --color-cta-text:    #FFFFFF;
  --color-verified:    #0095F6;   /* Verified badge blue */
  --color-danger:      #ED4956;   /* Errors, destructive actions */
  --color-success:     #78C257;   /* Success states */
}
```

### Dark Mode Palette

Instagram dark mode follows the OS signal automatically. Colors shift to near-black backgrounds with off-white text — never pure black or pure white.

```css
@media (prefers-color-scheme: dark) {
  :root {
    /* Backgrounds */
    --bg-primary:        #000000;   /* True black (OLED-optimised) */
    --bg-secondary:      #121212;   /* Feed, list backgrounds */
    --bg-elevated:       #1C1C1C;   /* Cards, sheets */
    --bg-input:          #262626;   /* Search bar, inputs */

    /* Text */
    --text-primary:      #FAFAFA;   /* Primary text (off-white, not harsh) */
    --text-secondary:    #8E8E8E;   /* Muted — same as light mode */
    --text-placeholder:  #5C5C5C;
    --text-link:         #E0F1FF;   /* Hashtags, mentions (light blue) */

    /* Borders & Dividers */
    --border-primary:    #262626;
    --border-light:      #1C1C1C;

    /* Icons */
    --icon-default:      #FAFAFA;
    --icon-muted:        #8E8E8E;
    --icon-active:       #FAFAFA;

    /* Interactive (largely unchanged) */
    --color-like:        #ED4956;
    --color-cta:         #0095F6;
    --color-danger:      #ED4956;
  }
}
```

### Color Usage Rules

- **Blue (#0095F6) is the single action color** — Follow, Submit, Send, links. Never use it decoratively.
- **Red (#ED4956) is reserved for likes and errors only**
- **Never use the brand gradient as a button background** outside of story rings or live badges
- **Text on dark overlays**: always `#FFFFFF` at `opacity: 0.9`, not pure white
- **Disabled states**: drop opacity to `0.3` rather than changing the color

---

## 4. Spacing & Layout

### Base Unit

Everything is built on an **8px grid**. Use multiples of 4 for smaller nudges.

```
4px   — micro gap (icon-to-label, badge padding)
8px   — small (compact list item padding)
12px  — medium-small (comment padding, chip padding)
16px  — base (standard horizontal screen padding)
20px  — medium (section spacing)
24px  — large (between major sections)
32px  — xlarge (hero sections, onboarding)
```

### Screen Edge Padding

```
Horizontal gutter:   16px  (left and right from screen edge)
Post card padding:   0px   (posts bleed edge-to-edge)
Content inside post: 12px horizontal
```

### Component Spacing

| Component         | Padding / Gap            |
|-------------------|--------------------------|
| Nav bar height    | 44px (+ safe area)       |
| Tab bar height    | 49px (+ safe area)       |
| Avatar (small)    | 32×32px                  |
| Avatar (feed)     | 42×42px                  |
| Avatar (profile)  | 86×86px                  |
| Story ring gap    | 3px between ring & image |
| Post action row   | 8px vertical, 16px sides |
| Button height     | 36px (small), 44px (full)|
| Input height      | 36px (search), 44px (form)|

---

## 5. Iconography

- **Style**: Thin-stroke line icons (1.5–2px stroke weight), with a filled variant for active/selected state
- **Size**: 24×24px standard; 20×20px compact; 28×28px in action bars
- **Color**: Match `--icon-default` or `--icon-muted` — monochromatic, never colorful icons in navigation
- **Active state**: switch from outline → filled, same color (not blue, not gradient)
- Use `SF Symbols` on iOS, `Material Symbols` on Android — pick the `Outlined` weight set

---

## 6. Component Patterns

### Buttons

```css
/* Primary CTA (Follow, Submit) */
.btn-primary {
  background: var(--color-cta);       /* #0095F6 */
  color: var(--color-cta-text);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  padding: 7px 16px;
  border: none;
  min-height: 36px;
}

/* Secondary / Ghost (Following, Message) */
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  padding: 7px 16px;
  min-height: 36px;
}

/* Destructive */
.btn-danger {
  background: transparent;
  color: var(--color-danger);
  font-weight: 600;
}
```

### Feed Post Structure

```
┌─────────────────────────────────┐
│ [Avatar 42px] Username  •  3h   │  ← Header: 16px padding, 12px gap
│              Location subtitle  │
├─────────────────────────────────┤
│                                 │
│        Media (full bleed)       │  ← 1:1, 4:5, or 16:9 ratio
│                                 │
├─────────────────────────────────┤
│ ♡  ◻  ✈        [Bookmark]      │  ← Actions: 8px vertical, 16px sides
│ 1,248 likes                     │  ← Bold count, 14px SemiBold
│ username caption text here…     │  ← Bold username + Regular caption inline
│ View all 24 comments            │  ← Muted text, 14px Regular
│ 3 hours ago                     │  ← Timestamp, 10px, --text-secondary
└─────────────────────────────────┘
```

### Story Ring

```css
.story-ring {
  background: var(--ig-gradient);
  border-radius: 50%;
  padding: 3px;                     /* ring thickness */
}
.story-ring__inner {
  background: var(--bg-primary);    /* creates the gap */
  border-radius: 50%;
  padding: 2px;
}
.story-ring__avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
}

/* Seen state */
.story-ring--seen {
  background: var(--border-primary); /* #DBDBDB in light, #262626 in dark */
}
```

### Input / Search Bar

```css
.search-bar {
  background: var(--bg-input);      /* #EFEFEF / #262626 dark */
  border-radius: 10px;
  height: 36px;
  padding: 0 12px;
  border: none;
  font-size: 14px;
  color: var(--text-primary);
}
.search-bar::placeholder {
  color: var(--text-secondary);
}
```

---

## 7. Motion & Interaction

- **Transitions**: `200ms ease-out` for state changes (like, follow, tab switch)
- **Press feedback**: scale to `0.96` on press, back to `1.0` on release
- **Like animation**: heart bounces to `1.2×` scale then settles — use `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like)
- **Story open**: full-screen scale-up from thumbnail origin point
- **Bottom sheet**: slides up with `300ms ease-out`, backdrop fades in simultaneously
- **No loading spinners inside content** — use skeleton screens (gray animated placeholders) instead

```css
/* Spring-like bounce for likes */
@keyframes heart-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* Skeleton shimmer */
@keyframes shimmer {
  0%   { background-position: -300px 0; }
  100% { background-position: 300px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #efefef 25%, #e0e0e0 50%, #efefef 75%);
  background-size: 600px 100%;
  animation: shimmer 1.4s infinite linear;
  border-radius: 4px;
}
```

---

## 8. Border Radius

```
4px   — chips, small badges
8px   — buttons, cards, inputs, modals
12px  — bottom sheets, photo thumbnails
50%   — avatars, story rings, floating buttons
0px   — feed images (full bleed, no radius)
```

---

## 9. Shadows & Elevation

Instagram uses **almost no shadows** in light mode — elevation is expressed through borders and background-color contrast, not drop shadows.

```css
/* Rare use — modal / bottom sheet only */
box-shadow: 0 -1px 0 rgba(0,0,0,0.08);  /* subtle top edge for sheets */

/* Story thumbnail border (to separate from white bg) */
border: 0.5px solid rgba(0,0,0,0.08);
```

---

## 10. Accessibility Checklist

- All text/background combos must meet **WCAG AA** (4.5:1 for body, 3:1 for large text)
- **Touch targets ≥ 44×44px** even if the visual icon is smaller — use padding
- **Never convey meaning through color alone** — pair color with icon or text label
- Support **system font size scaling** (Dynamic Type / sp units)
- All interactive elements must have a **focus ring** visible in accessibility mode
- Images must have `alt` text; decorative images use `alt=""`

---

## 11. Quick Reference Cheat Sheet

```
Brand gradient:    #f9ce34 → #ee2a7b → #6228d7  (45deg)
Primary action:    #0095F6  (blue)
Like / danger:     #ED4956  (red)
Text primary:      #262626  (light) / #FAFAFA (dark)
Text muted:        #8E8E8E  (both modes)
Border:            #DBDBDB  (light) / #262626 (dark)
Background:        #FAFAFA  (light) / #000000 (dark)
Font (UI):         System sans-serif stack
Font (brand):      Instagram Sans / Proxima Nova
Base grid:         8px
Screen padding:    16px horizontal
Border radius:     8px default, 50% avatars
Transition:        200ms ease-out
```

---

*Reference compiled April 2026. Instagram's design system evolves — verify edge cases against the live app.*