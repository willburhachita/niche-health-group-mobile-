import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all expenses ───────────────────────────────────────────────────
export const list = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("expenses")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .take(200);
    }
    return await ctx.db.query("expenses").order("desc").take(200);
  },
});

// ── Get single expense ──────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Expense summary ─────────────────────────────────────────────────────
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("expenses").take(500);
    const total = all.reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const e of all) {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    }
    return { total, byCategory, count: all.length };
  },
});

// ── Create expense ──────────────────────────────────────────────────────
export const create = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.string(),
    date: v.number(),
    vendorName: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("expenses", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ── Update expense ──────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("expenses"),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    category: v.optional(v.string()),
    date: v.optional(v.number()),
    vendorName: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    referenceNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Delete expense ──────────────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("expenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
