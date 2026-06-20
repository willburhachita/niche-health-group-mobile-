import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query("clinicConfig")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    return row ? JSON.parse(row.value) : null;
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("clinicConfig").collect();
    const result: Record<string, any> = {};
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }
    return result;
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.string(),
    updatedBy: v.string(),
  },
  handler: async (ctx, { key, value, updatedBy }) => {
    const existing = await ctx.db
      .query("clinicConfig")
      .withIndex("by_key", (q) => q.eq("key", key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value, updatedBy, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("clinicConfig", { key, value, updatedBy, updatedAt: Date.now() });
    }
  },
});
