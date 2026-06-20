import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Clock In ────────────────────────────────────────────────────────────
export const clockIn = mutation({
  args: { userId: v.string(), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Check for an open entry (no clockOut)
    const open = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("clockOut"), undefined))
      .first();
    if (open) throw new Error("Already clocked in. Please clock out first.");
    return await ctx.db.insert("timeEntries", {
      userId: args.userId,
      clockIn: Date.now(),
      notes: args.notes,
    });
  },
});

// ── Clock Out ───────────────────────────────────────────────────────────
export const clockOut = mutation({
  args: { userId: v.string(), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const open = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("clockOut"), undefined))
      .first();
    if (!open) throw new Error("No active clock-in found.");
    const now = Date.now();
    const totalMinutes = Math.round((now - open.clockIn) / 60000);
    await ctx.db.patch(open._id, {
      clockOut: now,
      totalMinutes,
      notes: args.notes || open.notes,
    });
    return { totalMinutes };
  },
});

// ── Get current status ──────────────────────────────────────────────────
export const currentStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const open = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("clockOut"), undefined))
      .first();
    return open ? { clockedIn: true, since: open.clockIn, entryId: open._id } : { clockedIn: false };
  },
});

// ── List entries for a user (last 30 days) ──────────────────────────────
export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.gte(q.field("clockIn"), thirtyDaysAgo))
      .order("desc")
      .take(100);
  },
});

// ── List all entries (admin view) ───────────────────────────────────────
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    return await ctx.db
      .query("timeEntries")
      .withIndex("by_clockIn")
      .filter((q) => q.gte(q.field("clockIn"), thirtyDaysAgo))
      .order("desc")
      .take(200);
  },
});

// ── Summary: total hours in a date range ────────────────────────────────
export const summary = query({
  args: { userId: v.string(), fromDate: v.number(), toDate: v.number() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("timeEntries")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.gte(q.field("clockIn"), args.fromDate),
          q.lte(q.field("clockIn"), args.toDate)
        )
      )
      .collect();
    const totalMinutes = entries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
    return { totalMinutes, totalHours: Math.round(totalMinutes / 6) / 10, entryCount: entries.length };
  },
});
