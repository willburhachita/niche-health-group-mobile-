# Backend Plan — Part 1: Complete Convex Schema

> 21 collections. Every field, index, and data source documented.

---

## 1.1 `users`

Represents all human accounts: staff AND patients.

```typescript
users: defineTable({
  // Identity
  privyUserId:     v.optional(v.string()),
  email:           v.optional(v.string()),
  phone:           v.optional(v.string()),
  displayName:     v.string(),
  firstName:       v.string(),
  lastName:        v.string(),
  avatarUrl:       v.optional(v.string()),
  initials:        v.string(),
  bio:             v.optional(v.string()),

  // Role & org
  userType:        v.union(v.literal('staff'), v.literal('patient')),
  staffRole:       v.optional(v.union(
                     v.literal('doctor'),
                     v.literal('nurse'),
                     v.literal('admin'),
                     v.literal('pharmacist')
                   )),
  department:      v.optional(v.string()),

  // Status
  isActive:        v.boolean(),
  onlineStatus:    v.union(
                     v.literal('online'),
                     v.literal('away'),
                     v.literal('dnd'),
                     v.literal('offline')
                   ),
  lastSeenAt:      v.optional(v.number()),
  customStatus:    v.optional(v.string()),

  // Patient-specific (from 05-patient-comms.md)
  assignedDoctorId:   v.optional(v.id('users')),
  patientRef:         v.optional(v.string()),
  accessToken:        v.optional(v.string()),
  accessTokenExpiry:  v.optional(v.number()),

  // Notification preferences
  notificationPreferences: v.optional(v.object({
    directMessages:    v.boolean(),
    groupMessages:     v.boolean(),
    channelMessages:   v.boolean(),
    mentionsOnly:      v.boolean(),
    announcements:     v.boolean(),
    scheduleReminders: v.boolean(),
    quietHoursEnabled: v.boolean(),
    quietHoursStart:   v.optional(v.string()),
    quietHoursEnd:     v.optional(v.string()),
  })),

  // Timestamps
  joinedAt:        v.number(),
})
.index('by_privy_id', ['privyUserId'])
.index('by_user_type', ['userType'])
.index('by_department', ['department'])
.index('by_staff_role', ['staffRole'])
.index('by_access_token', ['accessToken'])
```

**Source:** `mockUsers.js` (7 staff) + `05-patient-comms.md` (patient fields)

---

## 1.2 `devices`

Device trust system for authentication.

```typescript
devices: defineTable({
  userId:         v.id('users'),
  deviceId:       v.string(),
  deviceName:     v.string(),
  platform:       v.string(),
  appVersion:     v.optional(v.string()),
  ipAddress:      v.optional(v.string()),
  userAgent:      v.optional(v.string()),
  trustStatus:    v.union(
                    v.literal('trusted'),
                    v.literal('pending'),
                    v.literal('revoked')
                  ),
  approvedBy:     v.optional(v.id('users')),
  approvedAt:     v.optional(v.number()),
  revokedAt:      v.optional(v.number()),
  pushToken:      v.optional(v.string()),
  isCurrentDevice: v.optional(v.boolean()),
  lastActiveAt:   v.number(),
  firstSeenAt:    v.number(),
})
.index('by_user', ['userId'])
.index('by_device_id', ['deviceId'])
.index('by_trust_status', ['trustStatus'])
```

**Source:** `mockAnnouncements.js` > `mockDevices` (3), `04-auth.md`

---

## 1.3 `conversations`

Container for direct messages (1:1 or group).

```typescript
conversations: defineTable({
  type:                    v.union(v.literal('direct'), v.literal('group')),
  members:                 v.array(v.id('users')),
  name:                    v.optional(v.string()),
  avatarUrl:               v.optional(v.string()),
  createdBy:               v.id('users'),
  createdAt:               v.number(),
  lastMessageId:           v.optional(v.id('messages')),
  lastMessageAt:           v.optional(v.number()),
  lastMessage:             v.optional(v.string()),
  lastMessageBy:           v.optional(v.id('users')),
  isArchived:              v.boolean(),
  isPatientConversation:   v.optional(v.boolean()),
})
.index('by_last_message', ['lastMessageAt'])
.index('by_patient_flag', ['isPatientConversation'])
```

**Source:** `mockConversations.js` (6 conversations)

---

## 1.4 `conversationReadStatus`

Per-user read tracking. Replaces the `unreadCount` field on conversation docs with a properly normalized structure.

```typescript
conversationReadStatus: defineTable({
  conversationId:  v.id('conversations'),
  userId:          v.id('users'),
  lastReadAt:      v.number(),
  unreadCount:     v.number(),
})
.index('by_user', ['userId'])
.index('by_conversation_user', ['conversationId', 'userId'])
```

---

## 1.5 `messages`

Individual messages within conversations or channels.

```typescript
messages: defineTable({
  conversationId: v.optional(v.id('conversations')),
  channelId:      v.optional(v.id('channels')),
  senderId:       v.id('users'),
  content:        v.string(),
  messageType:    v.union(
                    v.literal('text'),
                    v.literal('image'),
                    v.literal('file'),
                    v.literal('system')
                  ),
  fileUrl:        v.optional(v.string()),
  fileName:       v.optional(v.string()),
  fileSize:       v.optional(v.number()),
  isPinned:       v.boolean(),
  isEdited:       v.boolean(),
  editedAt:       v.optional(v.number()),
  deletedAt:      v.optional(v.number()),
  readBy:         v.array(v.id('users')),
  sentAt:         v.number(),
})
.index('by_conversation', ['conversationId', 'sentAt'])
.index('by_channel', ['channelId', 'sentAt'])
.index('by_sender', ['senderId'])
.index('pinned_in_channel', ['channelId', 'isPinned'])
```

**Source:** `mockMessages.js` (25+ messages across 4 conversations), `mockChannels.js` > `mockChannelMessages`

---

## 1.6 `channels`

Department or topic-based channels.

```typescript
channels: defineTable({
  name:           v.string(),
  displayName:    v.string(),
  description:    v.optional(v.string()),
  type:           v.union(v.literal('public'), v.literal('private')),
  members:        v.array(v.id('users')),
  admins:         v.array(v.id('users')),
  createdBy:      v.id('users'),
  createdAt:      v.number(),
  isArchived:     v.boolean(),
  memberCount:    v.number(),
  lastMessageAt:  v.optional(v.number()),
})
.index('by_type', ['type'])
.index('by_name', ['name'])
```

**Source:** `mockChannels.js` (7 channels + 3 discoverable)

---

## 1.7 `channelStarred`

Per-user channel starring.

```typescript
channelStarred: defineTable({
  channelId:  v.id('channels'),
  userId:     v.id('users'),
})
.index('by_user', ['userId'])
.index('by_channel_user', ['channelId', 'userId'])
```

---

## 1.8 `channelReadStatus`

Per-user read tracking for channels.

```typescript
channelReadStatus: defineTable({
  channelId:      v.id('channels'),
  userId:         v.id('users'),
  lastReadAt:     v.number(),
  unreadCount:    v.number(),
})
.index('by_user', ['userId'])
.index('by_channel_user', ['channelId', 'userId'])
```

---

## 1.9 `notifications`

In-app notification feed.

```typescript
notifications: defineTable({
  recipientId:  v.id('users'),
  type:         v.union(
                  v.literal('new_message'),
                  v.literal('mention'),
                  v.literal('channel_message'),
                  v.literal('announcement'),
                  v.literal('schedule_reminder'),
                  v.literal('device_approval_request'),
                  v.literal('device_approved'),
                  v.literal('security_alert'),
                  v.literal('appointment_reminder'),
                  v.literal('invoice_overdue'),
                  v.literal('treatment_note_pending')
                ),
  title:        v.string(),
  body:         v.string(),
  icon:         v.optional(v.string()),
  isRead:       v.boolean(),
  referenceId:  v.optional(v.string()),
  referenceType: v.optional(v.string()),
  createdAt:    v.number(),
})
.index('by_recipient', ['recipientId', 'isRead'])
.index('by_recipient_date', ['recipientId', 'createdAt'])
```

**Source:** `mockNotifications.js` (6 notifications), `06-notifications.md`

---

## 1.10 `appointments` (Staff Schedule)

Staff schedule events: shifts, meetings, training.

```typescript
appointments: defineTable({
  title:          v.string(),
  type:           v.union(
                    v.literal('shift'),
                    v.literal('training'),
                    v.literal('meeting'),
                    v.literal('other')
                  ),
  description:    v.optional(v.string()),
  location:       v.optional(v.string()),
  startTime:      v.number(),
  endTime:        v.number(),
  attendees:      v.array(v.id('users')),
  organizer:      v.id('users'),
  isAllDay:       v.boolean(),
  reminderSent:   v.boolean(),
  acknowledgedBy: v.array(v.id('users')),
  createdAt:      v.number(),
  updatedAt:      v.number(),
})
.index('by_organizer', ['organizer'])
.index('by_start_time', ['startTime'])
```

**Source:** `mockSchedule.js` (7 events)

---

## 1.11 `trainingSessions`

Training-specific schedule data.

```typescript
trainingSessions: defineTable({
  title:          v.string(),
  description:    v.optional(v.string()),
  instructor:     v.string(),
  date:           v.number(),
  timeLabel:      v.string(),
  location:       v.optional(v.string()),
  registeredUsers: v.array(v.id('users')),
  maxCapacity:    v.optional(v.number()),
  createdAt:      v.number(),
})
.index('by_date', ['date'])
```

**Source:** `mockSchedule.js` > `mockTrainingSessions` (3)

---

## 1.12 `announcements`

Organization-wide announcements.

```typescript
announcements: defineTable({
  title:          v.string(),
  body:           v.string(),
  authorId:       v.id('users'),
  attachments:    v.array(v.object({
                    name: v.string(),
                    size: v.number(),
                    type: v.string(),
                    storageId: v.optional(v.id('_storage')),
                    url: v.optional(v.string()),
                  })),
  acknowledgedBy: v.array(v.id('users')),
  totalStaff:     v.number(),
  isPinned:       v.optional(v.boolean()),
  createdAt:      v.number(),
})
.index('by_created', ['createdAt'])
```

**Source:** `mockAnnouncements.js` (2 announcements)

---

## 1.13 `departments`

Organization departments.

```typescript
departments: defineTable({
  name:           v.string(),
  description:    v.optional(v.string()),
  leadId:         v.id('users'),
  channelId:      v.optional(v.id('channels')),
  memberCount:    v.number(),
  createdAt:      v.number(),
})
.index('by_name', ['name'])
```

**Source:** `mockAnnouncements.js` > `mockDepartments` (5)

---

## 1.14 `files`

Shared organizational files and folders.

```typescript
files: defineTable({
  name:           v.string(),
  type:           v.string(),
  size:           v.optional(v.number()),
  storageId:      v.optional(v.id('_storage')),
  url:            v.optional(v.string()),
  parentFolderId: v.optional(v.id('files')),
  itemCount:      v.optional(v.number()),
  uploadedBy:     v.optional(v.id('users')),
  uploadedAt:     v.optional(v.number()),
  createdAt:      v.number(),
})
.index('by_parent', ['parentFolderId'])
.index('by_uploader', ['uploadedBy'])
```

**Source:** `mockAnnouncements.js` > `mockFiles` (3 folders + 3 files)

---

## 1.15 `patients`

Clinical patient records (distinct from user accounts).

```typescript
patients: defineTable({
  patientId:          v.string(),
  firstName:          v.string(),
  lastName:           v.string(),
  displayName:        v.string(),
  initials:           v.string(),
  dateOfBirth:        v.string(),
  age:                v.number(),
  gender:             v.string(),
  phone:              v.string(),
  email:              v.optional(v.string()),
  avatarUrl:          v.optional(v.string()),

  // Medical
  allergies:          v.array(v.string()),
  conditions:         v.array(v.string()),
  medications:        v.array(v.string()),
  bloodType:          v.optional(v.string()),

  // Insurance
  insuranceProvider:  v.optional(v.string()),
  policyNumber:       v.optional(v.string()),

  // Emergency
  emergencyContact:   v.optional(v.object({
                        name: v.string(),
                        phone: v.string(),
                        relationship: v.string(),
                      })),

  // Status
  status:             v.union(
                        v.literal('active'),
                        v.literal('inactive'),
                        v.literal('discharged')
                      ),
  department:         v.optional(v.string()),
  lastVisit:          v.optional(v.number()),
  registeredAt:       v.number(),
})
.index('by_patient_id', ['patientId'])
.index('by_status', ['status'])
.index('by_department', ['department'])
.index('by_last_visit', ['lastVisit'])
.searchIndex('search_patients', {
  searchField: 'displayName',
  filterFields: ['status', 'department'],
})
```

**Source:** `mockPatients.js` (8 patients)

---

## 1.16 `clinicAppointments`

Clinical appointments (patient visits, not staff schedule).

```typescript
clinicAppointments: defineTable({
  patientId:      v.optional(v.id('patients')),
  providerId:     v.id('users'),
  type:           v.optional(v.string()),
  startTime:      v.number(),
  endTime:        v.number(),
  duration:       v.number(),
  location:       v.optional(v.string()),
  status:         v.union(
                    v.literal('confirmed'),
                    v.literal('pending'),
                    v.literal('cancelled'),
                    v.literal('completed'),
                    v.literal('noShow'),
                    v.literal('open')
                  ),
  notes:          v.optional(v.string()),
  isRecurring:    v.boolean(),
  reminderSent:   v.boolean(),
  smsReminderSent: v.optional(v.boolean()),
  createdAt:      v.number(),
  updatedAt:      v.number(),
})
.index('by_provider', ['providerId'])
.index('by_patient', ['patientId'])
.index('by_start_time', ['startTime'])
.index('by_status', ['status'])
.index('by_provider_date', ['providerId', 'startTime'])
```

**Source:** `mockAppointments.js` (12 appointments)

---

## 1.17 `treatmentNotes`

SOAP clinical notes.

```typescript
treatmentNotes: defineTable({
  patientId:      v.id('patients'),
  providerId:     v.id('users'),
  appointmentId:  v.optional(v.id('clinicAppointments')),
  date:           v.number(),
  template:       v.string(),
  subjective:     v.string(),
  objective:      v.string(),
  assessment:     v.string(),
  plan:           v.string(),
  vitals:         v.optional(v.object({
                    bp:          v.optional(v.string()),
                    heartRate:   v.optional(v.number()),
                    temperature: v.optional(v.number()),
                    weight:      v.optional(v.number()),
                    o2Sat:       v.optional(v.number()),
                  })),
  attachments:    v.array(v.object({
                    name: v.string(),
                    storageId: v.id('_storage'),
                    url: v.string(),
                  })),
  isPrivate:      v.boolean(),
  createdAt:      v.number(),
  updatedAt:      v.number(),
})
.index('by_patient', ['patientId'])
.index('by_provider', ['providerId'])
.index('by_date', ['date'])
.index('by_appointment', ['appointmentId'])
```

**Source:** `mockTreatmentNotes.js` (6 SOAP notes)

---

## 1.18 `invoices`

Clinical billing invoices.

```typescript
invoices: defineTable({
  invoiceNumber:  v.string(),
  patientId:      v.id('patients'),
  providerId:     v.optional(v.id('users')),
  date:           v.number(),
  dueDate:        v.number(),
  lineItems:      v.array(v.object({
                    description: v.string(),
                    quantity:    v.number(),
                    unitPrice:   v.number(),
                    total:       v.number(),
                  })),
  subtotal:       v.number(),
  tax:            v.number(),
  total:          v.number(),
  status:         v.union(
                    v.literal('unpaid'),
                    v.literal('paid'),
                    v.literal('overdue'),
                    v.literal('partial'),
                    v.literal('void')
                  ),
  payments:       v.array(v.object({
                    date:    v.number(),
                    amount:  v.number(),
                    method:  v.string(),
                  })),
  notes:          v.optional(v.string()),
  sentToPatient:  v.optional(v.boolean()),
  createdAt:      v.number(),
  updatedAt:      v.number(),
})
.index('by_patient', ['patientId'])
.index('by_status', ['status'])
.index('by_date', ['date'])
.index('by_invoice_number', ['invoiceNumber'])
```

**Source:** `mockInvoices.js` (6 invoices)

---

## 1.19 `telehealthSessions`

Telehealth call sessions.

```typescript
telehealthSessions: defineTable({
  appointmentId:  v.id('clinicAppointments'),
  patientId:      v.id('patients'),
  providerId:     v.id('users'),
  status:         v.union(
                    v.literal('scheduled'),
                    v.literal('active'),
                    v.literal('completed'),
                    v.literal('missed')
                  ),
  startedAt:      v.optional(v.number()),
  endedAt:        v.optional(v.number()),
  duration:       v.optional(v.number()),
  roomId:         v.optional(v.string()),
  chatMessages:   v.optional(v.array(v.object({
                    senderId:  v.id('users'),
                    content:   v.string(),
                    sentAt:    v.number(),
                  }))),
  createdAt:      v.number(),
})
.index('by_appointment', ['appointmentId'])
.index('by_provider', ['providerId'])
.index('by_status', ['status'])
```

---

## 1.20 `adminLogs`

Immutable audit trail.

```typescript
adminLogs: defineTable({
  actorId:      v.id('users'),
  action:       v.string(),
  targetType:   v.string(),
  targetId:     v.string(),
  metadata:     v.optional(v.any()),
  ipAddress:    v.optional(v.string()),
  timestamp:    v.number(),
})
.index('by_actor', ['actorId'])
.index('by_action', ['action'])
.index('by_timestamp', ['timestamp'])
```

---

## 1.21 `reportsSnapshots`

Cached analytics data generated by cron, consumed by ReportsDashboard.

```typescript
reportsSnapshots: defineTable({
  period:             v.union(v.literal('week'), v.literal('month')),
  generatedAt:        v.number(),
  totalAppointments:  v.number(),
  appointmentsTrend:  v.number(),
  totalRevenue:       v.number(),
  revenueTrend:       v.number(),
  patientsSeen:       v.number(),
  patientsTrend:      v.number(),
  noShows:            v.number(),
  noShowsTrend:       v.number(),
  appointmentsByType: v.array(v.object({
                        type: v.string(),
                        count: v.number(),
                        percentage: v.number(),
                      })),
  topProviders:       v.array(v.object({
                        providerId: v.id('users'),
                        name: v.string(),
                        appointments: v.number(),
                        revenue: v.number(),
                      })),
  dailyRevenue:       v.array(v.object({
                        day: v.string(),
                        amount: v.number(),
                        date: v.number(),
                      })),
  revenueByMethod:    v.array(v.object({
                        method: v.string(),
                        amount: v.number(),
                        percentage: v.number(),
                      })),
})
.index('by_period', ['period'])
.index('by_generated', ['generatedAt'])
```

**Source:** `mockReportsData.js` (weekly/monthly stats, revenue, breakdowns)
