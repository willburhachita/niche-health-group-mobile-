import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("billableItems").collect();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("billableItems").collect();
    return all.filter((b) => b.isActive);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    unitPrice: v.number(),
    taxable: v.boolean(),
    category: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("billableItems", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("billableItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    unitPrice: v.optional(v.number()),
    taxable: v.optional(v.boolean()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("billableItems") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { isActive: false });
  },
});
