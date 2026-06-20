import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

// ── Helper to resolve all account identifiers (Convex ID, email, custom userId) ──
async function getAccountIdentifiers(ctx: any, userIdArg: string): Promise<string[]> {
  const ids: string[] = [userIdArg];
  
  // Try treating it as a Convex ID
  try {
    const byId = await ctx.db.get(userIdArg);
    if (byId && byId.email) {
      if (!ids.includes(byId._id)) ids.push(byId._id);
      if (!ids.includes(byId.email)) ids.push(byId.email);
      if (byId.userId && !ids.includes(byId.userId)) ids.push(byId.userId);
      return ids;
    }
  } catch (e) {}

  // Try treating it as an email
  if (userIdArg.includes("@")) {
    const byEmail = await ctx.db
      .query("staffAccounts")
      .withIndex("by_email", (q: any) => q.eq("email", userIdArg.toLowerCase()))
      .first();
    if (byEmail) {
      if (!ids.includes(byEmail._id)) ids.push(byEmail._id);
      if (!ids.includes(byEmail.email)) ids.push(byEmail.email);
      if (byEmail.userId && !ids.includes(byEmail.userId)) ids.push(byEmail.userId);
      return ids;
    }
  }

  // Try treating it as a custom userId
  const byCustomId = await ctx.db
    .query("staffAccounts")
    .filter((q: any) => q.eq(q.field("userId"), userIdArg))
    .first();
  if (byCustomId) {
    if (!ids.includes(byCustomId._id)) ids.push(byCustomId._id);
    if (!ids.includes(byCustomId.email)) ids.push(byCustomId.email);
    if (byCustomId.userId && !ids.includes(byCustomId.userId)) ids.push(byCustomId.userId);
    return ids;
  }

  return ids;
}

// ── Create a notification (internal — called from other mutations) ────────
export const create = internalMutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("inAppNotifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      entityId: args.entityId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── Public create (for frontend-triggered notifications) ─────────────────
export const send = mutation({
  args: {
    userId: v.string(),
    type: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    link: v.optional(v.string()),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("inAppNotifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
      entityId: args.entityId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// ── List notifications for a user (most recent 50) ────────────────────────
export const listForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const ids = await getAccountIdentifiers(ctx, args.userId);
    const allNotifs = [];
    
    for (const id of ids) {
      const list = await ctx.db
        .query("inAppNotifications")
        .withIndex("by_userId", (q) => q.eq("userId", id))
        .collect();
      allNotifs.push(...list);
    }
    
    const uniqueNotifs = Array.from(new Map(allNotifs.map(item => [item._id, item])).values());
    return uniqueNotifs
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 50);
  },
});

// ── Unread count ──────────────────────────────────────────────────────────
export const unreadCount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const ids = await getAccountIdentifiers(ctx, args.userId);
    const allUnread = [];
    
    for (const id of ids) {
      const list = await ctx.db
        .query("inAppNotifications")
        .withIndex("by_userId_and_isRead", (q) =>
          q.eq("userId", id).eq("isRead", false)
        )
        .collect();
      allUnread.push(...list);
    }
    
    const uniqueUnread = Array.from(new Map(allUnread.map(item => [item._id, item])).values());
    return uniqueUnread.length;
  },
});

// ── Mark one as read ──────────────────────────────────────────────────────
export const markRead = mutation({
  args: { id: v.id("inAppNotifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
  },
});

// ── Mark all as read for a user ───────────────────────────────────────────
export const markAllRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const ids = await getAccountIdentifiers(ctx, args.userId);
    const allUnread = [];
    
    for (const id of ids) {
      const list = await ctx.db
        .query("inAppNotifications")
        .withIndex("by_userId_and_isRead", (q) =>
          q.eq("userId", id).eq("isRead", false)
        )
        .collect();
      allUnread.push(...list);
    }
    
    const uniqueUnread = Array.from(new Map(allUnread.map(item => [item._id, item])).values());
    await Promise.all(uniqueUnread.map((n) => ctx.db.patch(n._id, { isRead: true })));
    return uniqueUnread.length;
  },
});

// ── Delete a single notification ──────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("inAppNotifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
