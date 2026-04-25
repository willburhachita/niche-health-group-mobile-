import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List events for a date range ────────────────────────────────────────
export const listByDateRange = query({
  args: {
    startFrom: v.number(),
    startTo: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scheduleEvents")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", args.startFrom).lte("startTime", args.startTo)
      )
      .take(200);
  },
});

// ── List events for a specific day ──────────────────────────────────────
export const listByDate = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    const d = new Date(args.date);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    return await ctx.db
      .query("scheduleEvents")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", dayStart).lt("startTime", dayEnd)
      )
      .take(100);
  },
});

// ── List events for a month (for calendar dots) ─────────────────────────
export const listByMonth = query({
  args: { year: v.number(), month: v.number() },
  handler: async (ctx, args) => {
    const monthStart = new Date(args.year, args.month, 1).getTime();
    const monthEnd = new Date(args.year, args.month + 1, 1).getTime();
    return await ctx.db
      .query("scheduleEvents")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", monthStart).lt("startTime", monthEnd)
      )
      .take(500);
  },
});

// ── List events for a specific user ─────────────────────────────────────
export const listForUser = query({
  args: { userId: v.string(), startFrom: v.number(), startTo: v.number() },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", args.startFrom).lte("startTime", args.startTo)
      )
      .take(500);
    return allEvents.filter(
      (e) =>
        e.organizer === args.userId || e.attendees.includes(args.userId)
    );
  },
});

// ── Get single event ────────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("scheduleEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── List upcoming training sessions ─────────────────────────────────────
export const listTraining = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("scheduleEvents")
      .withIndex("by_startTime", (q) => q.gte("startTime", now))
      .take(100);
    return events.filter((e) => e.type === "training");
  },
});

// ── Create event ────────────────────────────────────────────────────────
export const create = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    isAllDay: v.boolean(),
    organizer: v.string(),
    attendees: v.array(v.string()),
    isRecurring: v.boolean(),
    recurringPattern: v.optional(v.string()),
    recurringEndDate: v.optional(v.number()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("scheduleEvents", {
      ...args,
      parentEventId: undefined,
      acknowledgedBy: [],
      createdAt: Date.now(),
    });

    // Generate recurring instances
    if (args.isRecurring && args.recurringPattern && args.recurringEndDate) {
      const patternMs = getPatternMs(args.recurringPattern);
      if (patternMs > 0) {
        let nextStart = args.startTime + patternMs;
        let nextEnd = args.endTime + patternMs;
        const batchLimit = 52;
        let count = 0;
        while (nextStart <= args.recurringEndDate && count < batchLimit) {
          await ctx.db.insert("scheduleEvents", {
            title: args.title,
            type: args.type,
            description: args.description,
            location: args.location,
            startTime: nextStart,
            endTime: nextEnd,
            isAllDay: args.isAllDay,
            organizer: args.organizer,
            attendees: args.attendees,
            isRecurring: true,
            recurringPattern: args.recurringPattern,
            recurringEndDate: args.recurringEndDate,
            parentEventId: id,
            acknowledgedBy: [],
            createdBy: args.createdBy,
            createdAt: Date.now(),
          });
          nextStart += patternMs;
          nextEnd += patternMs;
          count++;
        }
      }
    }

    return id;
  },
});

// ── Update event ────────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("scheduleEvents"),
    title: v.optional(v.string()),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    isAllDay: v.optional(v.boolean()),
    attendees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Delete event ────────────────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("scheduleEvents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Acknowledge event ───────────────────────────────────────────────────
export const acknowledge = mutation({
  args: { id: v.id("scheduleEvents"), userId: v.string() },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.id);
    if (!event) throw new Error("Event not found");
    if (!event.acknowledgedBy.includes(args.userId)) {
      await ctx.db.patch(args.id, {
        acknowledgedBy: [...event.acknowledgedBy, args.userId],
      });
    }
  },
});

function getPatternMs(pattern: string): number {
  const day = 86400000;
  switch (pattern) {
    case "daily": return day;
    case "weekly": return 7 * day;
    case "biweekly": return 14 * day;
    case "monthly": return 30 * day;
    default: return 0;
  }
}
