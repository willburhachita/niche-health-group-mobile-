# 03 — Backend Architecture (Convex)

> **Role:** Senior Software Engineer (Backend)
> **Stack:** Convex (backend-as-a-service: real-time DB, functions, file storage)

---

## 3.1 Collections Schema

### `users`
Represents all human accounts: staff and patients.

```typescript
// convex/schema.ts
users: defineTable({
  privyUserId:    v.string(),          // Privy identity ID (external)
  email:          v.optional(v.string()),
  phone:          v.optional(v.string()),
  displayName:    v.string(),
  firstName:      v.string(),
  lastName:       v.string(),
  avatarUrl:      v.optional(v.string()),
  initials:       v.string(),          // computed: "SM" for Sarah Mbewe
  userType:       v.union(
                    v.literal('staff'),
                    v.literal('patient')
                  ),
  staffRole:      v.optional(v.union(
                    v.literal('doctor'),
                    v.literal('nurse'),
                    v.literal('admin'),
                    v.literal('pharmacist')
                  )),
  department:     v.optional(v.string()),   // "Dialysis", "Pharmacy", etc.
  isActive:       v.boolean(),              // false = suspended
  onlineStatus:   v.union(
                    v.literal('online'),
                    v.literal('away'),
                    v.literal('dnd'),
                    v.literal('offline')
                  ),
  lastSeenAt:     v.optional(v.number()),   // Unix timestamp
  customStatus:   v.optional(v.string()),
  joinedAt:       v.number(),
})
.index('by_privy_id', ['privyUserId'])
.index('by_user_type', ['userType'])
.index('by_department', ['department'])
```

**Example document:**
```json
{
  "_id": "jd7a9x2...",
  "privyUserId": "did:privy:abc123",
  "email": "sarah.mbewe@nichehealthcare.co.uk",
  "phone": "+447700900890",
  "displayName": "Dr. Sarah Mbewe",
  "firstName": "Sarah",
  "lastName": "Mbewe",
  "initials": "SM",
  "userType": "staff",
  "staffRole": "doctor",
  "department": "Dialysis",
  "isActive": true,
  "onlineStatus": "online",
  "joinedAt": 1735689600000
}
```

---

### `devices`
Tracks every device that has ever logged in. Core of the device trust system.

```typescript
devices: defineTable({
  userId:         v.id('users'),
  deviceId:       v.string(),          // SHA-256 fingerprint (see auth doc)
  deviceName:     v.string(),          // "iPhone 15 Pro"
  platform:       v.string(),          // "iOS", "Android", "Web", "Desktop"
  appVersion:     v.optional(v.string()),
  ipAddress:      v.optional(v.string()),
  userAgent:      v.optional(v.string()),
  trustStatus:    v.union(
                    v.literal('trusted'),
                    v.literal('pending'),
                    v.literal('revoked')
                  ),
  approvedBy:     v.optional(v.id('users')),  // admin userId
  approvedAt:     v.optional(v.number()),
  revokedAt:      v.optional(v.number()),
  lastActiveAt:   v.number(),
  firstSeenAt:    v.number(),
})
.index('by_user', ['userId'])
.index('by_device_id', ['deviceId'])
.index('by_trust_status', ['trustStatus'])
```

---

### `conversations`
A conversation is the container for direct messages (1:1 or group).

```typescript
conversations: defineTable({
  type:           v.union(v.literal('direct'), v.literal('group')),
  members:        v.array(v.id('users')),
  name:           v.optional(v.string()),     // group name only
  avatarUrl:      v.optional(v.string()),     // group avatar only
  createdBy:      v.id('users'),
  createdAt:      v.number(),
  lastMessageId:  v.optional(v.id('messages')),
  lastMessageAt:  v.optional(v.number()),
  isArchived:     v.boolean(),
})
.index('by_members', ['members'])
.index('by_last_message', ['lastMessageAt'])
```

---

### `messages`
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
  deletedAt:      v.optional(v.number()),   // soft delete
  readBy:         v.array(v.id('users')),   // userId array
  sentAt:         v.number(),
})
.index('by_conversation', ['conversationId', 'sentAt'])
.index('by_channel', ['channelId', 'sentAt'])
.index('by_sender', ['senderId'])
.index('pinned_in_channel', ['channelId', 'isPinned'])
```

---

### `channels`
Department or topic-based broadcast channels (like Slack channels).

```typescript
channels: defineTable({
  name:           v.string(),            // "dialysis-team" (no spaces, lowercase)
  displayName:    v.string(),            // "Dialysis Team"
  description:    v.optional(v.string()),
  type:           v.union(v.literal('public'), v.literal('private')),
  members:        v.array(v.id('users')),
  admins:         v.array(v.id('users')), // can pin, edit, delete
  createdBy:      v.id('users'),
  createdAt:      v.number(),
  isArchived:     v.boolean(),
  lastMessageAt:  v.optional(v.number()),
})
.index('by_type', ['type'])
.index('by_name', ['name'])
```

---

### `notifications`
In-app notification feed for all users.

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
                  v.literal('security_alert')
                ),
  title:        v.string(),
  body:         v.string(),
  isRead:       v.boolean(),
  referenceId:  v.optional(v.string()),    // messageId, conversationId, etc.
  referenceType: v.optional(v.string()),   // "message" | "conversation" | "event"
  createdAt:    v.number(),
})
.index('by_recipient', ['recipientId', 'isRead'])
.index('by_recipient_date', ['recipientId', 'createdAt'])
```

---

### `appointments`
Scheduled events, shifts, and training sessions.

```typescript
appointments: defineTable({
  title:        v.string(),
  type:         v.union(
                  v.literal('shift'),
                  v.literal('training'),
                  v.literal('meeting'),
                  v.literal('other')
                ),
  description:  v.optional(v.string()),
  location:     v.optional(v.string()),
  startTime:    v.number(),               // Unix timestamp
  endTime:      v.number(),
  attendees:    v.array(v.id('users')),
  organizer:    v.id('users'),
  isAllDay:     v.boolean(),
  reminderSent: v.boolean(),
  acknowledgedBy: v.array(v.id('users')),
  createdAt:    v.number(),
  updatedAt:    v.number(),
})
.index('by_organizer', ['organizer'])
.index('by_start_time', ['startTime'])
.index('by_attendee', ['attendees'])
```

---

### `adminLogs`
Immutable audit trail. Every admin action is written here.

```typescript
adminLogs: defineTable({
  actorId:      v.id('users'),         // who did it
  action:       v.string(),            // e.g. "DEVICE_APPROVED"
  targetType:   v.string(),            // "device" | "user" | "channel" | "message"
  targetId:     v.string(),            // ID of affected resource
  metadata:     v.optional(v.any()),   // additional JSON context
  ipAddress:    v.optional(v.string()),
  timestamp:    v.number(),
})
.index('by_actor', ['actorId'])
.index('by_action', ['action'])
.index('by_timestamp', ['timestamp'])
```

---

## 3.2 Queries

### `getViewer` (auth helper — used on every request)
```typescript
// convex/users.ts
export const getViewer = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query('users')
      .withIndex('by_privy_id', q => q.eq('privyUserId', identity.subject))
      .first();
    return user;
  },
});
```

### `listConversations`
```typescript
export const listConversations = query({
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);          // throws if unauthenticated
    return await ctx.db
      .query('conversations')
      .withIndex('by_members')
      .filter(q => q.includes(q.field('members'), viewer._id))
      .order('desc')
      .collect();
  },
});
```

### `listMessages` (paginated, real-time)
```typescript
export const listMessages = query({
  args: { conversationId: v.id('conversations'), cursor: v.optional(v.string()) },
  handler: async (ctx, { conversationId, cursor }) => {
    const viewer = await getViewerOrThrow(ctx);
    // Authorization: viewer must be a member of this conversation
    const convo = await ctx.db.get(conversationId);
    if (!convo.members.includes(viewer._id)) throw new Error('Forbidden');
    return await ctx.db
      .query('messages')
      .withIndex('by_conversation', q => q.eq('conversationId', conversationId))
      .order('asc')
      .paginate({ cursor, numItems: 50 });
  },
});
```

### `getPendingDevices` (admin only)
```typescript
export const getPendingDevices = query({
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    if (viewer.staffRole !== 'admin') throw new Error('Forbidden');
    return await ctx.db
      .query('devices')
      .withIndex('by_trust_status', q => q.eq('trustStatus', 'pending'))
      .collect();
  },
});
```

---

## 3.3 Mutations

### `sendMessage`
```typescript
export const sendMessage = mutation({
  args: {
    conversationId: v.optional(v.id('conversations')),
    channelId: v.optional(v.id('channels')),
    content: v.string(),
    messageType: v.string(),
  },
  handler: async (ctx, args) => {
    const viewer = await getViewerOrThrow(ctx);
    const msgId = await ctx.db.insert('messages', {
      ...args,
      senderId: viewer._id,
      isPinned: false,
      isEdited: false,
      readBy: [viewer._id],
      sentAt: Date.now(),
    });
    // Update conversation's lastMessageAt
    if (args.conversationId) {
      await ctx.db.patch(args.conversationId, {
        lastMessageId: msgId,
        lastMessageAt: Date.now(),
      });
    }
    return msgId;
  },
});
```

### `approveDevice`
```typescript
export const approveDevice = mutation({
  args: { deviceId: v.id('devices') },
  handler: async (ctx, { deviceId }) => {
    const viewer = await getViewerOrThrow(ctx);
    if (viewer.staffRole !== 'admin') throw new Error('Forbidden');
    await ctx.db.patch(deviceId, {
      trustStatus: 'trusted',
      approvedBy: viewer._id,
      approvedAt: Date.now(),
    });
    const device = await ctx.db.get(deviceId);
    // Log the action
    await ctx.db.insert('adminLogs', {
      actorId: viewer._id,
      action: 'DEVICE_APPROVED',
      targetType: 'device',
      targetId: deviceId,
      timestamp: Date.now(),
    });
    // Notify the device owner
    await ctx.db.insert('notifications', {
      recipientId: device.userId,
      type: 'device_approved',
      title: 'Device Approved',
      body: `Your ${device.deviceName} has been approved. You can now access the full app.`,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});
```

---

## 3.4 Real-Time Subscriptions

Convex queries are **automatically reactive** — the UI re-renders when underlying data changes. No WebSocket setup required beyond using `useQuery`.

### Mobile (React Native)
```javascript
// In ChatScreen.js
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

const messages = useQuery(api.messages.listMessages, { conversationId });
// messages auto-updates when any message is inserted/edited/deleted
```

### Key real-time surfaces

| Surface | Convex Query | Auto-updates on |
|---------|-------------|-----------------|
| Conversation list | `listConversations` | New message, read receipt |
| Chat thread | `listMessages` | Send, edit, delete |
| Channel thread | `listChannelMessages` | Send, pin |
| Notification badge | `getUnreadCount` | New notification |
| Device approvals (admin) | `getPendingDevices` | New device login |
| Online status | `getUserStatus` | Status change |
