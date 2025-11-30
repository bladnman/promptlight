# Promptlight Design System

> A cohesive visual language for a Spotlight-style prompt launcher.
> Every decision documented. Nothing arbitrary.

---

## Table of Contents

1. [Color Theory](#color-theory-analysis)
2. [Information Hierarchy](#information-hierarchy)
3. [Typography System](#typography)
4. [Spacing & Rhythm](#spacing--rhythm)
5. [Implementation Plan](#implementation-plan)

---

## Color Theory Analysis

### Source: App Icon Colors

From `icon_promptlight_ANGLED.svg`:
- **Dark Avocado**: `rgb(72, 99, 37)` → `#486325` → `HSL(87°, 46%, 27%)`
- **Light Lime**: `rgb(207, 216, 134)` → `#CFD886` → `HSL(67°, 50%, 69%)`

### Color Psychology

**Green (Yellow-Green family)**:
- Associations: Growth, freshness, creativity, intelligence, productivity
- The avocado specifically evokes: Organic, approachable, modern health-consciousness
- Perfect for a "prompt" tool - suggests nurturing ideas, growth of thought

### Palette Strategy: Analogous with Warm Neutrals

We're using an **analogous color scheme** (colors adjacent on the color wheel) because:
1. Creates visual harmony without high contrast clashing
2. Feels sophisticated and professional
3. The green stays hero without competing colors

**Why NOT complementary (purple/violet)?**
- Would feel too "playful" or "crayon-like"
- Complementary schemes are high-energy, we want subtle sophistication

### Color Scale Generation

Building a 10-step scale from our base colors:

```
Avocado Scale (primary):
50:  #F4F7ED  - Lightest tint (backgrounds)
100: #E4EBD4  - Very light
200: #CFD886  - Light lime (from icon) ← accent highlight
300: #B5C56A  - Medium light
400: #8BA84D  - Medium
500: #6B8B3A  - Base medium
600: #5A7532  - Medium dark
700: #486325  - Dark (from icon) ← primary brand
800: #3A5020  - Very dark
900: #2C3D18  - Darkest (near black)
950: #1E2A10  - Ultra dark
```

### Semantic Color Mapping

| Role | Dark Theme | Light Theme | Rationale |
|------|------------|-------------|-----------|
| **Primary** | Avocado-400/500 | Avocado-600/700 | Main interactive elements |
| **Secondary** | Stone-400 | Stone-600 | Warm neutral, complements green |
| **Success** | Emerald-500 | Emerald-600 | Cleaner green for positive feedback |
| **Warning** | Amber-400 | Amber-500 | Warm yellow-orange |
| **Error** | Red-500 | Red-600 | Classic error red |
| **Info** | Avocado-300 | Avocado-400 | Use brand color for info states |

### Neutral Palette: Stone (Warm Gray)

Instead of pure grays, we use "stone" - grays with warm undertones that harmonize with the green:

```
Stone Scale:
50:  #FAFAF9
100: #F5F5F4
200: #E7E5E4
300: #D6D3D1
400: #A8A29E
500: #78716C
600: #57534E
700: #44403C
800: #292524
900: #1C1917
950: #0C0A09
```

---

## Information Hierarchy

### The Problem We're Solving

Currently, most text in the app has similar visual weight:
- List item names: 14px medium
- Descriptions: 12px normal
- Meta text: 11px muted

This creates a flat, undifferentiated experience. Users can't instantly scan and find what matters.

### Hierarchy Levels

We define **6 distinct levels** of visual hierarchy:

| Level | Name | Purpose | Examples |
|-------|------|---------|----------|
| **H1** | Display | Hero/empty states | "No prompts yet" |
| **H2** | Title | Section headers | "Recent", folder names |
| **H3** | Label | Primary item text | Prompt names in list |
| **H4** | Body | Secondary content | Descriptions, body text |
| **H5** | Caption | Supporting info | Folder badges, use counts |
| **H6** | Micro | Hints/shortcuts | Keyboard hints |

### Visual Differentiation Strategies

Each level differs on **3+ axes** (not just size):

```
Level    Size    Weight     Tracking   Color           Line Height
─────────────────────────────────────────────────────────────────
H1       24px    semibold   -0.02em    text-primary    1.2
H2       18px    semibold   -0.01em    text-primary    1.3
H3       14px    medium     0          text-primary    1.4
H4       13px    normal     0          text-secondary  1.5
H5       11px    normal     0.02em     text-muted      1.4
H6       10px    medium     0.04em     text-muted      1.3
```

### Intentional Choices

**Why negative letter-spacing for large text?**
- Large text looks "loose" at default tracking
- Tighter tracking creates more cohesive, premium feel
- Matches Apple's SF Pro behavior

**Why positive letter-spacing for small text?**
- Small text needs breathing room to remain legible
- Uppercase small text (like hints) especially benefits

**Why different line heights?**
- Display text: tight (1.2) - visual impact, usually single line
- Body text: relaxed (1.5) - readability for multi-line
- Captions: moderate (1.4) - balanced for short bits

### Application to Components

**Launcher Window:**
```
┌─────────────────────────────────┐
│ [🔍] Search prompts...          │ ← H3 (input placeholder)
├─────────────────────────────────┤
│ 📝 My Cool Prompt               │ ← H3 (primary label)
│    A description of the prompt  │ ← H4 (secondary)
│    [Folder] ×5                  │ ← H5 (meta)
├─────────────────────────────────┤
│ ⌘↵ paste  ⇥ edit  esc close    │ ← H6 (hints)
└─────────────────────────────────┘
```

**Editor Sidebar:**
```
┌──────────────────┐
│ 🔍 Search...     │ ← H4 (search input)
├──────────────────┤
│ RECENT           │ ← H5 caps + tracking (section)
│ · Prompt Name    │ ← H3 (list item)
│                  │
│ 📁 Work          │ ← H2 (folder header)
│ · Another Prompt │ ← H3 (list item)
└──────────────────┘
```

---

## Typography

### Considerations for Spotlight-Style Launcher

1. **Scanability**: Users glance quickly, need instant recognition
2. **Hierarchy**: Clear distinction between title, body, meta text
3. **Personality**: Should feel modern but not trendy
4. **Cross-platform**: Works on macOS, Windows, Linux

### Font Recommendations

**Option A: System Fonts (Current)**
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```
- Pros: Native feel, zero loading, perfect OS integration
- Cons: No distinct identity

**Option B: Inter**
```css
font-family: 'Inter', -apple-system, sans-serif;
```
- Pros: Highly legible, modern, great variable font support
- Cons: Very common (might feel generic)

**Option C: Geist Sans**
```css
font-family: 'Geist Sans', -apple-system, sans-serif;
```
- Pros: Modern, technical feel, excellent readability, unique but not quirky
- Cons: Requires font loading

**Current Choice**: Inter - loaded from Google Fonts, provides modern readable feel with good variable weight support.

### Typography Scale

Using a **custom scale** optimized for UI (not content):

```
--font-size-2xs: 10px  - Micro text (keyboard hints)
--font-size-xs:  11px  - Captions, badges
--font-size-sm:  12px  - Secondary labels
--font-size-md:  13px  - Body text (slightly smaller than typical)
--font-size-lg:  14px  - Primary labels (list items)
--font-size-xl:  18px  - Section headers
--font-size-2xl: 24px  - Display/hero text
```

**Why 13px for body?** In a dense UI, 14px everywhere feels heavy. 13px body with 14px labels creates subtle but important hierarchy.

### Font Weight Strategy

```
--font-weight-normal:   400  - Body text, descriptions
--font-weight-medium:   500  - Primary labels, emphasis
--font-weight-semibold: 600  - Headers, key actions
```

**No bold (700)?** In UI, semibold (600) provides sufficient emphasis without looking "loud". Bold is better reserved for marketing/content.

### Letter Spacing (Tracking)

```
--tracking-tighter: -0.02em  - Display text (24px+)
--tracking-tight:   -0.01em  - Headers (18px)
--tracking-normal:  0        - Body/labels
--tracking-wide:    0.02em   - Small text
--tracking-wider:   0.04em   - Micro/all-caps
```

---

## Spacing & Rhythm

### Base Unit: 4px

All spacing derives from a **4px base** for visual rhythm:

```
--space-1:  4px   - Minimal gaps
--space-2:  8px   - Component internal padding
--space-3:  12px  - Between related elements
--space-4:  16px  - Standard component padding
--space-5:  20px  - Section gaps
--space-6:  24px  - Major separations
--space-8:  32px  - Layout gaps
--space-10: 40px  - Large spacing
```

### Component Spacing Patterns

**List Items:**
```css
padding: var(--space-2) var(--space-4);  /* 8px 16px */
gap: var(--space-2);                      /* 8px between icon and text */
```

**Cards/Sections:**
```css
padding: var(--space-4);                  /* 16px all sides */
gap: var(--space-3);                      /* 12px between items */
```

**Input Fields:**
```css
padding: var(--space-3) var(--space-4);  /* 12px 16px */
```

### Vertical Rhythm

Text elements maintain rhythm through consistent margins:

```css
/* After headers */
h2 { margin-bottom: var(--space-3); }    /* 12px */

/* Between paragraphs */
p + p { margin-top: var(--space-3); }    /* 12px */

/* Between list items */
.list-item + .list-item { margin-top: var(--space-1); }  /* 4px */
```

---

## Implementation Plan

### File Structure

```
src/theme/
├── DESIGN.md          # This document
├── colors.ts          # Raw color palette definitions
├── tokens.ts          # Semantic tokens (existing, to be updated)
└── index.ts           # Re-exports

src/styles/
├── variables.css      # CSS custom properties (theme implementation)
└── global.css         # Global styles
```

### Theme Architecture

1. **colors.ts**: Raw palette - the "paint cans"
2. **variables.css**: Applies colors to semantic roles per theme (dark/light)
3. **tokens.ts**: TypeScript references to CSS variables for type safety

This separation allows:
- Easy theme swapping (just change variable mappings)
- Single source of truth for color values
- TypeScript autocomplete for theme usage
