# NHL Connect - Styles & Component Library

## Overview

This document defines every reusable component and its styling rules for the NHL Connect mobile app. All components follow the tokens defined in `branding.md`. Icon library: `Feather` from `@expo/vector-icons`.

---

## 1. Status Bar

- Style: `dark-content` (dark icons on light background)
- Background: transparent (content goes under status bar)

---

## 2. Navigation Patterns

### 2.1 Bottom Tab Bar

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Border top | `1px solid #E8E8ED` |
| Height | 84px (including safe area) |
| Active icon color | `#3B4B8A` (Navy Blue) |
| Inactive icon color | `#8E8E9A` (Medium Grey) |
| Label font | Small (11px, 500) |
| Badge | 8px red dot or count pill |

**Tabs:**

| Tab | Icon (Feather) | Label |
|-----|----------------|-------|
| Home | `home` | Home |
| Messages | `message-circle` | Messages |
| Channels | `hash` | Channels |
| Schedule | `calendar` | Schedule |
| More | `menu` | More |

### 2.2 Top Header Bar

| Property | Value |
|----------|-------|
| Background | `#FFFFFF` |
| Height | 56px |
| Title font | H3 (17px, SemiBold) |
| Title alignment | Center |
| Left action | Back arrow (`chevron-left`, 24px) or none |
| Right action | Context-dependent icon(s) |
| Border bottom | `1px solid #E8E8ED` |

### 2.3 Stack Navigation Transitions

- **Push:** Slide from right (iOS default)
- **Modal:** Slide from bottom
- **Bottom Sheet:** Spring animation from bottom with drag handle

---

## 3. Card Components

### 3.1 Standard Card

```
Background:     #FFFFFF
Border:         1px solid #E8E8ED
Border Radius:  14px (lg)
Padding:        16px
Shadow:         Subtle (0 1px 3px rgba(26,26,46,0.06))
Margin Bottom:  12px
```

### 3.2 Highlighted Card (with accent)

```
Background:     #FDF0E9 (Peach Light)
Border:         1px solid #F0A882 (Peach)
Border Radius:  14px
Padding:        16px
```

### 3.3 Interactive Card (pressable)

```
Default:        Standard Card styles
Pressed:        Background #F7F7FA, scale(0.98)
Active opacity: 0.7
```

---

## 4. List Items

### 4.1 Chat / Conversation List Item

```
Layout:         Row
Height:         72px
Padding:        16px horizontal
Left:           Avatar (40px) with online dot
Center:
  - Top row:    Name (Body Bold) + timestamp (Caption, right-aligned)
  - Bottom row: Last message preview (Body, color: Dark Grey, 1 line truncated)
Right:          Unread badge (if applicable)
Divider:        1px #E8E8ED, inset from left (72px)
Press state:    Background #F7F7FA
```

### 4.2 Channel List Item

```
Layout:         Row
Height:         56px
Padding:        16px horizontal
Left:           # icon (20px, Navy Blue) or lock icon (for private)
Center:
  - Channel name (Body Bold if unread, Body if read)
  - Member count (Caption, Medium Grey)
Right:          Unread count badge OR chevron-right
Divider:        1px #E8E8ED, full width
```

### 4.3 Contact / Staff List Item

```
Layout:         Row
Height:         64px
Padding:        16px horizontal
Left:           Avatar (40px)
Center:
  - Name (Body Bold)
  - Role/Department (Caption, Medium Grey)
Right:          Action icon or chevron-right
Divider:        1px #E8E8ED, inset 72px
```

### 4.4 Notification Item

```
Layout:         Row
Padding:        16px
Left:           Icon in circle (36px, Navy Light bg)
Center:
  - Title (Body Bold)
  - Description (Caption, Dark Grey, 2 lines max)
  - Timestamp (Small, Medium Grey)
Right:          Unread dot (8px, Navy Blue) if applicable
Background:     #FAFAFE if unread, #FFFFFF if read
Divider:        1px #E8E8ED
```

---

## 5. Message Bubbles

### 5.1 Sent Message (current user)

```
Background:     #3B4B8A (Navy Blue)
Text color:     #FFFFFF
Border Radius:  18px top-left, 18px top-right, 4px bottom-right, 18px bottom-left
Max Width:      75% of screen
Padding:        12px 16px
Margin:         4px 16px 4px auto
Timestamp:      Small (11px), white with 70% opacity, bottom-right
```

### 5.2 Received Message (other user)

```
Background:     #F7F7FA (Off White)
Text color:     #1A1A2E (Black)
Border Radius:  4px top-left, 18px top-right, 18px bottom-right, 18px bottom-left
Max Width:      75% of screen
Padding:        12px 16px
Margin:         4px auto 4px 16px
Sender name:    Caption, Navy Blue (in group chats only)
Timestamp:      Small (11px), Medium Grey, bottom-right
```

### 5.3 System Message

```
Background:     transparent
Text:           Caption, center-aligned, Medium Grey
Padding:        8px 32px
(e.g., "Dr. Mbewe joined the channel", "March 24, 2026")
```

### 5.4 Message Input Bar

```
Background:     #FFFFFF
Border top:     1px solid #E8E8ED
Padding:        8px 16px (safe area bottom included)
Input field:
  - Background:   #F7F7FA
  - Border:       1px solid #E8E8ED
  - Border Radius: full (pill)
  - Height:       40px
  - Padding:      0 16px
  - Placeholder:  "Type a message..." (Medium Grey)
Left icon:      Attachment (paperclip, 20px)
Right icon:     Send (send, 20px, Navy Blue when active, Light Grey when empty)
```

---

## 6. Badges & Tags

### 6.1 Unread Count Badge

```
Background:     #C94444 (Error/Red)
Text:           White, Small (11px, 500)
Min Width:      20px
Height:         20px
Border Radius:  full
Padding:        0 6px
```

### 6.2 Role Badge

```
Background:     #E8EAF2 (Navy Light)
Text:           #3B4B8A (Navy Blue), Small (11px, 500)
Height:         22px
Border Radius:  sm (6px)
Padding:        0 8px
Examples:       "Doctor", "Nurse", "Admin"
```

### 6.3 Department Tag

```
Background:     #FDF0E9 (Peach Light)
Text:           #D4892E (darker peach), Small (11px, 500)
Height:         22px
Border Radius:  sm (6px)
Padding:        0 8px
Examples:       "Dialysis", "Pharmacy", "ICU"
```

### 6.4 Status Badge

```
Online:         10px circle, #2E7D5B (Success)
Away:           10px circle, #D4892E (Warning)
Offline:        10px circle, #E8E8ED (Light Grey)
Do Not Disturb: 10px circle, #C94444 (Error)
```

---

## 7. Bottom Sheet / Modal

```
Background:     #FFFFFF
Border Radius:  20px top-left, 20px top-right
Drag Handle:    40px wide, 4px height, #E8E8ED, centered, 8px from top
Overlay:        rgba(26, 26, 46, 0.4)
Shadow:         Strong
Padding:        24px horizontal, 16px top (below handle)
Animation:      Spring (damping: 20, stiffness: 200)
```

---

## 8. Search Bar

```
Background:     #F7F7FA
Border:         1px solid #E8E8ED
Border Radius:  md (10px)
Height:         44px
Padding:        0 12px
Left icon:      search (16px, Medium Grey)
Right icon:     x-circle (16px, Medium Grey) when text present
Placeholder:    "Search..." (Medium Grey)
Text:           Body (15px)
Margin:         16px horizontal, 8px vertical
```

---

## 9. Section Headers

```
Font:           Caption (13px, 400), uppercase, letter-spacing: 1px
Color:          #8E8E9A (Medium Grey)
Padding:        16px horizontal, 24px top, 8px bottom
Background:     #FAFAFE or transparent
```

---

## 10. Empty States

```
Layout:         Centered vertically in container
Icon:           48px, Light Grey
Title:          H2 (20px, SemiBold), Black
Description:    Body (15px), Dark Grey, center-aligned, max 280px
Action button:  Primary Button (optional)
Spacing:        16px between icon and title, 8px between title and description, 24px before button
```

---

## 11. Toast / Snackbar Notifications

```
Background:     #1A1A2E (Black)
Text:           White, Body (15px)
Border Radius:  md (10px)
Position:       Top, 60px from top, centered
Min Width:      auto (content-based)
Max Width:      calc(100% - 32px)
Padding:        12px 20px
Shadow:         Medium
Animation:      Slide down + fade in (200ms)
Auto-dismiss:   3 seconds
```

---

## 12. Dividers

| Type | Style |
|------|-------|
| Full | `1px solid #E8E8ED`, full width |
| Inset | `1px solid #E8E8ED`, 16px left margin |
| Avatar Inset | `1px solid #E8E8ED`, 72px left margin |
| Section | `8px solid #F7F7FA`, full width |

---

## 13. Loading States

### Skeleton Loader
```
Background:     #E8E8ED
Animated:       Shimmer (light sweep left to right)
Border Radius:  Same as the element it replaces
Duration:       1.5s per cycle
```

### Spinner
```
Type:           ActivityIndicator (React Native)
Color:          #3B4B8A (Navy Blue)
Size:           "large" for page loads, "small" for inline
```

---

## 14. Pull-to-Refresh

```
Indicator Color:  #3B4B8A (Navy Blue)
Background:       #FFFFFF
```

---

## 15. Floating Action Button (FAB)

```
Background:     #3B4B8A (Navy Blue)
Icon:           edit (Feather), White, 24px
Size:           56px
Border Radius:  full
Shadow:         Medium
Position:       Bottom-right, 24px from edges
Press state:    Background #2C3A6E (Navy Dark), scale(0.95)
Usage:          New message, new channel
```

---

## 16. Confirmation Dialog

```
Overlay:        rgba(26, 26, 46, 0.4)
Container:
  - Background: #FFFFFF
  - Border Radius: lg (14px)
  - Width: calc(100% - 64px)
  - Padding: 24px
  - Shadow: Strong
Title:          H2 (20px, SemiBold), center
Message:        Body (15px), Dark Grey, center
Primary action: Primary Button, full width
Secondary:      Text button below, center-aligned
Spacing:        16px between elements
```
