import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all suppliers ──────────────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const results = await ctx.db.query("suppliers").take(100);
    return results.filter((s) => !s.isArchived);
  },
});

// ── Search suppliers ────────────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length === 0) {
      return await ctx.db.query("suppliers").take(100);
    }
    return await ctx.db
      .query("suppliers")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .take(50);
  },
});

// ── Get single supplier ─────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Create supplier ─────────────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("suppliers", {
      ...args,
      isFrequent: false,
      orderCount: 0,
      lastOrderDate: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ── Update supplier ─────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("suppliers"),
    name: v.optional(v.string()),
    contactPerson: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFrequent: v.optional(v.boolean()),
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

// ── Archive supplier (soft delete) ──────────────────────────────────────
export const archive = mutation({
  args: {
    id: v.id("suppliers"),
    archivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Supplier not found");
    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedBy: args.archivedBy,
      archivedAt: Date.now(),
    });
  },
});

// ── Restore archived supplier ──────────────────────────────────────────
export const restore = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isArchived: false,
      archivedBy: undefined,
      archivedAt: undefined,
    });
  },
});

// ── Increment order count ───────────────────────────────────────────────
export const recordOrder = mutation({
  args: { id: v.id("suppliers") },
  handler: async (ctx, args) => {
    const supplier = await ctx.db.get(args.id);
    if (!supplier) throw new Error("Supplier not found");
    await ctx.db.patch(args.id, {
      orderCount: supplier.orderCount + 1,
      lastOrderDate: Date.now(),
      isFrequent: supplier.orderCount + 1 >= 5,
      updatedAt: Date.now(),
    });
  },
});
