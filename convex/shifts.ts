import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Shift Types ─────────────────────────────────────────────────────────

export const listShiftTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("shiftTypes").collect();
  },
});

export const createShiftType = mutation({
  args: {
    name: v.string(),
    color: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shiftTypes", args);
  },
});

export const deleteShiftType = mutation({
  args: { id: v.id("shiftTypes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Shifts (Roster) ─────────────────────────────────────────────────────

export const listByMonth = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    // month format: "2026-05"
    const allShifts = await ctx.db.query("shifts").withIndex("by_date").collect();
    return allShifts.filter((s) => s.date.startsWith(args.month));
  },
});

export const listByUserAndMonth = query({
  args: { userId: v.string(), month: v.string() },
  handler: async (ctx, args) => {
    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return shifts.filter((s) => s.date.startsWith(args.month));
  },
});

export const setShift = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    shiftType: v.string(),
    color: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    // Upsert: find existing shift for this user+date
    const existing = await ctx.db
      .query("shifts")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        shiftType: args.shiftType,
        color: args.color,
        startTime: args.startTime,
        endTime: args.endTime,
        notes: args.notes,
      });
      return existing._id;
    }
    return await ctx.db.insert("shifts", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const removeShift = mutation({
  args: { id: v.id("shifts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
