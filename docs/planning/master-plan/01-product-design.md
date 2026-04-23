# 01 — Product Design Execution Plan

> **Role:** Senior Product Designer
> **References:** `branding.md`, `styles.md`, `screens.md`, `navigation.md`

---

## 1.1 Screen Build Order

Screens are built in dependency order — foundational before feature-specific. Each group must be visually signed off before the next begins.

### Group A: Design System (Week 1)
Build and document these first. Everything else derives from them.

| Deliverable | Description |
|-------------|-------------|
| Color tokens | All swatches from `branding.md` in a Figma/reference sheet |
| Type scale | Inter typeface, all 8 sizes, live rendering test |
| Spacing grid | 4px base grid, all spacing tokens |
| Icon set | Feather icon inventory — document every icon used and its screen |
| Avatar variants | All 4 sizes + initials fallback + online dot |
| Button states | Primary, Secondary, Tertiary, Destructive — default, pressed, disabled |
| Input states | Default, focus, error, filled |
| Shadow levels | Subtle, Medium, Strong — rendered reference |

### Group B: Auth Screens (Week 1–2)
S-01 → S-02 → S-03 → S-04 → S-05

These are the first thing every user sees. Must be pixel-perfect.

| Screen | Key Design Concern |
|--------|--------------------|
| S-01 Splash | Logo animation, brand first impression |
| S-02 Welcome | Hero layout, feature card pair, CTA sizing |
| S-03 Login | Tab toggle (Phone/Email), country code picker styling |
| S-04 OTP | 6-box input UX — spacing, focus states, error shake |
| S-05 Device Pending | Trust/security visual language, status card |

### Group C: Navigation Shell (Week 2)
Tab bar + header — implemented once, used everywhere.

| Component | Spec Source |
|-----------|-------------|
| Bottom Tab Bar | `styles.md §2.1` |
| Top Header Bar | `styles.md §2.2` |
| Stack transitions | `styles.md §2.3` |

### Group D: Home & Core (Week 2–3)
S-10, S-12 — establishes the information hierarchy pattern.

### Group E: Messages (Week 3–4)
S-20 through S-29 — the most complex module. Build in this sub-order:
1. S-20 Conversation List (establishes list pattern)
2. S-21 Chat Thread 1:1 (establishes bubble system)
3. S-22 Chat Group (extends bubbles)
4. S-23 New Message / Contact Picker
5. S-25 Chat Info → S-26/S-27/S-28/S-29 (detail screens)
6. S-24 New Group Setup (depends on S-23)

### Group F: Channels (Week 4–5)
S-30 → S-31 → S-34 → S-35 → S-32 → S-33 → S-36

### Group G: Schedule (Week 5)
S-40 → S-41 → S-42 → S-43 → S-44

### Group H: More / Profile / Settings (Week 6)
S-50 → S-51 → S-52 → S-57 → S-59 → S-53 → S-55 → S-60 → S-61 → S-62 → S-63 → S-64 → S-65

### Group I: Modals & Overlays (Week 6)
S-70, S-71, S-72, S-73

---

## 1.2 Reusable Component Inventory

Every component is built ONCE and imported everywhere. No duplicate style blocks.

### Tier 1: Atoms (no dependencies)
| Component | Props | Variants |
|-----------|-------|----------|
| `Text` | children, variant, color, style | display, h1, h2, h3, body, bodyBold, caption, small |
| `Icon` | name, size, color | Any Feather icon name |
| `Spacer` | size | xs, sm, md, base, lg, xl, 2xl, 3xl |
| `Divider` | type | full, inset, avatarInset, section |
| `Badge` | count / label, variant | unread, role, department |
| `StatusDot` | status | online, away, dnd, offline |

### Tier 2: Molecules (compose atoms)
| Component | Composition |
|-----------|-------------|
| `Avatar` | Image or initials + StatusDot |
| `Button` | Text + Icon (optional) + press states |
| `Input` | Label + TextInput + Icon + error state |
| `SearchBar` | Icon + Input + clear button |
| `Tag` | Text + background color variant |
| `Card` | Container + shadow + border |
| `SectionHeader` | Text + optional right action |
| `EmptyState` | Icon + Text + optional Button |
| `Toast` | Icon + Text + auto-dismiss |

### Tier 3: Organisms (compose molecules)
| Component | Composition |
|-----------|-------------|
| `ConversationItem` | Avatar + Text × 2 + Badge + timestamp |
| `ChannelItem` | Icon + Text × 2 + Badge |
| `ContactItem` | Avatar + Text × 2 + Badge + Tag |
| `NotificationItem` | Icon circle + Text × 3 + StatusDot |
| `ChatBubble` | Text + timestamp (sent / received / system variants) |
| `ChatInput` | Icon button + Input + send Button |
| `EventCard` | Border color + Text × 3 |
| `FileItem` | Type icon + Text × 2 + action icon |
| `DeviceCard` | Icon + Text × 3 + status badge |

### Tier 4: Templates (page shells)
| Template | Used By |
|----------|---------|
| `ScrollScreen` | Any screen with scrollable content |
| `ListScreen` | Any FlatList-based screen |
| `FormScreen` | Any screen with inputs + save action |
| `ChatScreen` | Chat threads (1:1 and group) |
| `ModalScreen` | Bottom sheets and full-screen modals |

---

## 1.3 UX Rules

### Navigation UX
- Every stack screen has a back chevron (top-left). No exceptions.
- Tab bar is always visible in the main app. Hidden in modals.
- All modal entry animations slide from bottom. Stack screens slide from right.
- Header title is always centered. Left = nav action. Right = context action (max 2 icons).
- Destructive actions always require a confirmation dialog before executing.
- Long-press reveals contextual action sheets (not inline buttons) to keep UIs clean.

### Messaging UX
- Messages list scrolls to the bottom on open and on new message.
- Sent messages right-aligned, Navy Blue. Received left-aligned, Off White.
- Timestamps shown on the last message in a cluster, not every message.
- Date separators shown only when the date changes, not between every message.
- In group chats: sender name (caption, Navy Blue) above first message in cluster.
- "Typing..." indicator appears in the bubble area, never overlays other content.
- Read receipts shown only in 1:1 chats under last sent message.
- New message input bar sticks to the bottom above the keyboard.
- Attachment action sheet slides up from the bottom — never inline dropdown.

### Data Display UX
- Lists always have an empty state component (icon + message + optional CTA).
- Lists always support pull-to-refresh with Navy Blue indicator.
- Skeleton loaders replace content during load — never spinners on list items.
- Global spinner (Navy Blue, ActivityIndicator large) used only for full-screen initial loads.
- Unread counts always display with red badge. Zero = no badge shown.
- Timestamps: < 1 min → "Just now", < 60 min → "Xm ago", today → "HH:MM", else → "Mon DD".
- Truncate long text with ellipsis at 1 line for previews, 2 lines for descriptions.

### Consistency Enforcement
- Design review of each Group before the next Group begins.
- No screen ships with a hardcoded color hex, font size, or spacing value.
- Pixel-level review against `styles.md` for every card, list item, and bubble.
- Every interactive element must have a visible pressed/active state.
- Minimum touch target: 44×44px on all interactive elements.
- Test on iPhone SE (4"), iPhone 14 Pro (6.1"), and Android (5.5") screen sizes.

---

## 1.4 Design Consistency Checklist (per screen before handoff)

- [ ] All colors from `constants/colors.js` only
- [ ] All typography from `constants/typography.js` only
- [ ] All spacing from `constants/spacing.js` only
- [ ] All icons are Feather only
- [ ] No emoji in any text
- [ ] Pressed states on all interactive elements
- [ ] Empty state handled
- [ ] Loading state handled
- [ ] Keyboard overlay handled (inputs)
- [ ] SafeArea applied correctly
- [ ] Tested on small (SE) and large (Pro Max) screen sizes
