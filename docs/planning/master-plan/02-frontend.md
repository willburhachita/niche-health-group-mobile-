# 02 — Frontend Development Plan

> **Role:** Senior Software Engineer (Frontend)
> **References:** `agent.md`, `tasks.md`, `screens.md`

---

## 2.1 Mobile App (Expo / React Native)

### 2.1.1 Folder Structure

```
niche-healthcare-mobile-app/
├── App.js                        ← Root entry (loads fonts, sets up navigation)
├── app.json                      ← Expo config (name, slug, icons, splash)
├── src/
│   ├── assets/
│   │   ├── fonts/
│   │   │   └── Inter/            ← Inter variable font files
│   │   └── images/
│   │       ├── logo.png          ← Full NHL logo
│   │       └── logo-mark.png     ← Heart+hand mark only
│   │
│   ├── constants/
│   │   ├── colors.js             ← All color tokens from branding.md
│   │   ├── typography.js         ← All type scale tokens
│   │   ├── spacing.js            ← All spacing tokens
│   │   ├── shadows.js            ← Subtle / Medium / Strong
│   │   └── radius.js             ← Border radius tokens
│   │
│   ├── data/                     ← Mock data (Phase 1 only, removed post-backend)
│   │   ├── mockUsers.js
│   │   ├── mockConversations.js
│   │   ├── mockMessages.js
│   │   ├── mockChannels.js
│   │   ├── mockChannelMessages.js
│   │   ├── mockNotifications.js
│   │   ├── mockSchedule.js
│   │   ├── mockFiles.js
│   │   └── mockAnnouncements.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js            ← Auth state (mock → Privy/Convex)
│   │   ├── useCurrentUser.js     ← Current user data
│   │   └── useUnreadCounts.js    ← Unread message/notif counts
│   │
│   ├── utils/
│   │   ├── dateHelpers.js        ← "2m ago", "Yesterday", "HH:MM" etc.
│   │   ├── formatters.js         ← Name initials, file size, phone format
│   │   └── roleHelpers.js        ← Role checks: isAdmin(), isDoctor(), etc.
│   │
│   ├── components/
│   │   ├── common/               ← Tier 1 & 2 atoms/molecules
│   │   │   ├── AppText.js        ← Wraps Text with typography tokens
│   │   │   ├── Avatar.js
│   │   │   ├── Badge.js
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Divider.js
│   │   │   ├── EmptyState.js
│   │   │   ├── Header.js
│   │   │   ├── IconButton.js
│   │   │   ├── Input.js
│   │   │   ├── ListItem.js
│   │   │   ├── SearchBar.js
│   │   │   ├── SectionHeader.js
│   │   │   ├── Spacer.js
│   │   │   ├── StatusDot.js
│   │   │   ├── Tag.js
│   │   │   └── Toast.js
│   │   ├── chat/
│   │   │   ├── ChatBubble.js
│   │   │   ├── ChatInput.js
│   │   │   ├── ConversationItem.js
│   │   │   ├── DateSeparator.js
│   │   │   └── TypingIndicator.js
│   │   ├── channels/
│   │   │   ├── ChannelItem.js
│   │   │   └── ChannelPill.js
│   │   ├── schedule/
│   │   │   ├── CalendarGrid.js
│   │   │   ├── EventCard.js
│   │   │   └── TimelineBlock.js
│   │   └── notifications/
│   │       └── NotificationItem.js
│   │
│   ├── navigation/
│   │   ├── RootNavigator.js      ← Auth check → AuthNavigator or MainNavigator
│   │   ├── AuthNavigator.js      ← S-01 to S-05
│   │   ├── TabNavigator.js       ← 5-tab bottom bar
│   │   └── stacks/
│   │       ├── HomeStack.js
│   │       ├── MessagesStack.js
│   │       ├── ChannelsStack.js
│   │       ├── ScheduleStack.js
│   │       └── MoreStack.js
│   │
│   └── screens/
│       ├── auth/
│       │   ├── SplashScreen.js
│       │   ├── WelcomeScreen.js
│       │   ├── LoginScreen.js
│       │   ├── OTPScreen.js
│       │   └── DevicePendingScreen.js
│       ├── home/
│       │   ├── HomeScreen.js
│       │   └── AnnouncementDetailScreen.js
│       ├── messages/
│       │   ├── ConversationsScreen.js
│       │   ├── ChatScreen.js
│       │   ├── NewMessageScreen.js
│       │   ├── NewGroupScreen.js
│       │   ├── ChatInfoScreen.js
│       │   ├── GroupMembersScreen.js
│       │   ├── AddMembersScreen.js
│       │   ├── MediaFilesScreen.js
│       │   └── MessageSearchScreen.js
│       ├── channels/
│       │   ├── ChannelsScreen.js
│       │   ├── ChannelThreadScreen.js
│       │   ├── ChannelInfoScreen.js
│       │   ├── ChannelMembersScreen.js
│       │   ├── CreateChannelScreen.js
│       │   ├── DiscoverChannelsScreen.js
│       │   └── PinnedMessagesScreen.js
│       ├── schedule/
│       │   ├── ScheduleScreen.js
│       │   ├── DayViewScreen.js
│       │   ├── EventDetailScreen.js
│       │   ├── CreateEventScreen.js
│       │   └── TrainingListScreen.js
│       └── more/
│           ├── MoreScreen.js
│           ├── ProfileScreen.js
│           ├── EditProfileScreen.js
│           ├── NotificationsScreen.js
│           ├── NotificationSettingsScreen.js
│           ├── FilesScreen.js
│           ├── DocumentViewerScreen.js
│           ├── StaffDirectoryScreen.js
│           ├── DepartmentsScreen.js
│           ├── StaffProfileScreen.js
│           ├── SettingsScreen.js
│           ├── AccountSettingsScreen.js
│           ├── PrivacySecurityScreen.js
│           ├── TrustedDevicesScreen.js
│           ├── AboutScreen.js
│           └── AdminPanelScreen.js
```

### 2.1.2 Navigation Setup

```javascript
// RootNavigator.js
export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <SplashScreen />;
  return isAuthenticated ? <MainNavigator /> : <AuthNavigator />;
}

// TabNavigator.js — Tab configuration
const tabs = [
  { name: 'Home',     icon: 'home',           stack: HomeStack     },
  { name: 'Messages', icon: 'message-circle', stack: MessagesStack },
  { name: 'Channels', icon: 'hash',           stack: ChannelsStack },
  { name: 'Schedule', icon: 'calendar',       stack: ScheduleStack },
  { name: 'More',     icon: 'menu',           stack: MoreStack     },
];
```

Tab bar styling (from `styles.md §2.1`):
- Background: `#FFFFFF`
- Border top: `1px solid #E8E8ED`
- Active icon: `#3B4B8A`
- Inactive icon: `#8E8E9A`
- Label font: 11px / 500 weight

### 2.1.3 Screen Implementation Order

Follow the group order from `01-product-design.md §1.1`:

```
Week 1: Constants + Components (T-003, T-005, T-006)
Week 2: Auth screens + Navigation shell (T-009, T-010, T-011–T-015)
Week 3: Home + Messages list + Chat (T-016, T-018, T-019)
Week 4: Full Messages module (T-020–T-026)
Week 5: Channels + Schedule (T-027–T-036)
Week 6: More tab + Polish (T-037–T-048)
```

### 2.1.4 Constants Implementation

#### `src/constants/colors.js`
```javascript
export const colors = {
  // Primary
  navyBlue:   '#3B4B8A',
  peach:      '#F0A882',
  white:      '#FFFFFF',
  // Neutrals
  black:      '#1A1A2E',
  darkGrey:   '#4A4A5A',
  mediumGrey: '#8E8E9A',
  lightGrey:  '#E8E8ED',
  offWhite:   '#F7F7FA',
  surface:    '#FAFAFE',
  // Semantic
  success:    '#2E7D5B',
  warning:    '#D4892E',
  error:      '#C94444',
  // Extended
  peachLight: '#FDF0E9',
  navyLight:  '#E8EAF2',
  navyDark:   '#2C3A6E',
};
```

#### `src/constants/typography.js`
```javascript
export const typography = {
  display:  { fontSize: 28, fontWeight: '700', lineHeight: 34, fontFamily: 'Inter_700Bold' },
  h1:       { fontSize: 24, fontWeight: '700', lineHeight: 30, fontFamily: 'Inter_700Bold' },
  h2:       { fontSize: 20, fontWeight: '600', lineHeight: 26, fontFamily: 'Inter_600SemiBold' },
  h3:       { fontSize: 17, fontWeight: '600', lineHeight: 22, fontFamily: 'Inter_600SemiBold' },
  body:     { fontSize: 15, fontWeight: '400', lineHeight: 22, fontFamily: 'Inter_400Regular' },
  bodyBold: { fontSize: 15, fontWeight: '600', lineHeight: 22, fontFamily: 'Inter_600SemiBold' },
  caption:  { fontSize: 13, fontWeight: '400', lineHeight: 18, fontFamily: 'Inter_400Regular' },
  small:    { fontSize: 11, fontWeight: '500', lineHeight: 16, fontFamily: 'Inter_500Medium' },
};
```

#### `src/constants/spacing.js`
```javascript
export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};
```

#### `src/constants/shadows.js`
```javascript
import { Platform } from 'react-native';
const base = Platform.OS === 'ios' ? {
  subtle: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  medium: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  strong: { shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
} : {
  subtle: { elevation: 1 },
  medium: { elevation: 5 },
  strong: { elevation: 12 },
};
export const shadows = base;
```

---

## 2.2 Web Admin Dashboard (React)

The web dashboard is for admin staff and management. It reuses the same design tokens (as CSS custom properties) and is a separate project under `/web-dashboard/`.

### Layout Structure

```
web-dashboard/
├── public/
│   └── index.html              ← NHL favicon + meta
├── src/
│   ├── styles/
│   │   ├── tokens.css          ← CSS vars matching branding.md
│   │   └── global.css
│   ├── components/
│   │   ├── Sidebar.jsx         ← Left nav: Dashboard, Staff, Channels, Schedule, Alerts, Logs
│   │   ├── TopBar.jsx          ← Search + avatar + notifications bell
│   │   ├── DataTable.jsx       ← Sortable, filterable table component
│   │   ├── StatCard.jsx        ← KPI summary card (count + label + trend)
│   │   ├── Modal.jsx
│   │   └── Badge.jsx
│   ├── pages/
│   │   ├── DashboardPage.jsx   ← Overview: active users, unread counts, pending approvals
│   │   ├── StaffPage.jsx       ← Staff list: view, create, suspend, role assignment
│   │   ├── ChannelsPage.jsx    ← Channel management: create, archive, member control
│   │   ├── SchedulePage.jsx    ← Org-wide schedule management
│   │   ├── AnnouncementsPage.jsx ← Send org-wide announcements
│   │   ├── DeviceApprovalsPage.jsx ← Pending device approval queue
│   │   ├── ActivityLogsPage.jsx  ← Full admin audit log viewer
│   │   └── SettingsPage.jsx    ← System-wide settings
│   └── App.jsx
```

### Dashboard Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (220px fixed)      │ Main Content Area           │
│                            │                             │
│ NHL Logo                   │ Top Bar (search + avatar)   │
│ ──────────                 │ ─────────────────────────   │
│ Dashboard                  │ Stat Cards Row (4 cards)    │
│ Staff                      │  Active Staff | Pending     │
│ Channels                   │  Approvals | Unread | Alerts│
│ Schedule                   │                             │
│ Announcements              │ Recent Activity Table       │
│ Devices                    │ (user, action, time, status)│
│ Logs                       │                             │
│ Settings                   │ Device Approval Queue       │
│                            │ (pending approval cards)    │
│ [User Avatar + Name]       │                             │
└─────────────────────────────────────────────────────────┘
```

### Web CSS Tokens (equivalent to mobile constants)
```css
:root {
  --color-navy:       #3B4B8A;
  --color-peach:      #F0A882;
  --color-white:      #FFFFFF;
  --color-black:      #1A1A2E;
  --color-dark-grey:  #4A4A5A;
  --color-mid-grey:   #8E8E9A;
  --color-light-grey: #E8E8ED;
  --color-off-white:  #F7F7FA;
  --color-error:      #C94444;
  --color-success:    #2E7D5B;
  --font-family:      'Inter', sans-serif;
  --radius-md:        10px;
  --radius-lg:        14px;
  --shadow-subtle:    0 1px 3px rgba(26,26,46,0.06);
  --shadow-medium:    0 4px 12px rgba(26,26,46,0.08);
}
```

### Admin Pages — Key Features

**StaffPage:** DataTable with columns: Avatar, Name, Role, Department, Status (online/offline), Actions (Edit | Suspend). Search + filter by role and department. "Add Staff" button opens modal with form.

**DeviceApprovalsPage:** Cards for each pending device. Shows: user name, device model, platform, IP, requested time. Approve (Navy Blue) / Reject (Error Red) actions. Triggers Convex mutation + notification.

**ActivityLogsPage:** Full audit log with timestamp, user, action type, affected resource, and IP. Search + date range filter. Exportable to CSV.

---

## 2.3 Desktop App (Electron)

The desktop app wraps the **web dashboard** - it is not a separate application. This ensures zero code duplication and a single point of maintenance.

### Strategy: Electron Shell + Web Dashboard

```
desktop/
├── main.js             ← Electron main process
├── preload.js          ← Context bridge (minimal surface)
├── package.json        ← Electron dependencies
└── build/              ← Production web dashboard build (copied in)
```

### `main.js` essentials:
```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',   // macOS native feel
    icon: path.join(__dirname, 'assets/icon.png'),
  });
  // In prod: load the built web dashboard
  win.loadFile(path.join(__dirname, 'build/index.html'));
  // In dev: load the dev server
  // win.loadURL('http://localhost:3000');
}

app.whenReady().then(createWindow);
```

### Desktop-Specific Additions (on top of web dashboard)
- System tray icon with unread badge count
- Native OS notifications (via `electron-notifier`) for messages and alerts
- Auto-update support via `electron-updater`
- Offline splash screen if Convex is unreachable

### Packaging
- macOS: `.dmg` via `electron-builder`
- Windows: `.exe` NSIS installer via `electron-builder`
- Linux: `.AppImage` via `electron-builder`
