# 04 — Authentication Implementation

> **Stack:** Privy (OTP identity) + Convex (device trust enforcement)

---

## 4.1 Authentication Flow Overview

```
User opens app
│
├── Returning user + trusted device
│   └── Privy auto-silently authenticates
│       └── Convex validates device trust → GRANT access
│
├── Returning user + new device
│   └── OTP required
│       └── Convex detects unknown deviceId → STATUS: pending
│           └── Admin notified → User sees S-05 (Device Pending)
│               └── Admin approves → User granted access
│
└── New user (first time)
    └── OTP required
        └── Convex creates user record + device record (trusted on first device)
            └── Access granted
```

---

## 4.2 Privy Integration

### Setup
```bash
npm install @privy-io/expo
```

### `App.js` — Wrap app with PrivyProvider
```javascript
import { PrivyProvider } from '@privy-io/expo';

export default function App() {
  return (
    <PrivyProvider
      appId={process.env.EXPO_PUBLIC_PRIVY_APP_ID}
      config={{
        loginMethods: ['sms', 'email'],
        appearance: {
          theme: 'light',
          accentColor: '#3B4B8A',   // NHL Navy Blue
        },
      }}
    >
      <ConvexProviderWithPrivy>
        <RootNavigator />
      </ConvexProviderWithPrivy>
    </PrivyProvider>
  );
}
```

### `ConvexProviderWithPrivy`
Bridges Privy's JWT to Convex's auth system:
```javascript
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { usePrivy } from '@privy-io/expo';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL);

export function ConvexProviderWithPrivy({ children }) {
  const { getAccessToken } = usePrivy();
  return (
    <ConvexProviderWithAuth
      client={convex}
      useAuth={() => ({
        isLoading: false,
        isAuthenticated: true,
        fetchAccessToken: async ({ forceRefreshToken }) => {
          return await getAccessToken({ refresh: forceRefreshToken });
        },
      })}
    >
      {children}
    </ConvexProviderWithPrivy>
  );
}
```

---

## 4.3 OTP Login Flow (S-03 → S-04)

### LoginScreen.js
```javascript
import { useLoginWithSms, useLoginWithEmail } from '@privy-io/expo';

const { sendCode } = useLoginWithSms();

// On "Send Code" press:
await sendCode({ phoneNumber: '+447700900890' });
// Navigate to S-04
```

### OTPScreen.js
```javascript
import { useLoginWithSms } from '@privy-io/expo';

const { loginWithCode } = useLoginWithSms();

// On 6-digit code complete:
const result = await loginWithCode({ code: '123456' });
// Privy sets authenticated state
// Next: device trust check (see 4.4)
```

---

## 4.4 Device Fingerprinting

Every device gets a deterministic ID derived from stable device attributes. This is computed on the client and sent to Convex.

### Device ID Strategy
```javascript
// src/utils/deviceFingerprint.js
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

export async function getDeviceFingerprint() {
  const raw = [
    Device.osName,
    Device.osVersion,
    Device.modelName,
    Device.deviceName,
    Device.brand,
  ].join('|');
  // SHA-256 hash for privacy — never expose raw identifiers
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    raw
  );
  return hash;
}

export function getDeviceInfo() {
  return {
    deviceName: Device.deviceName || Device.modelName || 'Unknown Device',
    platform: Device.osName || 'Unknown',
  };
}
```

**Required packages:**
```bash
npx expo install expo-device expo-crypto
```

---

## 4.5 Device Trust Validation (Convex)

After OTP success, the app calls a Convex mutation that:
1. Looks up the user by Privy ID
2. Checks if the deviceId is already trusted
3. If yes → grant access
4. If no → create pending record + notify admin

### `convex/auth.ts`
```typescript
export const registerOrValidateDevice = mutation({
  args: {
    deviceId:   v.string(),
    deviceName: v.string(),
    platform:   v.string(),
    appVersion: v.optional(v.string()),
    ipAddress:  v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');

    // Get or create user record
    let user = await ctx.db
      .query('users')
      .withIndex('by_privy_id', q => q.eq('privyUserId', identity.subject))
      .first();

    if (!user) {
      // First-ever login — create user record
      const userId = await ctx.db.insert('users', {
        privyUserId:  identity.subject,
        email:        identity.email,
        phone:        identity.phoneNumber,
        displayName:  identity.name || identity.email || identity.phoneNumber || 'Staff Member',
        firstName:    '',
        lastName:     '',
        initials:     'NH',
        userType:     'staff',
        isActive:     true,
        onlineStatus: 'online',
        joinedAt:     Date.now(),
      });
      user = await ctx.db.get(userId);
    }

    // Check if device already exists for this user
    const existingDevice = await ctx.db
      .query('devices')
      .withIndex('by_device_id', q => q.eq('deviceId', args.deviceId))
      .filter(q => q.eq(q.field('userId'), user!._id))
      .first();

    if (existingDevice) {
      // Update last active
      await ctx.db.patch(existingDevice._id, { lastActiveAt: Date.now() });
      // Return trust status
      return { status: existingDevice.trustStatus, userId: user!._id };
    }

    // New device — create as pending (or trusted if first device)
    const isFirstDevice = (await ctx.db
      .query('devices')
      .withIndex('by_user', q => q.eq('userId', user!._id))
      .collect()).length === 0;

    const trustStatus = isFirstDevice ? 'trusted' : 'pending';

    await ctx.db.insert('devices', {
      userId:       user!._id,
      deviceId:     args.deviceId,
      deviceName:   args.deviceName,
      platform:     args.platform,
      appVersion:   args.appVersion,
      ipAddress:    args.ipAddress,
      trustStatus,
      lastActiveAt: Date.now(),
      firstSeenAt:  Date.now(),
    });

    // If new unrecognized device, alert all admins
    if (!isFirstDevice) {
      await notifyAdminsOfNewDevice(ctx, user!, args.deviceName, args.platform);
    }

    return { status: trustStatus, userId: user!._id };
  },
});

async function notifyAdminsOfNewDevice(ctx, user, deviceName, platform) {
  const admins = await ctx.db
    .query('users')
    .withIndex('by_user_type', q => q.eq('userType', 'staff'))
    .filter(q => q.eq(q.field('staffRole'), 'admin'))
    .collect();

  for (const admin of admins) {
    await ctx.db.insert('notifications', {
      recipientId: admin._id,
      type: 'device_approval_request',
      title: 'New Device Login',
      body: `${user.displayName} logged in from a new ${platform} device: ${deviceName}. Review and approve.`,
      isRead: false,
      referenceId: user._id,
      referenceType: 'user',
      createdAt: Date.now(),
    });
  }
}
```

---

## 4.6 Client-Side Device Trust Check

After calling `registerOrValidateDevice`, the client reads the returned status:

```javascript
// src/hooks/useAuth.js
import { useMutation } from 'convex/react';
import { usePrivy } from '@privy-io/expo';

export function useDeviceTrustCheck() {
  const { isReady, isAuthenticated } = usePrivy();
  const registerDevice = useMutation(api.auth.registerOrValidateDevice);

  const checkDeviceTrust = async () => {
    const deviceId = await getDeviceFingerprint();
    const { deviceName, platform } = getDeviceInfo();
    const result = await registerDevice({ deviceId, deviceName, platform });
    return result.status; // 'trusted' | 'pending' | 'revoked'
  };

  return { isReady, isAuthenticated, checkDeviceTrust };
}
```

### Navigation after OTP success:
```javascript
// OTPScreen.js — after loginWithCode():
const status = await checkDeviceTrust();
if (status === 'trusted') {
  navigation.replace('MainApp');
} else if (status === 'pending') {
  navigation.replace('DevicePending');
} else {
  // revoked — show error + logout
  await privateLogout();
  Alert.alert('Access Denied', 'This device has been revoked.');
}
```

---

## 4.7 Trusted Device Auto-Auth Flow

When a returning user opens the app on a trusted device:

```javascript
// RootNavigator.js
useEffect(() => {
  if (privyIsReady && privyIsAuthenticated) {
    // Privy already has a valid session — no OTP needed
    checkDeviceTrust().then(status => {
      if (status === 'trusted') navigate('MainApp');
      else if (status === 'pending') navigate('DevicePending');
      else navigate('Auth');         // force re-auth if revoked
    });
  }
}, [privyIsReady, privyIsAuthenticated]);
```

---

## 4.8 Admin Device Revocation

Admins can revoke a trusted device from the admin panel (web):

```typescript
export const revokeDevice = mutation({
  args: { deviceId: v.id('devices') },
  handler: async (ctx, { deviceId }) => {
    const viewer = await getViewerOrThrow(ctx);
    if (viewer.staffRole !== 'admin') throw new Error('Forbidden');
    await ctx.db.patch(deviceId, { trustStatus: 'revoked', revokedAt: Date.now() });
    await ctx.db.insert('adminLogs', {
      actorId: viewer._id,
      action: 'DEVICE_REVOKED',
      targetType: 'device',
      targetId: deviceId,
      timestamp: Date.now(),
    });
  },
});
```

When a revoked device attempts access, `registerOrValidateDevice` returns `status: 'revoked'` and the app forces logout.

---

## 4.9 Security Summary

| Threat | Mitigation |
|--------|-----------|
| Account sharing | Device fingerprinting + admin approval flow |
| Token theft | Privy short-lived JWTs + Convex server-side validation |
| Unauthorized data access | `getViewerOrThrow` guard on every Convex function |
| Role escalation | `staffRole` checked server-side, never client-trusted |
| Sensitive data leakage | Patient data isolated via `userType` field check |
| Rogue device | Admin revocation invalidated immediately |
| Replay attacks | Privy handles OTP expiry (60-second window) |
