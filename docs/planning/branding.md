# Niche Healthcare Limited - Branding Guide

## Brand Identity

**Company Name:** Niche Healthcare Limited (NHL)
**Tagline:** "You are in Safe Hands"
**App Name:** NHL Connect

---

## Logo

- Heart shape composed of a cupped hand (navy blue) supporting a heartbeat/pulse line
- The heart outline is peach/salmon
- Clean, professional, healthcare-focused

**Logo Usage:**
- Splash screen: Full logo with text and tagline
- App icon: Heart + hand mark only (no text)
- In-app header: Small heart + hand mark only
- Favicon/tab: Heart mark only

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Navy Blue | `#3B4B8A` | Primary actions, headers, active states, icons |
| Peach | `#F0A882` | Accent highlights, tags, subtle backgrounds |
| White | `#FFFFFF` | Primary background |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Black | `#1A1A2E` | Primary text, headings |
| Dark Grey | `#4A4A5A` | Secondary text, body copy |
| Medium Grey | `#8E8E9A` | Placeholder text, disabled states |
| Light Grey | `#E8E8ED` | Borders, dividers, input outlines |
| Off White | `#F7F7FA` | Section backgrounds, cards |
| Surface | `#FAFAFE` | Screen background alternate |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| Success | `#2E7D5B` | Success states, online indicators |
| Warning | `#D4892E` | Warning alerts, pending states |
| Error | `#C94444` | Error states, urgent alerts, destructive actions |
| Info | `#3B4B8A` | Informational, same as primary |

### Extended Accent Palette

| Name | Hex | Usage |
|------|-----|-------|
| Peach Light | `#FDF0E9` | Peach tinted backgrounds, subtle highlights |
| Navy Light | `#E8EAF2` | Blue tinted backgrounds, channel badges |
| Navy Dark | `#2C3A6E` | Pressed states, darker emphasis |

---

## Typography

### Font Family
- **Primary:** `Inter` (Google Font - clean, modern, highly readable)
- **Fallback:** System default sans-serif

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display | 28px | 700 (Bold) | 34px | Screen titles (Welcome back) |
| H1 | 24px | 700 (Bold) | 30px | Section headings |
| H2 | 20px | 600 (SemiBold) | 26px | Card titles, channel names |
| H3 | 17px | 600 (SemiBold) | 22px | Subsection titles |
| Body | 15px | 400 (Regular) | 22px | General body text |
| Body Bold | 15px | 600 (SemiBold) | 22px | Emphasized body text |
| Caption | 13px | 400 (Regular) | 18px | Timestamps, metadata, labels |
| Small | 11px | 500 (Medium) | 16px | Badges, tags, micro text |

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Micro spacing, icon gaps |
| sm | 8px | Tight spacing, inline elements |
| md | 12px | Standard inner padding |
| base | 16px | Default padding, gaps |
| lg | 20px | Section padding |
| xl | 24px | Card padding, major gaps |
| 2xl | 32px | Section separations |
| 3xl | 48px | Screen-level vertical spacing |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| sm | 6px | Small tags, badges |
| md | 10px | Input fields, small cards |
| lg | 14px | Cards, modals |
| xl | 20px | Bottom sheets, large cards |
| full | 9999px | Avatars, pills, circular buttons |

---

## Shadows

| Name | Value | Usage |
|------|-------|-------|
| Subtle | `0 1px 3px rgba(26, 26, 46, 0.06)` | Cards, list items |
| Medium | `0 4px 12px rgba(26, 26, 46, 0.08)` | Elevated cards, floating elements |
| Strong | `0 8px 24px rgba(26, 26, 46, 0.12)` | Modals, bottom sheets |

---

## Iconography

- **Library:** `@expo/vector-icons` using `Feather` icon set (clean, consistent line icons)
- **Stroke width:** 1.5px (default Feather)
- **Sizes:**
  - Tab bar: 24px
  - In-line: 20px
  - Small: 16px
  - Large (empty state): 48px
- **Color:** Inherits from context (Navy Blue for active, Medium Grey for inactive)
- **Rule:** Strictly no emojis anywhere in the app

---

## Avatar System

- **Shape:** Circle (border-radius: full)
- **Sizes:**
  - Small (32px): Chat list, mentions
  - Medium (40px): Message headers, team members
  - Large (56px): Profile view, contact details
  - XL (80px): Own profile screen
- **Fallback:** Initials on Navy Light background with Navy Blue text
- **Online indicator:** 10px green dot, bottom-right corner

---

## Button Styles

### Primary Button
- Background: `Navy Blue (#3B4B8A)`
- Text: `White (#FFFFFF)`
- Border Radius: `full (pill shape)`
- Height: 52px
- Font: Body Bold (15px, 600)

### Secondary Button
- Background: `Transparent`
- Border: `1.5px solid Light Grey (#E8E8ED)`
- Text: `Black (#1A1A2E)`
- Border Radius: `full`
- Height: 52px

### Tertiary / Text Button
- Background: `Transparent`
- Text: `Navy Blue (#3B4B8A)`
- No border
- Font: Body Bold

### Destructive Button
- Background: `Transparent`
- Text: `Error (#C94444)`
- No border

---

## Input Fields

- Background: `White`
- Border: `1.5px solid Light Grey (#E8E8ED)`
- Border Radius: `md (10px)`
- Height: 52px
- Padding: 16px horizontal
- Font: Body (15px)
- Placeholder color: `Medium Grey (#8E8E9A)`
- Focus border: `Navy Blue (#3B4B8A)`
- Error border: `Error (#C94444)`

---

## Design Principles

1. **Clean over clever** - Minimal decoration, let content breathe
2. **Light mode only** - White backgrounds, no dark mode variant
3. **Generous whitespace** - Following the Hers reference style
4. **No deep colors** - Soft, muted palette; navy blue is the deepest tone
5. **Professional healthcare feel** - Trust, clarity, efficiency
6. **Consistent iconography** - Feather icons throughout, no mixing
7. **Card-based layouts** - Content organized in clear, bordered cards
8. **Bottom sheet modals** - iOS-native feeling interactions
9. **Subtle animations** - Fade, slide; nothing flashy or distracting
10. **Accessibility first** - Minimum 4.5:1 contrast ratio for text
