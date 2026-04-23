# NHL Connect - Agent Guide

## Overview

This document provides the implementation context and rules that any AI coding agent (or developer) should follow when building the NHL Connect mobile app. Reference this file before making any implementation decisions.

---

## Project Context

**App Name:** NHL Connect
**Company:** Niche Healthcare Limited
**Purpose:** Internal communication and management system replacing Microsoft Teams / Slack
**Platform:** iOS & Android via Expo (React Native)
**Phase:** UI-only with mocked data (no backend integration yet)

---

## Reference Documents

Always consult these documents before implementation:

| Document | Path | Purpose |
|----------|------|---------|
| Branding | `docs/planning/branding.md` | Colors, typography, spacing, design tokens |
| Styles | `docs/planning/styles.md` | Component-level styling specifications |
| Screens | `docs/planning/screens.md` | Complete screen map with layouts and mock data |
| Tasks | `docs/planning/tasks.md` | Ordered task list with dependencies |

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Expo SDK | Latest (52+) | App framework |
| React Navigation | 7.x | Navigation (stack, tabs, modals) |
| @expo/vector-icons | Latest | Icons (use ONLY Feather icon set) |
| expo-font | Latest | Load Inter font |
| React Native Reanimated | Latest | Animations |
| React Native Gesture Handler | Latest | Touch interactions |

**NOT using:**
- TailwindCSS / NativeWind
- Styled Components
- Any external UI library (no NativeBase, Paper, etc.)
- Any state management library (keep it simple with useState/useContext for mock UI)

---

## Strict Rules

### Design Rules

1. **Light mode ONLY.** No dark mode, no theme switching.
2. **No emojis.** Anywhere. Ever. Use Feather icons instead.
3. **No deep/saturated colors.** Keep everything clean and muted per branding.md.
4. **Feather icons ONLY.** Do not use MaterialIcons, Ionicons, FontAwesome, or any other icon set.
5. **Inter font ONLY.** Do not fall back to system fonts without loading Inter first.
6. **Follow spacing tokens.** Do not use arbitrary pixel values. Use the scale from branding.md.
7. **Cards have borders, not heavy shadows.** Light shadow is acceptable, but primary visual separation is through borders.
8. **White backgrounds predominate.** Off-white (#F7F7FA) for sections, pure white (#FFFFFF) for cards and main bg.
9. **No placeholder images.** If an avatar is needed, use initials. If a logo is needed, use the actual logo file.
10. **No dead UI.** Every button, every list item, every icon must navigate or perform an action.

### Code Rules

1. **JavaScript only** (not TypeScript for this phase).
2. **Functional components** with hooks. No class components.
3. **StyleSheet.create()** for all styles. No inline style objects.
4. **One component per file.** Named exports for components, default export for screens.
5. **All colors must reference constants/colors.js.** Never hardcode hex values in component files.
6. **All font sizes must reference constants/typography.js.** Never hardcode sizes.
7. **All spacing must reference constants/spacing.js.** Never hardcode padding/margin values.
8. **Mock data stays in src/data/ directory.** Screens import from data files, never define mock data inline.
9. **Screen files go in src/screens/{category}/.** Follow the folder structure in tasks.md.
10. **Component files go in src/components/{category}/.** Shared components in `common/`.

### Navigation Rules

1. **Every screen must have a back button** (except root screens of each tab).
2. **Header styling must be consistent** across all screens (per styles.md Header spec).
3. **Tab bar must always be visible** on main screens (hide on modals and detail screens as appropriate).
4. **Use `navigation.goBack()`** for back actions, never hardcode specific routes for back.
5. **Screen names must match the S-XX naming** from screens.md for clarity.

### Mock Data Rules

1. **Current user is always Dr. Sarah Mbewe** (userId: 'user-001').
2. **Staff names use realistic Zambian/Commonwealth names** as specified in screens.md.
3. **Timestamps should be relative** ("2m ago", "Yesterday") using a helper function.
4. **Unread counts and badges must be visually accurate** based on mock data.
5. **All mock data must be complete** - no "lorem ipsum" or placeholder text.

---

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screen | PascalCase + Screen suffix | `HomeScreen.js` |
| Component | PascalCase | `ChatBubble.js` |
| Constants | camelCase | `colors.js` |
| Mock Data | camelCase with mock prefix | `mockUsers.js` |
| Utilities | camelCase | `dateHelpers.js` |
| Navigation | PascalCase + Navigator suffix | `TabNavigator.js` |

---

## Component API Conventions

### All components should accept:
- `style` prop for container overrides
- Relevant content props (text, icon name, etc.)
- `onPress` for interactive components

### Example component pattern:

```javascript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export const Badge = ({ count, variant = 'unread', style }) => {
  return (
    <View style={[styles.container, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  unread: {
    backgroundColor: colors.error,
  },
  unreadText: {
    color: colors.white,
    fontSize: typography.small.fontSize,
    fontWeight: typography.small.fontWeight,
  },
  role: {
    backgroundColor: colors.navyLight,
  },
  roleText: {
    color: colors.navyBlue,
    fontSize: typography.small.fontSize,
    fontWeight: typography.small.fontWeight,
  },
});
```

---

## Navigation Structure Reference

```javascript
// RootNavigator
const isAuthenticated = false; // mock toggle

if (!isAuthenticated) {
  // AuthStack: Splash → Welcome → Login → OTP → DevicePending
} else {
  // MainStack
  //   └── TabNavigator
  //       ├── HomeStack
  //       ├── MessagesStack
  //       ├── ChannelsStack
  //       ├── ScheduleStack
  //       └── MoreStack
}
```

---

## Screen Implementation Checklist

For each screen, verify:

- [ ] Correct header (title, left/right actions)
- [ ] SafeAreaView wrapping
- [ ] Colors from constants/colors.js
- [ ] Typography from constants/typography.js
- [ ] Spacing from constants/spacing.js
- [ ] Mock data imported from src/data/
- [ ] All interactive elements have onPress handlers
- [ ] Navigation to correct target screens
- [ ] Empty states handled (where applicable)
- [ ] Pull-to-refresh (on list screens)
- [ ] Keyboard handling (on input screens)
- [ ] Loading states (skeleton or spinner)
- [ ] Status bar style set correctly

---

## Common Gotchas

1. **SafeAreaView:** Always use `react-native-safe-area-context`, not React Native's built-in SafeAreaView.
2. **Keyboard avoiding:** Use `KeyboardAvoidingView` with `behavior="padding"` on iOS, `undefined` on Android.
3. **FlatList vs ScrollView:** Use `FlatList` for lists of data (conversations, channels, notifications). Use `ScrollView` for mixed content (home dashboard, profile).
4. **Image handling:** For avatars without images, use the Avatar component's initials fallback. Never show broken image icons.
5. **Android bottom tab:** May need explicit height adjustment. Test on both platforms.
6. **Font loading:** Wait for Inter font to load before rendering app (use `expo-font` + `expo-splash-screen`).

---

## Definition of Done (per screen)

A screen is "done" when:
1. It renders with all content from screens.md
2. All interactive elements navigate correctly
3. Back button works
4. Styles match branding.md / styles.md
5. No dead ends (every tap does something)
6. Looks professional and polished
7. Works on both iOS and Android simulators
