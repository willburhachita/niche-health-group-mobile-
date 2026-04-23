import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ────────────────────────────────────────────────────────────

export const getAccountByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    console.log(`[AUTH] getAccountByEmail called with: ${email}`);
    // Try exact match first, then lowercase — emails in DB are stored lowercase
    const exact = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (exact && exact.isActive) {
      console.log(`[AUTH] ✅ Found account (exact match): ${exact.email} | role: ${exact.role} | onboarded: ${exact.isOnboarded}`);
      return exact;
    }
    const lower = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (lower && lower.isActive) {
      console.log(`[AUTH] ✅ Found account (lowercase match): ${lower.email} | role: ${lower.role}`);
    } else {
      console.log(`[AUTH] ❌ No active account found for: ${email}`);
    }
    return lower && lower.isActive ? lower : null;
  },
});

export const getUserByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    console.log(`[AUTH] getUserByExternalId: ${externalId}`);
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();
    console.log(`[AUTH] ${user ? `✅ Found user: ${user.displayName}` : '❌ User not found'}`);
    return user;
  },
});

export const getAllUsers = query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    console.log(`[AUTH] getAllUsers: returned ${users.length} users`);
    return users;
  },
});

export const getStaffByDepartment = query({
  args: { department: v.string() },
  handler: async (ctx, { department }) => {
    console.log(`[AUTH] getStaffByDepartment: ${department}`);
    const all = await ctx.db.query("users").collect();
    const filtered = all.filter((u) => u.department === department);
    console.log(`[AUTH] Found ${filtered.length} staff in ${department}`);
    return filtered;
  },
});

export const getAllStaffAccounts = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("staffAccounts").collect();
    console.log(`[AUTH] getAllStaffAccounts: returned ${accounts.length} accounts`);
    return accounts;
  },
});

// ── Mutations ──────────────────────────────────────────────────────────

export const createStaffAccount = mutation({
  args: {
    email: v.string(),
    role: v.string(),
    password: v.string(),
    verificationCode: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, { email, role, password, verificationCode, createdBy }) => {
    console.log(`[AUTH] 🆕 createStaffAccount: email=${email}, role=${role}, createdBy=${createdBy}`);

    // Check if an account with this email already exists
    const existing = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();
    if (existing) {
      console.log(`[AUTH] ❌ Account already exists for: ${email}`);
      return { success: false, error: "An account with this email already exists" };
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const id = await ctx.db.insert("staffAccounts", {
      userId,
      email: email.toLowerCase(),
      phone: null,
      title: null,
      displayName: null,
      fullName: null,
      role,
      password,
      verificationCode,
      isActive: true,
      isOnboarded: false,
      trustedDevices: [],
      createdBy,
      createdAt: Date.now(),
    });

    // Create corresponding user profile entry (placeholder until onboarding fills it in)
    const emailLocal = email.split("@")[0] || email;
    const initialDisplayName = emailLocal.charAt(0).toUpperCase() + emailLocal.slice(1);
    await ctx.db.insert("users", {
      externalId: userId,
      displayName: initialDisplayName,
      firstName: initialDisplayName,
      lastName: "",
      initials: initialDisplayName.substring(0, 2).toUpperCase(),
      userType: "staff",
      staffRole: role,
      department: "",
      email: email.toLowerCase(),
      phone: "",
      onlineStatus: "offline",
      joinedAt: Date.now(),
    });
    console.log(`[AUTH] ✅ Staff account + user profile created: ${id} (${email}, role=${role})`);

    await ctx.db.insert("activityLogs", {
      action: "Staff Account Created",
      category: "staff",
      performedBy: createdBy,
      target: email,
      details: `New ${role} account created for ${email}`,
      timestamp: Date.now(),
    });
    return { success: true, accountId: id };
  },
});

export const verifyPassword = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    console.log(`[AUTH] 🔐 verifyPassword called for: ${email}`);
    const account = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", email.toLowerCase()))
      .first();

    if (!account || !account.isActive) {
      console.log(`[AUTH] ❌ verifyPassword FAILED — account not found or inactive`);
      return { success: false, error: "Account not found" };
    }
    if (account.password !== password) {
      console.log(`[AUTH] ❌ verifyPassword FAILED — wrong password for ${email}`);
      return { success: false, error: "Incorrect password" };
    }
    console.log(`[AUTH] ✅ verifyPassword SUCCESS — ${email} (role: ${account.role})`);
    return { success: true, account };
  },
});

export const completeOnboarding = mutation({
  args: {
    accountId: v.id("staffAccounts"),
    title: v.string(),
    fullName: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { accountId, title, fullName, phone }) => {
    console.log(`[AUTH] 📋 completeOnboarding for account: ${accountId}`);
    console.log(`[AUTH]    title=${title}, fullName=${fullName}, phone=${phone}`);
    const parts = fullName.split(" ");
    const surname = parts[0] || "";
    const firstInitial = parts[1]
      ? ` ${parts[1].charAt(0).toUpperCase()}.`
      : "";
    const displayName = `${title}. ${surname}${firstInitial}`;

    await ctx.db.patch(accountId, {
      title,
      fullName,
      displayName,
      phone,
      isOnboarded: true,
    });

    // Sync to users profile table
    const account = await ctx.db.get(accountId);
    if (account) {
      const userProfile = await ctx.db
        .query("users")
        .withIndex("by_externalId", (q) => q.eq("externalId", account.userId))
        .first();
      const firstName = parts[1] || parts[0] || "";
      const lastName = parts[0] || "";
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      if (userProfile) {
        await ctx.db.patch(userProfile._id, {
          displayName,
          firstName,
          lastName,
          initials,
          phone,
          staffRole: account.role,
          onlineStatus: "online",
        });
      } else {
        await ctx.db.insert("users", {
          externalId: account.userId,
          displayName,
          firstName,
          lastName,
          initials,
          userType: "staff",
          staffRole: account.role,
          department: "",
          email: account.email,
          phone,
          onlineStatus: "online",
          joinedAt: Date.now(),
        });
      }
      console.log(`[AUTH] ✅ User profile synced for ${displayName}`);
    }

    console.log(`[AUTH] ✅ Onboarding complete — displayName: ${displayName}`);
    return { displayName };
  },
});

export const addTrustedDevice = mutation({
  args: { accountId: v.id("staffAccounts"), deviceId: v.string() },
  handler: async (ctx, { accountId, deviceId }) => {
    console.log(`[AUTH] 📱 addTrustedDevice: account=${accountId}, device=${deviceId}`);
    const account = await ctx.db.get(accountId);
    if (!account) {
      console.log(`[AUTH] ❌ Account not found for addTrustedDevice`);
      return;
    }
    if (!account.trustedDevices.includes(deviceId)) {
      await ctx.db.patch(accountId, {
        trustedDevices: [...account.trustedDevices, deviceId],
      });
      console.log(`[AUTH] ✅ Device ${deviceId} added to trusted list (now ${account.trustedDevices.length + 1} devices)`);
    } else {
      console.log(`[AUTH] ℹ️ Device ${deviceId} already trusted`);
    }
  },
});

export const createLoginAlert = mutation({
  args: { staffId: v.string(), deviceName: v.string() },
  handler: async (ctx, { staffId, deviceName }) => {
    console.log(`[AUTH] 🔔 createLoginAlert: staff=${staffId}, device=${deviceName}`);
    const id = await ctx.db.insert("loginAlerts", {
      staffId,
      deviceName,
      loggedInAt: Date.now(),
    });
    console.log(`[AUTH] ✅ Login alert created: ${id}`);
    await ctx.db.insert("activityLogs", {
      action: "Staff Login",
      category: "auth",
      performedBy: staffId,
      target: deviceName,
      details: `Login from ${deviceName}`,
      timestamp: Date.now(),
    });
  },
});

export const createDeviceRequest = mutation({
  args: {
    staffId: v.string(),
    deviceId: v.string(),
    deviceName: v.optional(v.string()),
    platform: v.optional(v.string()),
  },
  handler: async (ctx, { staffId, deviceId, deviceName, platform }) => {
    console.log(`[AUTH] 🆕 createDeviceRequest: staff=${staffId}, device=${deviceId}, platform=${platform}`);
    // Avoid duplicate pending requests for the same device
    const existing = await ctx.db
      .query("deviceRequests")
      .withIndex("by_staffId", (q) => q.eq("staffId", staffId))
      .collect();
    const dup = existing.find(
      (r) => r.deviceId === deviceId && r.status === "pending"
    );
    if (dup) {
      console.log(`[AUTH] ℹ️ Duplicate pending request already exists: ${dup._id}`);
      return dup._id;
    }
    const id = await ctx.db.insert("deviceRequests", {
      staffId,
      deviceId,
      deviceName,
      platform,
      status: "pending",
      requestedAt: Date.now(),
    });
    console.log(`[AUTH] ✅ Device request created: ${id}`);
    return id;
  },
});

// ── Staff Management ────────────────────────────────────────────────────

export const deactivateStaffAccount = mutation({
  args: { accountId: v.id("staffAccounts"), adminId: v.string() },
  handler: async (ctx, { accountId, adminId }) => {
    const account = await ctx.db.get(accountId);
    if (!account) throw new Error("Account not found");
    console.log(`[AUTH] 📦 Archiving staff account: ${account.email} by ${adminId}`);
    await ctx.db.patch(accountId, { isActive: false });
    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "Staff Archived",
      category: "staff",
      performedBy: adminId,
      target: account.displayName || account.email,
      details: `Account ${account.email} has been archived`,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

export const reactivateStaffAccount = mutation({
  args: { accountId: v.id("staffAccounts"), adminId: v.string() },
  handler: async (ctx, { accountId, adminId }) => {
    const account = await ctx.db.get(accountId);
    if (!account) throw new Error("Account not found");
    console.log(`[AUTH] ✅ Reactivating staff account: ${account.email} by ${adminId}`);
    await ctx.db.patch(accountId, { isActive: true });
    await ctx.db.insert("activityLogs", {
      action: "Staff Reactivated",
      category: "staff",
      performedBy: adminId,
      target: account.displayName || account.email,
      details: `Account ${account.email} has been reactivated`,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

export const deleteStaffAccount = mutation({
  args: { accountId: v.id("staffAccounts"), adminId: v.string() },
  handler: async (ctx, { accountId, adminId }) => {
    const account = await ctx.db.get(accountId);
    if (!account) throw new Error("Account not found");
    console.log(`[AUTH] 🗑️ Deleting staff account: ${account.email} by ${adminId}`);
    const email = account.email;
    const name = account.displayName || account.email;
    await ctx.db.delete(accountId);
    // Also delete linked user profile if exists
    const userProfile = await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();
    if (userProfile) {
      await ctx.db.delete(userProfile._id);
    }
    await ctx.db.insert("activityLogs", {
      action: "Staff Deleted",
      category: "staff",
      performedBy: adminId,
      target: name,
      details: `Account ${email} has been permanently deleted`,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});

// ── Sync users table with staffAccounts (wipe and rebuild) ─────────────
export const syncUsersWithStaffAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    console.log(`[AUTH] 🔄 Wiping users table and rebuilding from staffAccounts...`);

    // 1. Delete ALL existing user profiles (they're derived data from staffAccounts)
    const users = await ctx.db.query("users").take(500);
    for (const u of users) await ctx.db.delete(u._id);

    // 2. Rebuild user profiles from current staffAccounts
    const staff = await ctx.db.query("staffAccounts").take(500);
    let created = 0;
    for (const s of staff) {
      const displayName = s.displayName || s.email.split("@")[0];
      const parts = (s.fullName || s.email.split("@")[0]).split(" ");
      const firstName = parts[0] || displayName;
      const lastName = parts[1] || "";
      await ctx.db.insert("users", {
        externalId: s.userId,
        displayName,
        firstName,
        lastName,
        initials: `${firstName.charAt(0)}${lastName.charAt(0) || ""}`.toUpperCase(),
        userType: "staff",
        staffRole: s.role,
        department: "",
        email: s.email,
        phone: s.phone || "",
        onlineStatus: "offline",
        joinedAt: s.createdAt,
      });
      created++;
    }

    console.log(`[AUTH] ✅ Sync complete — wiped ${users.length} old, created ${created} fresh profiles`);
    return { success: true, deleted: users.length, created };
  },
});

// ── Reset trusted devices for an account (dev utility) ──────────────────
export const resetTrustedDevices = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const account = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (!account) return { success: false, error: "Account not found" };
    await ctx.db.patch(account._id, { trustedDevices: [] });
    console.log(`[AUTH] 🔄 Reset trustedDevices for ${email}`);
    return { success: true };
  },
});

// ── Clear all device requests (dev utility) ────────────────────────────
export const clearAllDeviceRequests = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("deviceRequests").collect();
    for (const r of all) {
      await ctx.db.delete(r._id);
    }
    console.log(`[AUTH] 🗑️ Cleared ${all.length} device requests`);
    return { deleted: all.length };
  },
});

// ── Device Request Queries ──────────────────────────────────────────────

export const listDeviceRequests = query({
  args: {},
  handler: async (ctx) => {
    const requests = await ctx.db.query("deviceRequests").collect();
    const accounts = await ctx.db.query("staffAccounts").collect();
    // Enrich with staff account info
    const enriched = requests.map((req) => {
      const account = accounts.find((a) => String(a._id) === req.staffId);
      return {
        ...req,
        staffName: account?.displayName || account?.email || "Unknown",
        staffEmail: account?.email || "",
      };
    });
    console.log(`[AUTH] listDeviceRequests: returned ${enriched.length} requests`);
    return enriched;
  },
});

// ── Device Request Mutations ────────────────────────────────────────────

export const approveDeviceRequest = mutation({
  args: {
    requestId: v.id("deviceRequests"),
    adminId: v.string(),
  },
  handler: async (ctx, { requestId, adminId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Device request not found");
    console.log(`[AUTH] ✅ Approving device request ${requestId} (staff=${req.staffId}, device=${req.deviceId})`);

    // Mark request as approved
    await ctx.db.patch(requestId, {
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: Date.now(),
    });

    // Add device to the staff account's trustedDevices
    const allAccounts = await ctx.db.query("staffAccounts").collect();
    const account = allAccounts.find((a) => String(a._id) === req.staffId);
    if (account && !account.trustedDevices.includes(req.deviceId)) {
      await ctx.db.patch(account._id, {
        trustedDevices: [...account.trustedDevices, req.deviceId],
      });
      console.log(`[AUTH] 📱 Device ${req.deviceId} added to trusted for ${account.email}`);
    }
    await ctx.db.insert("activityLogs", {
      action: "Device Approved",
      category: "device",
      performedBy: adminId,
      target: req.deviceName || req.deviceId,
      details: `Device ${req.deviceName || req.deviceId} approved for ${account?.email || req.staffId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});

export const rejectDeviceRequest = mutation({
  args: {
    requestId: v.id("deviceRequests"),
    adminId: v.string(),
  },
  handler: async (ctx, { requestId, adminId }) => {
    const req = await ctx.db.get(requestId);
    if (!req) throw new Error("Device request not found");
    console.log(`[AUTH] ❌ Rejecting device request ${requestId}`);

    await ctx.db.patch(requestId, {
      status: "rejected",
      reviewedBy: adminId,
      reviewedAt: Date.now(),
    });
    await ctx.db.insert("activityLogs", {
      action: "Device Rejected",
      category: "device",
      performedBy: adminId,
      target: req.deviceName || req.deviceId,
      details: `Device ${req.deviceName || req.deviceId} rejected for staff ${req.staffId}`,
      timestamp: Date.now(),
    });

    return { success: true };
  },
});
