import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all departments with member count + head info ────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    const departments = await ctx.db.query("departments").order("asc").take(100);
    const allUsers = await ctx.db.query("users").take(500);

    return departments.map((dept) => {
      const members = allUsers.filter((u) => u.department === dept.name);
      const head = dept.headUserId
        ? allUsers.find((u) => u.externalId === dept.headUserId)
        : undefined;
      return {
        ...dept,
        memberCount: members.length,
        headName: head?.displayName ?? null,
        members: members.map((m) => ({
          _id: m._id,
          externalId: m.externalId,
          displayName: m.displayName,
          initials: m.initials,
          staffRole: m.staffRole,
          department: m.department,
        })),
      };
    });
  },
});

// ── All staff not yet in a managed department ────────────────────────────
export const listAllStaff = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(500);
    return users.map((u) => ({
      _id: u._id,
      externalId: u.externalId,
      displayName: u.displayName,
      initials: u.initials,
      staffRole: u.staffRole,
      department: u.department,
    }));
  },
});

// ── Create a new department ───────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    headUserId: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("departments")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .take(1);
    if (existing.length > 0) throw new Error("A department with this name already exists.");
    return await ctx.db.insert("departments", {
      name: args.name,
      description: args.description,
      headUserId: args.headUserId,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

// ── Update department ─────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("departments"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    headUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) updates[k] = val;
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Delete department ─────────────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("departments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ── Assign user to a department ───────────────────────────────────────────
export const assignUser = mutation({
  args: {
    externalId: v.string(),
    department: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .take(1);
    if (users.length === 0) throw new Error("User not found.");
    await ctx.db.patch(users[0]._id, { department: args.department });
  },
});
