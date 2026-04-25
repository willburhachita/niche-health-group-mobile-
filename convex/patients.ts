import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// ── List all patients (bounded) ─────────────────────────────────────────
export const list = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("patients")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    }
    return await ctx.db.query("patients").take(200);
  },
});

// ── Get single patient ──────────────────────────────────────────────────
export const get = query({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Search patients by name ─────────────────────────────────────────────
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length === 0) {
      return await ctx.db.query("patients").take(200);
    }
    return await ctx.db
      .query("patients")
      .withSearchIndex("search_name", (q) => q.search("displayName", args.query))
      .take(50);
  },
});

// ── Get recent patients (sorted by lastVisit) ──────────────────────────
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(200);
    return patients
      .filter((p) => p.lastVisit !== undefined)
      .sort((a, b) => (b.lastVisit ?? 0) - (a.lastVisit ?? 0))
      .slice(0, args.limit ?? 5);
  },
});

// ── Count patients by status ────────────────────────────────────────────
export const countByStatus = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("patients").take(500);
    const active = all.filter((p) => p.status === "active").length;
    const discharged = all.filter((p) => p.status === "discharged").length;
    const inactive = all.filter((p) => p.status === "inactive").length;
    return { total: all.length, active, discharged, inactive };
  },
});

// ── Generate next patient code ──────────────────────────────────────────
export const getNextPatientCode = query({
  args: {},
  handler: async (ctx) => {
    const patients = await ctx.db.query("patients").order("desc").take(1);
    if (patients.length === 0) return "PT-001";
    const lastCode = patients[0].patientCode;
    const num = parseInt(lastCode.replace("PT-", ""), 10) || 0;
    return `PT-${String(num + 1).padStart(3, "0")}`;
  },
});

// ── Create patient ──────────────────────────────────────────────────────
export const create = mutation({
  args: {
    patientCode: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    dateOfBirth: v.string(),
    gender: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    allergies: v.array(v.string()),
    conditions: v.array(v.string()),
    medications: v.array(v.string()),
    bloodType: v.optional(v.string()),
    insuranceProvider: v.optional(v.string()),
    policyNumber: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    department: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const initials = (args.firstName[0] + args.lastName[0]).toUpperCase();
    const displayName = `${args.firstName} ${args.lastName}`;
    return await ctx.db.insert("patients", {
      ...args,
      displayName,
      initials,
      status: "active",
      lastVisit: undefined,
      createdAt: Date.now(),
    });
  },
});

// ── Update patient ──────────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("patients"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    allergies: v.optional(v.array(v.string())),
    conditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
    bloodType: v.optional(v.string()),
    insuranceProvider: v.optional(v.string()),
    policyNumber: v.optional(v.string()),
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelationship: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Patient not found");

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    if (fields.firstName || fields.lastName) {
      const fn = fields.firstName ?? existing.firstName;
      const ln = fields.lastName ?? existing.lastName;
      updates.displayName = `${fn} ${ln}`;
      updates.initials = (fn[0] + ln[0]).toUpperCase();
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Record a visit (updates lastVisit timestamp) ────────────────────────
export const recordVisit = mutation({
  args: { id: v.id("patients") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastVisit: Date.now() });
  },
});
