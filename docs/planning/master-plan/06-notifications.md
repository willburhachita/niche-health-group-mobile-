# 06 — Notification System

---

## 6.1 Notification Architecture

All notifications flow through the `notifications` Convex collection. Three delivery channels:

| Channel | Method | Used For |
|---------|--------|---------|
| In-app badge | Convex real-time query | All notification types |
| In-app feed | `NotificationsScreen` (S-53) | All notification types |
| Push (mobile) | Expo Push Notifications | Messages, mentions, alerts |
| SMS | Twilio (Convex action) | Patient messages only |

---

## 6.2 In-App Notification Badge

The Messages tab badge and notification bell count are driven by a live query.

```typescript
// convex/notifications.ts
export const getUnreadCount = query({
  handler: async (ctx) => {
    const viewer = await getViewerOrThrow(ctx);
    const count = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', q =>
        q.eq('recipientId', viewer._id).eq('isRead', false)
      )
      .collect();
    return count.length;
  },
});
```

```javascript
// Mobile: useUnreadCounts.js
export function useUnreadCounts() {
  const count = useQuery(api.notifications.getUnreadCount);
  return count ?? 0;
}

// TabNavigator.js — badge on Messages tab
tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
```

---

## 6.3 Push Notifications (Expo)

### Setup
```bash
npx expo install expo-notifications expo-device
```

### Token Registration
```javascript
// src/hooks/usePushNotifications.js
import * as Notifications from 'expo-notifications';
import { useMutation } from 'convex/react';

export async function registerPushToken() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return null;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
```

### Store Push Token in Convex

Add `pushToken` field to the `devices` collection:
```typescript
pushToken: v.optional(v.string()),
```

After device registration:
```typescript
export const savePushToken = mutation({
  args: { deviceId: v.string(), pushToken: v.string() },
  handler: async (ctx, { deviceId, pushToken }) => {
    const device = await ctx.db
      .query('devices')
      .withIndex('by_device_id', q => q.eq('deviceId', deviceId))
      .first();
    if (device) await ctx.db.patch(device._id, { pushToken });
  },
});
```

### Sending Push Notifications (Convex Action)
```typescript
export const sendPushNotification = action({
  args: {
    recipientId: v.id('users'),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const devices = await ctx.runQuery(api.devices.getTrustedDevices, {
      userId: args.recipientId,
    });
    const tokens = devices
      .map(d => d.pushToken)
      .filter(Boolean);

    if (tokens.length === 0) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens.map(token => ({
        to: token,
        title: args.title,
        body: args.body,
        data: args.data,
        sound: 'default',
        badge: 1,
        channelId: 'default',
      }))),
    });
  },
});
```

---

## 6.4 Notification Types & Triggers

### Staff Notifications

| Type | Trigger | Title | Body |
|------|---------|-------|------|
| `new_message` | Message received in DM | "New message" | "{Sender}: {preview}" |
| `mention` | `@name` found in channel message | "{name} mentioned you" | "in #{channel}: {preview}" |
| `channel_message` | New message in joined channel | "#{channel}" | "{Sender}: {preview}" |
| `announcement` | Admin sends announcement | "Announcement" | "{title}" |
| `schedule_reminder` | 30 min before event | "Upcoming: {event}" | "{time} - {location}" |
| `device_approval_request` | New device login detected | "New Device Login" | "{user} on {device}" |
| `device_approved` | Admin approves device | "Device Approved" | "{device} is now trusted" |
| `security_alert` | Revocation or suspicious activity | "Security Alert" | Custom message |

### Patient Notifications

| Type | Trigger | Delivery |
|------|---------|---------|
| Doctor reply | New message from doctor | SMS |

---

## 6.5 Notification Creation Pattern

Every mutation that should notify does so in a consistent pattern:

```typescript
// Helper function: createNotification
async function createNotification(ctx, {
  recipientId, type, title, body, referenceId, referenceType
}) {
  await ctx.db.insert('notifications', {
    recipientId,
    type,
    title,
    body,
    isRead: false,
    referenceId,
    referenceType,
    createdAt: Date.now(),
  });
  // Also send push
  await ctx.scheduler.runAfter(0, api.notifications.sendPushNotification, {
    recipientId, title, body,
  });
}

// Usage in sendMessage mutation:
// After inserting message, notify all conversation members except sender
for (const memberId of conversation.members) {
  if (memberId === viewer._id) continue;
  await createNotification(ctx, {
    recipientId: memberId,
    type: 'new_message',
    title: viewer.displayName,
    body: content.substring(0, 80),
    referenceId: conversationId,
    referenceType: 'conversation',
  });
}
```

---

## 6.6 Schedule Reminders

Implemented as a Convex scheduled action that runs every 15 minutes:

```typescript
// convex/crons.ts
import { cronJobs } from 'convex/server';
const crons = cronJobs();

crons.interval('send schedule reminders', { minutes: 15 }, api.schedule.sendUpcomingReminders);

export default crons;

// convex/schedule.ts
export const sendUpcomingReminders = action({
  handler: async (ctx) => {
    const now = Date.now();
    const in30min = now + (30 * 60 * 1000);
    const window = 15 * 60 * 1000; // 15-min window

    const upcoming = await ctx.runQuery(api.appointments.getUpcoming, {
      from: in30min - window / 2,
      to: in30min + window / 2,
    });

    for (const event of upcoming) {
      if (event.reminderSent) continue;
      for (const attendeeId of event.attendees) {
        await createNotification(ctx, {
          recipientId: attendeeId,
          type: 'schedule_reminder',
          title: `Upcoming: ${event.title}`,
          body: `Starting in 30 minutes at ${event.location || 'TBC'}`,
          referenceId: event._id,
          referenceType: 'event',
        });
      }
      await ctx.runMutation(api.appointments.markReminderSent, { appointmentId: event._id });
    }
  },
});
```

---

## 6.7 Notification Settings (User-Level)

Users can mute specific notification types. Store preferences in a separate collection or as a field on `users`:

```typescript
notificationPreferences: v.optional(v.object({
  directMessages:    v.boolean(),
  groupMessages:     v.boolean(),
  channelMessages:   v.boolean(),
  mentionsOnly:      v.boolean(),
  announcements:     v.boolean(),
  scheduleReminders: v.boolean(),
  quietHoursEnabled: v.boolean(),
  quietHoursStart:   v.optional(v.string()),   // "22:00"
  quietHoursEnd:     v.optional(v.string()),   // "07:00"
}))
```

Before sending a notification, the `createNotification` helper checks user preferences and quiet hours.
