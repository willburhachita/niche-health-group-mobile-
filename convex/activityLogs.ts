import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listActivityLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const take = limit || 100;
    const logs = await ctx.db
      .query("activityLogs")
      .order("desc")
      .take(take);
    console.log(`[LOGS] listActivityLogs: returned ${logs.length} logs`);
    return logs;
  },
});

export const listActivityLogsByCategory = query({
  args: { category: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { category, limit }) => {
    const take = limit || 50;
    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("by_category", (q) => q.eq("category", category))
      .order("desc")
      .take(take);
    console.log(`[LOGS] listActivityLogsByCategory (${category}): returned ${logs.length} logs`);
    return logs;
  },
});

export const logActivity = mutation({
  args: {
    action: v.string(),
    category: v.string(),
    performedBy: v.string(),
    performedByName: v.optional(v.string()),
    target: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("activityLogs", {
      ...args,
      timestamp: Date.now(),
    });
    console.log(`[LOGS] Activity logged: ${args.action} by ${args.performedBy}`);
    return id;
  },
});

export const getActivityStats = query({
  args: {},
  handler: async (ctx) => {
    const allLogs = await ctx.db.query("activityLogs").order("desc").take(500);
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const last24h = allLogs.filter((l) => l.timestamp > oneDayAgo);
    const lastWeek = allLogs.filter((l) => l.timestamp > oneWeekAgo);

    // Category breakdown
    const categories: Record<string, number> = {};
    for (const log of lastWeek) {
      categories[log.category] = (categories[log.category] || 0) + 1;
    }

    return {
      total: allLogs.length,
      last24h: last24h.length,
      lastWeek: lastWeek.length,
      categories,
    };
  },
});
