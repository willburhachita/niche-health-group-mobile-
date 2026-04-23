# NHL Connect - Implementation Tasks

## Overview

Ordered task list for building the NHL Connect mobile app UI with mocked data. All tasks are UI-only (no backend integration). Each task references screens from `screens.md` and components from `styles.md`.

---

## PHASE 0: Project Setup

### T-001: Install Core Dependencies
**Priority:** Critical | **Estimate:** 1 hour

Install all required packages for navigation, icons, and UI:

```
Dependencies:
- @react-navigation/native
- @react-navigation/native-stack
- @react-navigation/bottom-tabs
- react-native-screens
- react-native-safe-area-context
- @expo/vector-icons (already included with Expo)
- react-native-reanimated
- react-native-gesture-handler
- expo-font (for Inter font)
- expo-splash-screen
- expo-status-bar
- expo-image-picker (for avatar)
- expo-secure-store (placeholder for future auth)
```

**Acceptance:**
- All packages installed without errors
- App runs with `npx expo start`

---

### T-002: Set Up Project Structure
**Priority:** Critical | **Estimate:** 30 min

Create folder structure:

```
src/
├── assets/
│   ├── fonts/
│   └── images/
│       └── logo.png (copy from docs)
├── components/
│   ├── common/
│   │   ├── Avatar.js
│   │   ├── Badge.js
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Divider.js
│   │   ├── EmptyState.js
│   │   ├── Header.js
│   │   ├── IconButton.js
│   │   ├── Input.js
│   │   ├── ListItem.js
│   │   ├── SearchBar.js
│   │   ├── SectionHeader.js
│   │   ├── StatusBadge.js
│   │   ├── Tag.js
│   │   └── Toast.js
│   ├── chat/
│   │   ├── ChatBubble.js
│   │   ├── ChatInput.js
│   │   ├── ConversationItem.js
│   │   ├── DateSeparator.js
│   │   └── TypingIndicator.js
│   ├── channels/
│   │   ├── ChannelItem.js
│   │   └── ChannelPill.js
│   ├── schedule/
│   │   ├── CalendarGrid.js
│   │   ├── EventCard.js
│   │   └── TimelineBlock.js
│   └── notifications/
│       └── NotificationItem.js
├── constants/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   └── shadows.js
├── data/
│   ├── mockUsers.js
│   ├── mockConversations.js
│   ├── mockMessages.js
│   ├── mockChannels.js
│   ├── mockChannelMessages.js
│   ├── mockNotifications.js
│   ├── mockSchedule.js
│   ├── mockFiles.js
│   └── mockAnnouncements.js
├── navigation/
│   ├── AuthNavigator.js
│   ├── MainNavigator.js
│   ├── TabNavigator.js
│   └── RootNavigator.js
├── screens/
│   ├── auth/
│   │   ├── SplashScreen.js         (S-01)
│   │   ├── WelcomeScreen.js        (S-02)
│   │   ├── LoginScreen.js          (S-03)
│   │   ├── OTPScreen.js            (S-04)
│   │   └── DevicePendingScreen.js  (S-05)
│   ├── home/
│   │   ├── HomeScreen.js           (S-10)
│   │   └── AnnouncementDetail.js   (S-12)
│   ├── messages/
│   │   ├── ConversationsScreen.js  (S-20)
│   │   ├── ChatScreen.js           (S-21/S-22)
│   │   ├── NewMessageScreen.js     (S-23)
│   │   ├── NewGroupScreen.js       (S-24)
│   │   ├── ChatInfoScreen.js       (S-25)
│   │   ├── GroupMembersScreen.js   (S-26)
│   │   ├── AddMembersScreen.js     (S-27)
│   │   ├── MediaFilesScreen.js     (S-28)
│   │   └── MessageSearchScreen.js  (S-29)
│   ├── channels/
│   │   ├── ChannelsScreen.js       (S-30)
│   │   ├── ChannelThreadScreen.js  (S-31)
│   │   ├── ChannelInfoScreen.js    (S-32)
│   │   ├── ChannelMembersScreen.js (S-33)
│   │   ├── CreateChannelScreen.js  (S-34)
│   │   ├── DiscoverChannelsScreen.js (S-35)
│   │   └── PinnedMessagesScreen.js (S-36)
│   ├── schedule/
│   │   ├── ScheduleScreen.js       (S-40)
│   │   ├── DayViewScreen.js        (S-41)
│   │   ├── EventDetailScreen.js    (S-42)
│   │   ├── CreateEventScreen.js    (S-43)
│   │   └── TrainingListScreen.js   (S-44)
│   └── more/
│       ├── MoreScreen.js           (S-50)
│       ├── ProfileScreen.js        (S-51)
│       ├── EditProfileScreen.js    (S-52)
│       ├── NotificationsScreen.js  (S-53)
│       ├── NotificationSettingsScreen.js (S-54)
│       ├── FilesScreen.js          (S-55)
│       ├── DocumentViewerScreen.js (S-56)
│       ├── StaffDirectoryScreen.js (S-57)
│       ├── DepartmentsScreen.js    (S-58)
│       ├── StaffProfileScreen.js   (S-59)
│       ├── SettingsScreen.js       (S-60)
│       ├── AccountSettingsScreen.js (S-61)
│       ├── PrivacySecurityScreen.js (S-62)
│       ├── TrustedDevicesScreen.js (S-63)
│       ├── AboutScreen.js          (S-64)
│       └── AdminPanelScreen.js     (S-65)
├── hooks/
│   └── useAuth.js (mock auth state)
└── utils/
    ├── dateHelpers.js
    └── formatters.js
```

**Acceptance:**
- All directories created
- Placeholder files for each screen (with basic component export)

---

### T-003: Create Design Token Constants
**Priority:** Critical | **Estimate:** 1 hour

Create `colors.js`, `typography.js`, `spacing.js`, `shadows.js` files matching `branding.md` exactly.

**Acceptance:**
- All tokens from branding.md are exported as JS constants
- Inter font loaded via expo-font
- Typography scale matches spec

---

### T-004: Create Mock Data Files
**Priority:** Critical | **Estimate:** 2 hours

Create all mock data files in `src/data/` with the exact data specified in `screens.md`.

Files needed:
- `mockUsers.js` - All staff members with roles, departments, avatars
- `mockConversations.js` - DM and group conversations list
- `mockMessages.js` - Messages per conversation (keyed by conversationId)
- `mockChannels.js` - All channels with members, descriptions
- `mockChannelMessages.js` - Messages per channel
- `mockNotifications.js` - Notification feed items
- `mockSchedule.js` - Events, shifts, training sessions
- `mockFiles.js` - Documents, folders, SOP files
- `mockAnnouncements.js` - Admin announcements

**Acceptance:**
- All mock data exported and importable
- Data matches the content specified in screens.md
- Current user: Dr. Sarah Mbewe (userId: 'user-001')

---

## PHASE 1: Core Components (Build order: bottom-up)

### T-005: Common Components - Foundation
**Priority:** Critical | **Estimate:** 3 hours

Build these reusable components per `styles.md`:
- `Button.js` (Primary, Secondary, Tertiary, Destructive variants)
- `Input.js` (Text, Phone, Email, Search, Multiline)
- `Card.js` (Standard, Highlighted, Interactive)
- `Divider.js` (Full, Inset, Avatar Inset, Section)
- `SectionHeader.js` (uppercase label with optional action)
- `Badge.js` (Unread count, Role, Department, Status)
- `Tag.js` (Department tag, status tag)

**Acceptance:**
- Components render correctly with all variants
- Styles match styles.md specifications

---

### T-006: Common Components - Interactive
**Priority:** Critical | **Estimate:** 3 hours

- `Avatar.js` (Small/Medium/Large/XL, with initials fallback, online dot)
- `Header.js` (Title, left/right actions, border)
- `IconButton.js` (Icon only button with hit area)
- `SearchBar.js` (with search icon, clear button, placeholder)
- `ListItem.js` (Generic configurable list row)
- `EmptyState.js` (Icon + title + description + optional button)
- `Toast.js` (Auto-dismiss notification bar)
- `StatusBadge.js` (Online/Away/DND/Offline dot)

---

### T-007: Chat Components
**Priority:** High | **Estimate:** 3 hours

- `ChatBubble.js` (Sent/Received/System variants per styles.md)
- `ChatInput.js` (Message input bar with attachment + send)
- `ConversationItem.js` (Chat list row with avatar, preview, time, unread)
- `DateSeparator.js` ("Today", "Yesterday", or date string)
- `TypingIndicator.js` (3 animated dots in bubble)

---

### T-008: Channel & Schedule Components
**Priority:** High | **Estimate:** 2 hours

- `ChannelItem.js` (# or lock icon + name + members + unread)
- `ChannelPill.js` (Horizontal scrolling channel quick-access pill)
- `CalendarGrid.js` (Month view calendar with event dots)
- `EventCard.js` (Event summary card with color-coded left border)
- `TimelineBlock.js` (Hourly timeline event block)
- `NotificationItem.js` (Icon circle + title + description + time + unread dot)

---

## PHASE 2: Navigation Setup

### T-009: Root & Auth Navigation
**Priority:** Critical | **Estimate:** 2 hours

- Set up `RootNavigator.js` with auth state check (mock: `useAuth` hook)
- `AuthNavigator.js`: Stack with S-01 → S-02 → S-03 → S-04 → S-05
- Transitions: fade for splash, slide for rest

**Acceptance:**
- Auth flow navigates correctly through all auth screens
- Mock login sets auth state → navigates to main app

---

### T-010: Tab & Main Navigation
**Priority:** Critical | **Estimate:** 2 hours

- `TabNavigator.js`: 5 tabs (Home, Messages, Channels, Schedule, More)
  - Icons from Feather set
  - Active/inactive colors per branding
  - Badge on Messages tab (unread count)
- `MainNavigator.js`: Tab navigator + all stack screens per tab
- Register all screen routes

**Acceptance:**
- All 5 tabs render and switch correctly
- Tab bar styled per styles.md
- Unread badge shows on Messages tab
- All screens reachable via navigation

---

## PHASE 3: Auth Screens

### T-011: Splash Screen (S-01)
**Priority:** Critical | **Estimate:** 1 hour

- NHL logo centered, fade-in animation
- Auto-navigate after 2 seconds (to S-02 or S-10)

---

### T-012: Welcome Screen (S-02)
**Priority:** Critical | **Estimate:** 1.5 hours

- Logo, heading, subheading, feature cards, CTA buttons
- Match Hers iOS welcome screen layout style

---

### T-013: Login Screen (S-03)
**Priority:** Critical | **Estimate:** 2 hours

- Phone/Email tab selector
- Country code picker for phone
- Input validation
- "Send Verification Code" button (disabled until valid)

---

### T-014: OTP Verification Screen (S-04)
**Priority:** Critical | **Estimate:** 2 hours

- 6-digit input boxes with auto-advance
- Countdown timer + resend
- Mock verification (accept "123456")
- Shake animation on error

---

### T-015: Device Pending Screen (S-05)
**Priority:** Medium | **Estimate:** 1 hour

- Security shield icon, messaging, device info card
- Check status / contact admin / logout buttons

---

## PHASE 4: Home Tab

### T-016: Home Dashboard (S-10)
**Priority:** Critical | **Estimate:** 4 hours

- Welcome header with avatar
- Urgent alerts card (Peach highlighted)
- Quick stats row (horizontal scroll)
- Recent conversations (top 3)
- Channel pills (horizontal scroll)
- Today's schedule cards
- Announcements section
- Pull-to-refresh

---

### T-017: Announcement Detail (S-12)
**Priority:** Medium | **Estimate:** 1 hour

- Full announcement view with attachments
- Acknowledgement status

---

## PHASE 5: Messages Tab

### T-018: Conversations List (S-20)
**Priority:** Critical | **Estimate:** 2 hours

- Conversation list with filter pills
- FAB for new message
- Pull-to-refresh
- Empty state

---

### T-019: Chat Thread - 1:1 (S-21)
**Priority:** Critical | **Estimate:** 4 hours

- Message list with sent/received bubbles
- Date separators
- Read receipts
- Message input bar with send button
- Auto-scroll to bottom
- Header with contact info

---

### T-020: Chat Thread - Group (S-22)
**Priority:** High | **Estimate:** 2 hours

- Extends S-21 with sender names + avatars on received messages
- Group header with member count

---

### T-021: New Message / Contact Picker (S-23)
**Priority:** High | **Estimate:** 2 hours

- Search + contact list
- Suggested section
- Multi-select for group creation

---

### T-022: New Group Setup (S-24)
**Priority:** Medium | **Estimate:** 1.5 hours

- Group name input + avatar placeholder
- Selected member chips
- Add more members

---

### T-023: Chat Info Screen (S-25)
**Priority:** Medium | **Estimate:** 2 hours

- 1:1 and Group variants
- Profile display + action buttons
- Settings list (shared media, notifications, etc.)

---

### T-024: Group Members & Add Members (S-26, S-27)
**Priority:** Medium | **Estimate:** 1.5 hours

- Member list with roles
- Add members with search + selection

---

### T-025: Media & Files in Chat (S-28)
**Priority:** Low | **Estimate:** 1.5 hours

- Tab view: Media grid / Files list / Links list

---

### T-026: Message Search (S-29)
**Priority:** Low | **Estimate:** 1 hour

- Search input + results with highlighted matches

---

## PHASE 6: Channels Tab

### T-027: Channels List (S-30)
**Priority:** Critical | **Estimate:** 2 hours

- Starred + Your Channels sections
- Unread counts
- FAB for create + discover

---

### T-028: Channel Thread (S-31)
**Priority:** Critical | **Estimate:** 2 hours

- Same message rendering as chat but with sender names always visible
- Channel topic bar
- Pinned messages banner

---

### T-029: Channel Info & Settings (S-32, S-33)
**Priority:** Medium | **Estimate:** 1.5 hours

- Channel details, members list, settings toggles

---

### T-030: Create & Discover Channels (S-34, S-35)
**Priority:** Medium | **Estimate:** 2 hours

- Create form with name, description, privacy toggle, member picker
- Discover list with join buttons

---

### T-031: Pinned Messages (S-36)
**Priority:** Low | **Estimate:** 45 min

- List of pinned message cards

---

## PHASE 7: Schedule Tab

### T-032: Schedule Calendar (S-40)
**Priority:** High | **Estimate:** 3 hours

- Calendar grid with event dots
- Month navigation
- Selected day event list below

---

### T-033: Day View (S-41)
**Priority:** Medium | **Estimate:** 2 hours

- Hourly timeline blocks
- Color-coded events

---

### T-034: Event Detail (S-42)
**Priority:** Medium | **Estimate:** 1.5 hours

- Full event info with attendees
- Acknowledge button

---

### T-035: Create Event (S-43)
**Priority:** Medium | **Estimate:** 2 hours

- Event form with type selector, date/time pickers, staff assignment

---

### T-036: Training Sessions List (S-44)
**Priority:** Low | **Estimate:** 1 hour

- Upcoming/past filter
- Registration status

---

## PHASE 8: More Tab

### T-037: More Menu (S-50)
**Priority:** High | **Estimate:** 1.5 hours

- User card + organized menu sections
- Navigation to all sub-screens

---

### T-038: Profile Screens (S-51, S-52)
**Priority:** High | **Estimate:** 2 hours

- View profile + edit profile form
- Avatar display and edit

---

### T-039: Notifications (S-53, S-54)
**Priority:** High | **Estimate:** 2 hours

- Notification list with filters
- Notification settings with toggles

---

### T-040: Files & Documents (S-55, S-56)
**Priority:** Medium | **Estimate:** 2 hours

- File browser with folders
- Document viewer placeholder

---

### T-041: Staff & Department Directories (S-57, S-58, S-59)
**Priority:** Medium | **Estimate:** 2.5 hours

- Staff list (filterable, searchable, grouped by letter)
- Department cards
- Staff profile view

---

### T-042: Settings Screens (S-60, S-61, S-62, S-63, S-64)
**Priority:** Medium | **Estimate:** 3 hours

- Settings menu
- Account settings
- Privacy & security
- Trusted devices list
- About screen

---

### T-043: Admin Panel (S-65)
**Priority:** Low | **Estimate:** 1.5 hours

- Admin menu placeholder
- Only visible for admin role users

---

## PHASE 9: Modals & Overlays

### T-044: Global Search (S-70)
**Priority:** Medium | **Estimate:** 2 hours

- Full-screen search with tab filters
- Results grouped by type (People, Channels, Messages, Files)

---

### T-045: File Preview Modals (S-71, S-72)
**Priority:** Low | **Estimate:** 1.5 hours

- Image viewer (dark bg, zoomable)
- Document viewer

---

### T-046: Status Picker (S-73)
**Priority:** Low | **Estimate:** 1 hour

- Bottom sheet with status options
- Custom status input

---

## PHASE 10: Polish & Refinement

### T-047: Animations & Micro-interactions
**Priority:** Medium | **Estimate:** 3 hours

- Screen transitions (slide, fade)
- Button press animations (scale)
- Pull-to-refresh
- Skeleton loaders on relevant screens
- Typing indicator animation
- FAB press animation
- Toast slide-in animation
- OTP input shake animation

---

### T-048: Final UI Audit
**Priority:** High | **Estimate:** 2 hours

- Verify all screens match branding.md tokens
- Check spacing consistency
- Verify all navigation paths (no dead ends)
- Test with different screen sizes
- SafeArea handling on all screens
- Keyboard handling on all input screens

---

## Summary

| Phase | Tasks | Est. Hours |
|-------|-------|------------|
| Phase 0: Setup | T-001 to T-004 | 4.5h |
| Phase 1: Components | T-005 to T-008 | 11h |
| Phase 2: Navigation | T-009 to T-010 | 4h |
| Phase 3: Auth | T-011 to T-015 | 7.5h |
| Phase 4: Home | T-016 to T-017 | 5h |
| Phase 5: Messages | T-018 to T-026 | 16.5h |
| Phase 6: Channels | T-027 to T-031 | 8.25h |
| Phase 7: Schedule | T-032 to T-036 | 9.5h |
| Phase 8: More | T-037 to T-043 | 14.5h |
| Phase 9: Modals | T-044 to T-046 | 4.5h |
| Phase 10: Polish | T-047 to T-048 | 5h |
| **Total** | **48 tasks** | **~90h** |

---

## Task Dependencies

```
T-001 → T-002 → T-003 → T-004
                 T-003 → T-005 → T-006 → T-007 → T-008
                          T-004 → T-009 → T-010
T-010 → All screen tasks (T-011+)
T-005..T-008 → All screen tasks
```

**Critical Path:** T-001 → T-002 → T-003 → T-005 → T-009 → T-010 → T-011 → T-016 → T-018 → T-019
