# Backend Plan — Part 2: Screen-by-Screen Workflow Map

> Every screen, every clickable element, and its backend interaction.

Legend:
- **Q** = Query (read, real-time subscription)
- **M** = Mutation (write)
- **A** = Action (external API call)
- **Nav** = Client-side navigation only
- **CS** = Client-side state only (no backend)

---

## 2.1 AUTH SCREENS

### SplashScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Auto-redirect on load | Check Privy auth + device trust | Q:`users.getViewer` + Q:`devices.getMyDeviceStatus` |

### WelcomeScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | "Get Started" button | Nav → Login | Nav |

### LoginScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Phone input + country picker | Enter phone number | CS |
| 2 | Email input | Enter email | CS |
| 3 | "Send Code" button | Send OTP via Privy | A:`Privy.sendCode()` |

### OTPScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | 6-digit code input | Enter OTP | CS |
| 2 | "Verify" / auto-verify | Verify OTP, register device | A:`Privy.loginWithCode()` → M:`auth.registerOrValidateDevice` |
| 3 | "Resend Code" link | Re-send OTP | A:`Privy.sendCode()` |
| 4 | Post-verify redirect | trusted→MainApp, pending→DevicePending, revoked→error | Q: device trust status from mutation response |

### DevicePendingScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Waiting state | Poll/subscribe for approval | Q:`devices.getMyDeviceStatus` (reactive, auto-updates) |
| 2 | "Logout" button | Clear session | A:`Privy.logout()` |

---

## 2.2 HOME TAB

### HomeScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Welcome header "Welcome back, Dr. Yusuf Patel" | Current user data | Q:`users.getViewer` |
| 2 | Avatar (top-right) → press | Nav → Profile | Nav |
| 3 | "2 Urgent Announcements" highlighted card | Count unacknowledged | Q:`announcements.getUnacknowledgedCount` |
| 4 | Card press | Nav → NotificationsScreen | Nav |
| 5 | Clinic quick access card (left accent) | Today's apt count + pending count | Q:`clinicAppointments.getTodaysCount` + Q:`clinicAppointments.getPendingCount` |
| 6 | Clinic card press | Nav → ClinicHub | Nav |
| 7 | "NEXT APPOINTMENT" card | Next upcoming appointment + patient | Q:`clinicAppointments.getNextUpcoming` (includes patient join) |
| 8 | Next appointment card press | Nav → AppointmentDetail | Nav |
| 9 | Stats grid: "Unread" | Unread message count | Q:`stats.getHomeDashboardCounts` |
| 10 | Stats grid: "Mentions" | Mention count | Q:`stats.getHomeDashboardCounts` |
| 11 | Stats grid: "Events Today" | Today's event count | Q:`stats.getHomeDashboardCounts` |
| 12 | Stats grid: "Pending" | Pending items count | Q:`stats.getHomeDashboardCounts` |
| 13 | "RECENT MESSAGES" section header | - | - |
| 14 | "See All" action | Nav → MessagesTab | Nav |
| 15 | ConversationItem × 3 | Last 3 conversations | Q:`conversations.listRecent(3)` |
| 16 | ConversationItem press | Nav → Chat | Nav |
| 17 | "YOUR CHANNELS" section header | - | - |
| 18 | Channel pill × 5 (horizontal scroll) | User's channels | Q:`channels.listMine(5)` |
| 19 | Channel pill press | Nav → ChannelThread | Nav |
| 20 | "TODAY'S SCHEDULE" section header | - | - |
| 21 | "View All" action | Nav → ScheduleTab | Nav |
| 22 | Event card × 2 | Today's schedule events | Q:`appointments.getForDate(today, limit:2)` |
| 23 | Event card press | Nav → EventDetail | Nav |
| 24 | "ANNOUNCEMENTS" section header | - | - |
| 25 | Announcement card × 1 | Latest announcement | Q:`announcements.listRecent(1)` |
| 26 | Announcement card press | Nav → AnnouncementDetail | Nav |

### AnnouncementDetailScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Title, body, author, timestamp | Full announcement | Q:`announcements.getById` |
| 3 | Author name + avatar | Author user data | Q:`users.getById` (joined or separate) |
| 4 | Attachment row(s) | File metadata | Included in announcement |
| 5 | Attachment press | Open/download file | Q:`files.getUrl` (Convex storage) |
| 6 | Acknowledge progress bar | Acknowledged count / total | Included in announcement |
| 7 | "Acknowledge" button | Mark acknowledged | M:`announcements.acknowledge` |

---

## 2.3 MESSAGES TAB

### ConversationsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Search bar | Search conversations | CS filter on query results |
| 2 | Filter: "All" pill | Show all | CS filter |
| 3 | Filter: "Unread" pill | Show unread only | CS filter |
| 4 | Filter: "Groups" pill | Show groups only | CS filter |
| 5 | ConversationItem list | User's conversations (excl. patient) | Q:`conversations.list` + Q:`conversationReadStatus.getUnread` |
| 6 | ConversationItem press | Nav → Chat | Nav |
| 7 | Unread badge on ConversationItem | Per-convo unread count | Included in readStatus query |
| 8 | Header edit icon | Nav → NewMessage | Nav |
| 9 | FAB (pencil icon) | Nav → NewMessage | Nav |

### ChatScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Header: conversation name + avatar | Conversation + other user data | Q:`conversations.getById` + Q:`users.getById` |
| 3 | Header center press | Nav → ChatInfo | Nav |
| 4 | Header right info icon | Nav → ChatInfo | Nav |
| 5 | Message list (FlatList) | Messages for this conversation | Q:`messages.listByConversation` (paginated, reactive) |
| 6 | Sender name in group messages | User lookup | Batched from `conversations.getMembers` |
| 7 | DateSeparator components | Client-side date grouping | CS |
| 8 | ChatInput: text field | Type message | CS |
| 9 | ChatInput: send button | Send message | M:`messages.send` |
| 10 | ChatInput: attachment button | Pick & upload file | M: file storage upload → M:`messages.send` (type:file/image) |
| 11 | On screen focus | Mark conversation read | M:`conversationReadStatus.markRead` |
| 12 | Real-time new messages | Auto-scroll | Reactive Q on messages |

### NewMessageScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss modal | Nav |
| 2 | Contact search input | Search staff | Q:`users.searchStaff` |
| 3 | Contact item press | Find/create DM conversation → Nav to Chat | M:`conversations.getOrCreate` |

### NewGroupScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss modal | Nav |
| 2 | Group name input | Enter group name | CS |
| 3 | Member search input | Search staff | Q:`users.searchStaff` |
| 4 | Member chip (selected) | Toggle selection | CS |
| 5 | "Create" button | Create group conversation | M:`conversations.createGroup` → Nav to Chat |

### ChatInfoScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Conversation name/avatar/details | Full conversation | Q:`conversations.getById` |
| 3 | Members list (preview, 5 max) | Member user data | Q:`conversations.getMembers` |
| 4 | Member item press | Nav → StaffProfile | Nav |
| 5 | "See All Members" row | Nav → GroupMembers | Nav |
| 6 | "Add Members" row | Nav → AddMembers | Nav |
| 7 | Shared media preview grid | Media messages | Q:`messages.getMediaByConversation` |
| 8 | "See All Media" row | Nav → MediaFiles | Nav |
| 9 | "Search in Conversation" row | Nav → MessageSearch | Nav |
| 10 | "Mute Notifications" toggle | Toggle mute | M:`conversations.toggleMute` |
| 11 | "Leave Group" button | Leave group | M:`conversations.leaveGroup` |
| 12 | "Delete Chat" button (1:1 only) | Archive conversation | M:`conversations.archive` |

---

## 2.4 CHANNELS TAB

### ChannelsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Search bar | Filter channels | CS filter on query |
| 2 | "STARRED CHANNELS" section | Starred channels | Q:`channels.listStarred` |
| 3 | "YOUR CHANNELS" section | Joined channels | Q:`channels.listMine` |
| 4 | ChannelItem press | Nav → ChannelThread | Nav |
| 5 | ChannelItem unread badge | Per-channel unread | Q:`channelReadStatus.getUnread` |
| 6 | Header plus icon | Nav → CreateChannel | Nav |
| 7 | FAB | Nav → CreateChannel | Nav |
| 8 | "Discover Channels" row | Nav → DiscoverChannels | Nav |

### ChannelThreadScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Header: channel name + member count | Channel data | Q:`channels.getById` |
| 3 | Header press | Nav → ChannelInfo | Nav |
| 4 | Message list | Channel messages | Q:`messages.listByChannel` (paginated, reactive) |
| 5 | Sender name + avatar per message | User data | Batched from members |
| 6 | Pinned message indicator/banner | Pinned count | Q:`messages.getPinnedCount` |
| 7 | ChatInput: text field | Type message | CS |
| 8 | ChatInput: send button | Send channel message | M:`messages.sendToChannel` |
| 9 | On screen focus | Mark channel read | M:`channelReadStatus.markRead` |

### ChannelInfoScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Channel name, description, type, member count | Channel data | Q:`channels.getById` |
| 3 | Members list preview | Member data | Q:`channels.getMembers` |
| 4 | "See All Members" row | Nav → ChannelMembers | Nav |
| 5 | "Pinned Messages" row | Nav → PinnedMessages | Nav |
| 6 | "Star Channel" toggle | Star/unstar | M:`channelStarred.toggle` |
| 7 | "Mute" toggle | Toggle mute | M:`channels.toggleMute` |
| 8 | "Leave Channel" button | Leave | M:`channels.leave` |
| 9 | "Edit Channel" (admin) | Edit name/desc | M:`channels.update` |

### CreateChannelScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss | Nav |
| 2 | Channel name input | Enter name | CS |
| 3 | Description input | Enter description | CS |
| 4 | Public/Private toggle | Pick type | CS |
| 5 | Member search + selection | Search staff | Q:`users.searchStaff` |
| 6 | "Create" button | Create channel | M:`channels.create` |

### DiscoverChannelsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Public channels list | Non-joined public channels | Q:`channels.listDiscoverable` |
| 3 | "Join" button per channel | Join channel | M:`channels.join` |

---

## 2.5 SCHEDULE TAB

### ScheduleScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Calendar grid (month view) | Events for month (dot indicators) | Q:`appointments.getForMonth` |
| 2 | Date cell press | Select date, load day events | Q:`appointments.getForDate` |
| 3 | Left/right month nav | Change month | Q:`appointments.getForMonth` |
| 4 | Today highlight | Client-side | CS |
| 5 | Event card (day list) | Event details | Included in getForDate |
| 6 | Event card press | Nav → EventDetail | Nav |
| 7 | "Training" button/link | Nav → TrainingList | Nav |

### EventDetailScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Event title, type, description, location, time | Full event | Q:`appointments.getById` |
| 3 | Color-coded type bar | Client-side by type | CS |
| 4 | Attendees list | User data | Q:`users.getByIds` |
| 5 | Attendee item press | Nav → StaffProfile | Nav |
| 6 | "Acknowledge" button | Acknowledge event | M:`appointments.acknowledge` |
| 7 | "Edit" button (organizer/admin) | Nav → CreateEvent (edit mode) | Nav |
| 8 | "Delete" button (organizer/admin) | Delete event | M:`appointments.delete` |

### CreateEventScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss | Nav |
| 2 | Title input | Enter title | CS |
| 3 | Type selector (shift/training/meeting/other) | Pick type | CS |
| 4 | Date picker | Pick date | CS |
| 5 | Start time picker | Pick start | CS |
| 6 | End time picker | Pick end | CS |
| 7 | Location input | Enter location | CS |
| 8 | Description input | Enter description | CS |
| 9 | Attendee search + selection | Search staff | Q:`users.searchStaff` |
| 10 | "All Day" toggle | Toggle | CS |
| 11 | "Save" button (new) | Create event | M:`appointments.create` |
| 12 | "Save" button (edit) | Update event | M:`appointments.update` |

### TrainingListScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Training sessions list | Upcoming training | Q:`trainingSessions.listUpcoming` |
| 3 | "Register" / "Registered" button | Toggle registration | M:`trainingSessions.register` / `unregister` |
| 4 | Session details (title, date, time, instructor) | Included in query | - |

---

## 2.6 MORE TAB

### MoreScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | User card (name, role, avatar) | Current user | Q:`users.getViewer` |
| 2 | User card press | Nav → Profile | Nav |
| 3 | "Notifications" row + badge | Unread count | Q:`notifications.getUnreadCount` |
| 4 | "Notifications" press | Nav → NotificationsScreen | Nav |
| 5 | "Staff Directory" row | Nav → StaffDirectory | Nav |
| 6 | "Departments" row | Nav → Departments | Nav |
| 7 | "Files" row | Nav → Files | Nav |
| 8 | "Clinic" row | Nav → ClinicHub | Nav |
| 9 | "Settings" row | Nav → Settings | Nav |
| 10 | "Admin Panel" row (admin only) | Visible if admin | CS role check from viewer |
| 11 | "Admin Panel" press | Nav → AdminPanel | Nav |
| 12 | "Logout" button | Clear session | A:`Privy.logout()` + M:`users.setOffline` |

### ProfileScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Cover photo + avatar | User data + avatarUrl | Q:`users.getViewer` |
| 2 | Name, role, department | User data | Included |
| 3 | Contact info (email, phone, joined) | User data | Included |
| 4 | "Edit Profile" button | Nav → EditProfile | Nav |
| 5 | Settings icon | Nav → Settings | Nav |
| 6 | "Files" button | Nav → Files | Nav |
| 7 | Active badge, department badge | Status data | Included |

### EditProfileScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Name, phone, email, bio inputs | Prefilled from user | Q:`users.getViewer` |
| 3 | Avatar with "Change Photo" | Pick image + upload | M: file storage upload |
| 4 | "Save" button | Update profile | M:`users.updateProfile` |

### NotificationsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Notifications list | All notifications | Q:`notifications.list` (paginated, reactive) |
| 3 | NotificationItem press | Mark read + nav to reference | M:`notifications.markRead` + Nav (based on referenceType) |
| 4 | Unread indicator (dot) | isRead field | Included |
| 5 | "Mark All Read" button | Mark all read | M:`notifications.markAllRead` |
| 6 | Pull-to-refresh | Re-query | Reactive query handles this |

### StaffDirectoryScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Search bar | Search staff | Q:`users.searchStaff` |
| 3 | Filter pills (All/Doctors/Nurses/Admin) | Filter by role | CS filter on query |
| 4 | Staff list (grouped alphabetically) | All active staff | Q:`users.listStaff` |
| 5 | Staff item press | Nav → StaffProfile | Nav |

### StaffProfileScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Staff data (name, role, dept, bio, contact) | Full user | Q:`users.getById` |
| 3 | Online status indicator | Real-time status | Reactive Q |
| 4 | "Message" button | Find/create DM + nav to Chat | M:`conversations.getOrCreate` |

### DepartmentsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Departments list | All departments | Q:`departments.list` |
| 3 | Department lead name | User data | Q:`users.getById` per department |
| 4 | Department press | Nav → department channel or member list | Nav |

### FilesScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button / breadcrumb | Nav back or up | Nav |
| 2 | Files + folders list | Root or subfolder items | Q:`files.listByParent` |
| 3 | Folder press | Nav into subfolder | Q:`files.listByParent(folderId)` |
| 4 | File press | Nav → DocumentViewer | Nav |
| 5 | Upload button | Pick file + upload | M: file storage upload + M:`files.create` |

### SettingsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | "Account" row | Nav → AccountSettings | Nav |
| 3 | "Privacy & Security" row | Nav → PrivacySecurity | Nav |
| 4 | "Notifications" row | Nav → NotificationSettings | Nav |
| 5 | "About" row | Nav → About | Nav |
| 6 | "Logout" button | Logout | A:`Privy.logout()` + M:`users.setOffline` |

### AccountSettingsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Email/phone display | Current user | Q:`users.getViewer` |
| 3 | "Delete Account" button | Deactivate | M:`users.deactivate` |

### PrivacySecurityScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | "Trusted Devices" row | Nav → TrustedDevices | Nav |
| 3 | Active sessions count | Device count | Q:`devices.listMine` (count) |
| 4 | Privacy toggles | Update preferences | M:`users.updatePrivacySettings` |

### TrustedDevicesScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Devices list | User's devices | Q:`devices.listMine` |
| 3 | Current device indicator | Match fingerprint | CS comparison |
| 4 | "Revoke" button per device | Revoke own device | M:`devices.revokeOwn` |
| 5 | Trust status badge (trusted/pending/revoked) | Included in query | - |

### AboutScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | App version, build info | Static | None |
| 2 | "Terms of Service" link | Open URL | None |
| 3 | "Privacy Policy" link | Open URL | None |

---

## 2.7 ADMIN SCREENS

### AdminPanelScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | "Active Staff" stat card | Count of active staff | Q:`admin.getDashboardStats` |
| 3 | "Pending Devices" stat card | Count of pending | Q:`admin.getDashboardStats` |
| 4 | "Device Pending Approval" card (inline) | Latest pending device | Q:`devices.getPending` (limit 1) |
| 5 | "Approve" button (inline) | Approve device | M:`devices.approve` |
| 6 | "Reject" button (inline) | Reject device | M:`devices.reject` |
| 7 | "Manage Staff" row | Nav → StaffDirectory (admin view) | Nav |
| 8 | "Device Approvals" row | Nav → AdminDeviceApprovals | Nav |
| 9 | "Manage Channels" row | Nav → AdminManageChannels | Nav |
| 10 | "Send Announcement" row | Nav → AdminSendAnnouncement | Nav |
| 11 | "Activity Logs" row | Nav → AdminActivityLogs | Nav |
| 12 | "System Analytics" row | Nav → AdminSystemAnalytics | Nav |

### AdminDeviceApprovalsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Pending devices list | Pending devices + user info | Q:`devices.listPendingWithUsers` |
| 3 | "Approve" button per device | Approve | M:`devices.approve` |
| 4 | "Reject" button per device | Reject | M:`devices.reject` |
| 5 | Real-time updates | List updates when devices change | Reactive Q |

### AdminManageChannelsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | All channels list | All channels | Q:`channels.listAll` |
| 3 | "Archive" button per channel | Archive channel | M:`channels.archive` |
| 4 | "Edit" button per channel | Edit channel details | M:`channels.update` |
| 5 | "Create Channel" button | Nav → CreateChannel | Nav |

### AdminSendAnnouncementScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back / close button | Nav back | Nav |
| 2 | Title input | Enter title | CS |
| 3 | Body input (multiline) | Enter body | CS |
| 4 | "Attach File" button | Pick + upload files | M: file storage upload |
| 5 | Attached file chip(s) | Show attached | CS |
| 6 | Remove attachment (x) | Remove from list | CS |
| 7 | "Send" button | Create announcement + notify | M:`announcements.create` → triggers push to all staff |

### AdminSystemAnalyticsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Active users count | Online staff | Q:`admin.getSystemStats` |
| 3 | Message volume (period) | Message counts | Q:`admin.getMessageVolume` |
| 4 | Storage usage | File storage metrics | Q:`admin.getSystemStats` |

### AdminActivityLogsScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Log entries list | Paginated audit logs | Q:`adminLogs.list` |
| 3 | Action type filter | Filter by action | Q:`adminLogs.listByAction` |
| 4 | Date range filter | Filter by date | Q:`adminLogs.listByDateRange` |
| 5 | Log entry detail (actor, action, target, timestamp) | Included in list | - |

---

## 2.8 CLINIC SCREENS

### ClinicHubScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | "Clinic" header | Static | None |
| 3 | Quick stat: "Today" (appointment count) | Today's count | Q:`clinicAppointments.getTodaysCount` |
| 4 | Quick stat: "Pending" (notes pending) | Pending notes | Q:`treatmentNotes.getPendingCount` |
| 5 | Quick stat: "Invoices Due" (outstanding total) | Outstanding K amount | Q:`invoices.getTotalOutstanding` |
| 6 | "TODAY'S APPOINTMENTS" section header | - | - |
| 7 | "See All" action | Nav → AppointmentsList | Nav |
| 8 | AppointmentCard × 3 | Today's appointments | Q:`clinicAppointments.getForToday(limit:3)` |
| 9 | AppointmentCard press | Nav → AppointmentDetail | Nav |
| 10 | "QUICK ACTIONS" section header | - | - |
| 11 | "Book Appointment" tile | Nav → BookAppointment | Nav |
| 12 | "Patient Lookup" tile | Nav → PatientDirectory | Nav |
| 13 | "Treatment Note" tile | Nav → TreatmentNote (no patient) | Nav |
| 14 | "Create Invoice" tile | Nav → CreateInvoice | Nav |
| 15 | "Reports" tile | Nav → ReportsDashboard | Nav |
| 16 | "Telehealth" tile | Nav → Telehealth | Nav |
| 17 | "RECENT PATIENTS" section header | - | - |
| 18 | "View All" action | Nav → PatientDirectory | Nav |
| 19 | PatientCard × 3 | Recent patients | Q:`patients.listRecent(3)` |
| 20 | PatientCard press | Nav → PatientProfile | Nav |

### AppointmentsListScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Filter: "Today" pill | Today's appointments | Q:`clinicAppointments.getForDate(today)` |
| 3 | Filter: "Upcoming" pill | Future appointments | Q:`clinicAppointments.getUpcoming` |
| 4 | Filter: "Past" pill | Completed/past | Q:`clinicAppointments.getPast` |
| 5 | Date nav arrows (Today filter) | Shift date ±1 day | Q:`clinicAppointments.getForDate(newDate)` |
| 6 | AppointmentCard list | Appointments for selected filter | Included in filter queries |
| 7 | AppointmentCard press | Nav → AppointmentDetail | Nav |
| 8 | FAB (+ icon) | Nav → BookAppointment | Nav |

### AppointmentDetailScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Status banner (Confirmed/Pending/etc.) | Status from appointment | Q:`clinicAppointments.getById` |
| 3 | Patient card (name, ID, conditions) | Patient data | Q:`patients.getById` |
| 4 | Patient card press | Nav → PatientProfile | Nav |
| 5 | Detail rows: Type, Date, Time, Duration, Provider, Location | Appointment data | Included |
| 6 | Provider name | User data | Q:`users.getById` |
| 7 | Notes section | Appointment notes | Included |
| 8 | "Start Consultation" button | Update status → Nav to TreatmentNote | M:`clinicAppointments.updateStatus('in-progress')` |
| 9 | "Start Telehealth" button (if type=Telehealth) | Create session → Nav to TelehealthCall | M:`telehealthSessions.create` |
| 10 | "Reschedule" button | Nav → BookAppointment (edit mode) | Nav |
| 11 | "Cancel" button | Cancel appointment | M:`clinicAppointments.cancel` |
| 12 | "Mark Complete" button | Complete appointment | M:`clinicAppointments.complete` |
| 13 | "No Show" button | Mark no-show | M:`clinicAppointments.markNoShow` |

### BookAppointmentScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss modal | Nav |
| 2 | Patient search input | Search patients | Q:`patients.search` |
| 3 | Patient result item press | Select patient | CS |
| 4 | Selected patient chip | Show selection | CS |
| 5 | Type pills (Consultation, Follow-up, etc.) | Select type | CS |
| 6 | Date picker | Pick date | CS |
| 7 | Start time picker | Pick start | CS |
| 8 | End time picker | Pick end | CS |
| 9 | Provider chips | List doctors | Q:`users.listDoctors` |
| 10 | Provider chip press | Select provider | CS |
| 11 | Location input | Enter location | CS |
| 12 | Notes input | Enter notes | CS |
| 13 | "Send SMS Reminder" toggle | Toggle | CS |
| 14 | "Recurring" toggle | Toggle | CS |
| 15 | "Save" button (new) | Create appointment | M:`clinicAppointments.create` |
| 16 | "Save" button (edit/reschedule) | Update appointment | M:`clinicAppointments.reschedule` |

### PatientDirectoryScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Search bar | Search patients | Q:`patients.search` |
| 3 | Filter: "All" pill | All patients | Q:`patients.listAll` |
| 4 | Filter: "Active" pill | Active patients | Q:`patients.listByFilter('active')` |
| 5 | Filter: "Dialysis" pill | Dialysis dept | Q:`patients.listByFilter('dialysis')` |
| 6 | Filter: "Recent" pill | Recent visits | Q:`patients.listRecent` |
| 7 | PatientCard list (alphabetical groups) | Patients for filter | Included |
| 8 | PatientCard press | Nav → PatientProfile | Nav |
| 9 | FAB (+ icon) | Nav → AddEditPatient (new) | Nav |

### PatientProfileScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Patient name, age, status badge, ID | Patient data | Q:`patients.getById` |
| 3 | "Edit" button (header) | Nav → AddEditPatient (edit) | Nav |
| 4 | "Book" button (header) | Nav → BookAppointment (patient pre-set) | Nav |
| 5 | Tab: "Overview" | Switch tab | CS |
| 6 | Tab: "Notes" | Switch tab | CS |
| 7 | Tab: "Files" | Switch tab | CS |
| 8 | Tab: "Billing" | Switch tab | CS |
| 9 | Tab: "Appointments" | Switch tab | CS |
| --- | **Overview Tab** | | |
| 10 | Allergies list | Patient data | Included in `patients.getById` |
| 11 | Medications list | Patient data | Included |
| 12 | Conditions list | Patient data | Included |
| 13 | Blood type | Patient data | Included |
| 14 | Emergency contact (name, phone, relationship) | Patient data | Included |
| 15 | Insurance (provider, policy) | Patient data | Included |
| --- | **Notes Tab** | | |
| 16 | Treatment notes list | Notes for patient | Q:`treatmentNotes.listByPatient` |
| 17 | Note item press | Nav → TreatmentNote (read-only) | Nav |
| 18 | "New Note" button | Nav → TreatmentNote (new, patient pre-set) | Nav |
| --- | **Files Tab** | | |
| 19 | Patient files list | Files for patient | Q:`files.listByPatient` (or filter by patientId) |
| 20 | File item press | Open/download | Q: file URL |
| 21 | "Upload" button | Pick + upload file | M: file storage + M:`files.createForPatient` |
| --- | **Billing Tab** | | |
| 22 | Outstanding total | Sum unpaid+overdue | Q:`invoices.getOutstandingByPatient` |
| 23 | Invoice list | Patient's invoices | Q:`invoices.listByPatient` |
| 24 | InvoiceItem press | Nav → InvoiceDetail | Nav |
| 25 | "New Invoice" button | Nav → CreateInvoice (patient pre-set) | Nav |
| --- | **Appointments Tab** | | |
| 26 | Appointments list | Patient's appointments | Q:`clinicAppointments.listByPatient` |
| 27 | Appointment item press | Nav → AppointmentDetail | Nav |

### AddEditPatientScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss modal | Nav |
| 2 | "Add Patient" / "Edit Patient" header | Mode detection | CS (from route params) |
| 3 | First name input | Enter/edit | CS (prefilled if editing: Q:`patients.getById`) |
| 4 | Last name input | Enter/edit | CS |
| 5 | Date of birth input | Enter/edit | CS |
| 6 | Gender selector | Pick gender | CS |
| 7 | Phone input | Enter/edit | CS |
| 8 | Email input | Enter/edit | CS |
| 9 | Allergies input | Enter/edit (comma-sep or chips) | CS |
| 10 | Conditions input | Enter/edit | CS |
| 11 | Blood type selector | Pick | CS |
| 12 | Insurance provider input | Enter/edit | CS |
| 13 | Policy number input | Enter/edit | CS |
| 14 | Emergency contact: name | Enter/edit | CS |
| 15 | Emergency contact: phone | Enter/edit | CS |
| 16 | Emergency contact: relationship | Enter/edit | CS |
| 17 | "Save" button (new) | Create patient | M:`patients.create` |
| 18 | "Save" button (edit) | Update patient | M:`patients.update` |

### TreatmentNoteScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Template picker (pills) | Select template | CS |
| 3 | Patient display (or search if no patient) | Patient data | Q:`patients.getById` or Q:`patients.search` |
| 4 | Subjective textarea | Enter/view SOAP | CS (prefilled if viewing: Q:`treatmentNotes.getById`) |
| 5 | Objective textarea | Enter/view SOAP | CS |
| 6 | Assessment textarea | Enter/view SOAP | CS |
| 7 | Plan textarea | Enter/view SOAP | CS |
| 8 | VitalsInput: BP | Enter/view | CS |
| 9 | VitalsInput: Heart Rate | Enter/view | CS |
| 10 | VitalsInput: Temperature | Enter/view | CS |
| 11 | VitalsInput: Weight | Enter/view | CS |
| 12 | VitalsInput: O2 Sat | Enter/view | CS |
| 13 | "Attach File" button | Pick + upload | M: file storage upload |
| 14 | Attachment chip(s) | Show attached | CS |
| 15 | "Save" button (new note) | Create treatment note | M:`treatmentNotes.create` |
| 16 | Read-only mode (existing note) | All fields disabled | Q:`treatmentNotes.getById` |

### InvoicesListScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Summary card: "Total Outstanding" | Sum unpaid+overdue | Q:`invoices.getSummary` |
| 3 | Summary card: "Overdue" count | Overdue count | Included in summary |
| 4 | Filter: "All" pill | All invoices | Q:`invoices.listAll` |
| 5 | Filter: "Unpaid" pill | Unpaid | Q:`invoices.listByStatus('unpaid')` |
| 6 | Filter: "Overdue" pill | Overdue | Q:`invoices.listByStatus('overdue')` |
| 7 | Filter: "Paid" pill | Paid | Q:`invoices.listByStatus('paid')` |
| 8 | InvoiceItem list | Invoices for filter | Included in filter queries |
| 9 | InvoiceItem press | Nav → InvoiceDetail | Nav |
| 10 | FAB (+ icon) | Nav → CreateInvoice | Nav |

### InvoiceDetailScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Status banner (Paid/Unpaid/Overdue) | Invoice status | Q:`invoices.getById` |
| 3 | Invoice number, date, due date | Invoice data | Included |
| 4 | Patient name + ID | Patient data | Q:`patients.getById` |
| 5 | Patient name press | Nav → PatientProfile | Nav |
| 6 | Line items table (description, qty, price, total) | Invoice data | Included |
| 7 | Subtotal, tax, total | Invoice data | Included |
| 8 | Payment history list | Payments array | Included |
| 9 | Notes | Invoice notes | Included |
| 10 | "Record Payment" button | Record payment | M:`invoices.recordPayment` |
| 11 | "Send to Patient" button | Send notification | A:`invoices.sendToPatient` |
| 12 | "Mark as Paid" button | Update to paid | M:`invoices.markPaid` |
| 13 | "Void Invoice" button | Void | M:`invoices.void` |
| 14 | "Print / Export" button | Generate PDF | A:`invoices.generatePdf` |

### CreateInvoiceScreen (modal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Close button | Dismiss modal | Nav |
| 2 | Patient search input | Search patients | Q:`patients.search` |
| 3 | Patient result item press | Select patient | CS |
| 4 | Selected patient chip | Show selection | CS |
| 5 | Line item row: description input | Enter description | CS |
| 6 | Line item row: quantity input | Enter qty | CS |
| 7 | Line item row: price input | Enter price | CS |
| 8 | Line item row: calculated total | Auto-calc | CS |
| 9 | "Add Line Item" button | Add row | CS |
| 10 | Remove line item (x) | Remove row | CS |
| 11 | Running subtotal display | Auto-calc | CS |
| 12 | Running total display | Auto-calc | CS |
| 13 | Notes input | Enter notes | CS |
| 14 | "Send to Patient" toggle | Toggle | CS |
| 15 | "Save" button | Create invoice | M:`invoices.create` |

### ReportsDashboardScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | Period picker: "This Week" pill | Load week data | Q:`reportsSnapshots.getByPeriod('week')` |
| 3 | Period picker: "This Month" pill | Load month data | Q:`reportsSnapshots.getByPeriod('month')` |
| 4 | Stat card: "Total Appointments" + trend % | Report data | Included in snapshot |
| 5 | Stat card: "Revenue" + trend % | Report data | Included |
| 6 | Stat card: "Patients Seen" + trend % | Report data | Included |
| 7 | Stat card: "No-Shows" + trend % | Report data | Included |
| 8 | Revenue bar chart (7 bars) | Daily revenue | Included in snapshot |
| 9 | Appointment breakdown (type + percentage bars) | By-type data | Included in snapshot |
| 10 | Top providers table (name, appointments, revenue) | Provider rankings | Included in snapshot |

### TelehealthScreen
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Back button | Nav back | Nav |
| 2 | "UPCOMING" section | Future telehealth appointments | Q:`clinicAppointments.listTelehealth` (upcoming) |
| 3 | Upcoming card: patient name, time, status | Appointment + patient | Included (joined) |
| 4 | Upcoming card press | Nav → AppointmentDetail | Nav |
| 5 | "Start" button (active 5 min before) | Create session → Nav to TelehealthCall | M:`telehealthSessions.create` |
| 6 | "Start" disabled state | >5 min before start | CS time check |
| 7 | "Active Session" card (if active) | Currently active | Q:`telehealthSessions.getActive` |
| 8 | "PAST" section | Completed telehealth | Q:`telehealthSessions.listPast` |
| 9 | Past session card | Session data | Included |

### TelehealthCallScreen (fullScreenModal)
| # | Element | Action | Backend |
|---|---------|--------|---------|
| 1 | Patient name display | Session + patient | Q:`telehealthSessions.getById` (includes patient) |
| 2 | Call duration timer | Client-side timer | CS |
| 3 | Mock video area | Placeholder | None |
| 4 | Mute microphone button | Toggle local mic | CS (WebRTC local) |
| 5 | Camera toggle button | Toggle local camera | CS |
| 6 | End call button | End session + Nav back | M:`telehealthSessions.end` |
| 7 | Chat button | Open inline chat panel | CS toggle |
| 8 | Chat message list (if open) | Session chat messages | Q:`telehealthSessions.getById` (reactive, chatMessages field) |
| 9 | Chat send button | Send chat message | M:`telehealthSessions.sendChat` |
| 10 | Notes button | Nav → TreatmentNote (in-call) | Nav |
