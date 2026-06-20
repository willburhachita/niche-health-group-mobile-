import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { enforcePermission } from "./utils/permissions";

// ── List appointments for a date range ──────────────────────────────────
export const listByDateRange = query({
  args: {
    startFrom: v.number(),
    startTo: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", args.startFrom).lte("startTime", args.startTo)
      )
      .take(200);
  },
});

// ── List appointments for a specific date (day boundaries) ──────────────
export const listByDate = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    const d = new Date(args.date);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    return await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", dayStart).lt("startTime", dayEnd)
      )
      .take(100);
  },
});

// ── List appointments for a patient ─────────────────────────────────────
export const listByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(100);
  },
});

// ── Get single appointment ──────────────────────────────────────────────
export const get = query({
  args: { id: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ── Today's appointment count ───────────────────────────────────────────
export const todayStats = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayStart = now.getTime();
    const dayEnd = dayStart + 86400000;
    const todays = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", dayStart).lt("startTime", dayEnd)
      )
      .take(100);
    const total = todays.filter((a) => a.status !== "open" && a.status !== "cancelled").length;
    const pending = todays.filter((a) => a.status === "pending").length;
    const confirmed = todays.filter((a) => a.status === "confirmed").length;
    const arrived = todays.filter((a) => a.status === "arrived").length;
    const completed = todays.filter((a) => a.status === "completed").length;
    return { total, pending, confirmed, arrived, completed };
  },
});

// ── Upcoming appointments (from now) ────────────────────────────────────
export const listUpcoming = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) => q.gte("startTime", now))
      .take(args.limit ?? 50);
    return results.filter(
      (a) => a.status !== "cancelled" && a.status !== "completed"
    );
  },
});

// ── Create appointment ──────────────────────────────────────────────────
export const create = mutation({
  args: {
    patientId: v.optional(v.id("patients")),
    providerId: v.string(),
    type: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    duration: v.number(),
    location: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    reasonForVisit: v.optional(v.string()),
    isRecurring: v.boolean(),
    recurringPattern: v.optional(v.string()),
    recurringEndDate: v.optional(v.number()),
    recurringInterval: v.optional(v.number()),
    recurringOccurrences: v.optional(v.number()),
    recurringDays: v.optional(v.array(v.number())),
    serviceTypeId: v.optional(v.id("serviceTypes")),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.createdBy, "createAppointment");
    let parentStartTime = args.startTime;
    let parentEndTime = args.endTime;

    if (args.isRecurring && args.recurringPattern === "weekly" && args.recurringDays && args.recurringDays.length > 0) {
      const daysSet = new Set(args.recurringDays);
      let currentStart = new Date(args.startTime);
      let currentEnd = new Date(args.endTime);
      let found = false;
      for (let i = 0; i < 7; i++) {
        if (daysSet.has(currentStart.getDay())) {
          found = true;
          break;
        }
        currentStart.setDate(currentStart.getDate() + 1);
        currentEnd.setDate(currentEnd.getDate() + 1);
      }
      if (found) {
        parentStartTime = currentStart.getTime();
        parentEndTime = currentEnd.getTime();
      }
    }

    const id = await ctx.db.insert("appointments", {
      ...args,
      startTime: parentStartTime,
      endTime: parentEndTime,
      parentAppointmentId: undefined,
      reminderSent: false,
      createdAt: Date.now(),
    });

    // If recurring, generate instances
    if (args.isRecurring && args.recurringPattern) {
      if (args.recurringPattern === "weekly" && args.recurringDays && args.recurringDays.length > 0) {
        const daysSet = new Set(args.recurringDays);
        let currentStart = new Date(parentStartTime);
        let currentEnd = new Date(parentEndTime);
        const limitOccurrences = args.recurringOccurrences ?? 100;
        const batchLimit = Math.min(52, limitOccurrences - 1);
        let count = 0;
        let daysCheck = 0;
        while (count < batchLimit && daysCheck < 365) {
          currentStart.setDate(currentStart.getDate() + 1);
          currentEnd.setDate(currentEnd.getDate() + 1);
          daysCheck++;
          if (args.recurringEndDate && currentStart.getTime() > args.recurringEndDate) {
            break;
          }
          const dayOfWeek = currentStart.getDay();
          if (daysSet.has(dayOfWeek)) {
            await ctx.db.insert("appointments", {
              patientId: args.patientId,
              providerId: args.providerId,
              type: args.type,
              serviceTypeId: args.serviceTypeId,
              startTime: currentStart.getTime(),
              endTime: currentEnd.getTime(),
              duration: args.duration,
              location: args.location,
              status: args.status,
              notes: args.notes,
              reasonForVisit: args.reasonForVisit,
              isRecurring: true,
              recurringPattern: args.recurringPattern,
              recurringEndDate: args.recurringEndDate,
              recurringInterval: args.recurringInterval,
              recurringOccurrences: args.recurringOccurrences,
              recurringDays: args.recurringDays,
              parentAppointmentId: id,
              reminderSent: false,
              createdBy: args.createdBy,
              createdAt: Date.now(),
            });
            count++;
          }
        }
      } else {
        const basePatternMs = getPatternMs(args.recurringPattern);
        const interval = args.recurringInterval ?? 1;
        const patternMs = basePatternMs * interval;
        if (patternMs > 0) {
          let nextStart = args.startTime + patternMs;
          let nextEnd = args.endTime + patternMs;
          const limitOccurrences = args.recurringOccurrences ?? 100;
          const batchLimit = Math.min(52, limitOccurrences - 1);
          let count = 0;
          while (count < batchLimit) {
            if (args.recurringEndDate && nextStart > args.recurringEndDate) {
              break;
            }
            await ctx.db.insert("appointments", {
              patientId: args.patientId,
              providerId: args.providerId,
              type: args.type,
              serviceTypeId: args.serviceTypeId,
              startTime: nextStart,
              endTime: nextEnd,
              duration: args.duration,
              location: args.location,
              status: args.status,
              notes: args.notes,
              reasonForVisit: args.reasonForVisit,
              isRecurring: true,
              recurringPattern: args.recurringPattern,
              recurringEndDate: args.recurringEndDate,
              recurringInterval: args.recurringInterval,
              recurringOccurrences: args.recurringOccurrences,
              parentAppointmentId: id,
              reminderSent: false,
              createdBy: args.createdBy,
              createdAt: Date.now(),
            });
            nextStart += patternMs;
            nextEnd += patternMs;
            count++;
          }
        }
      }
    }

    return id;
  },
});

// ── Update appointment ──────────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("appointments"),
    patientId: v.optional(v.id("patients")),
    providerId: v.optional(v.string()),
    type: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    reasonForVisit: v.optional(v.string()),
    recurringDays: v.optional(v.array(v.number())),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.updatedBy || "admin", "editAppointment");
    const { id, updatedBy, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updates[key] = value;
    }
    await ctx.db.patch(id, updates);
  },
});

// ── Cancel appointment ──────────────────────────────────────────────────
export const cancel = mutation({
  args: {
    id: v.id("appointments"),
    cancelReason: v.optional(v.string()),
    cancelNotes: v.optional(v.string()),
    cancelSeries: v.optional(v.boolean()),
    cancelledBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.cancelledBy || "admin", "editAppointment");
    const selected = await ctx.db.get(args.id);
    if (!selected) {
      throw new Error("Appointment not found");
    }

    const cancelReason = args.cancelReason ?? "Other";
    const cancelNotes = args.cancelNotes ?? "";

    if (args.cancelSeries && (selected.isRecurring || selected.parentAppointmentId)) {
      const parentId = selected.parentAppointmentId ?? selected._id;

      // Fetch all appointments belonging to this series
      const allApts = await ctx.db
        .query("appointments")
        .filter((q) =>
          q.or(
            q.eq(q.field("_id"), parentId),
            q.eq(q.field("parentAppointmentId"), parentId)
          )
        )
        .collect();

      const futureApts = allApts.filter(
        (apt) => apt.startTime >= selected.startTime && apt.status !== "cancelled"
      );

      for (const apt of futureApts) {
        await ctx.db.patch(apt._id, {
          status: "cancelled",
          cancelReason,
          cancelNotes,
        });
      }
    } else {
      await ctx.db.patch(args.id, {
        status: "cancelled",
        cancelReason,
        cancelNotes,
      });
    }
  },
});

// ── Mark patient as arrived ────────────────────────────────────────────
export const markArrived = mutation({
  args: { 
    id: v.id("appointments"),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.updatedBy || "admin", "editAppointment");
    await ctx.db.patch(args.id, { status: "arrived" });
  },
});

// ── Complete appointment ────────────────────────────────────────────────
export const complete = mutation({
  args: { 
    id: v.id("appointments"),
    updatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.updatedBy || "admin", "editAppointment");
    await ctx.db.patch(args.id, { status: "completed" });
  },
});

// ── Complete appointment and auto-generate draft invoice ─────────────────
export const completeAndDraft = mutation({
  args: {
    id: v.id("appointments"),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.createdBy, "editAppointment");
    await enforcePermission(ctx.db, args.createdBy, "createInvoice");
    const apt = await ctx.db.get(args.id);
    if (!apt) throw new Error("Appointment not found");
    await ctx.db.patch(args.id, { status: "completed" });
    if (!apt.patientId) return { invoiceId: null };

    const existing = await ctx.db
      .query("invoices")
      .withIndex("by_appointmentId", (q) => q.eq("appointmentId", args.id))
      .take(1);
    if (existing.length > 0) return { invoiceId: existing[0]._id };

    const latest = await ctx.db.query("invoices").order("desc").take(1);
    let invoiceNumber = "INV-001";
    if (latest.length > 0) {
      const num = parseInt(latest[0].invoiceNumber.replace(/[^0-9]/g, ""), 10) || 0;
      invoiceNumber = `INV-${String(num + 1).padStart(3, "0")}`;
    }

    const now = Date.now();
    const aptDate = new Date(apt.startTime);
    const dateStr = `${aptDate.getDate()}/${aptDate.getMonth() + 1}/${aptDate.getFullYear()}`;

    // Find service type by ID or name matching
    let serviceType = null;
    if (apt.serviceTypeId) {
      serviceType = await ctx.db.get(apt.serviceTypeId);
    }
    if (!serviceType && apt.type) {
      const allServiceTypes = await ctx.db.query("serviceTypes").collect();
      serviceType = allServiceTypes.find(
        (s) => s.name.toLowerCase() === apt.type!.toLowerCase()
      ) || null;
    }

    const subtotal = serviceType ? serviceType.fixedPrice : 0;
    const total = subtotal;

    const invoiceId = await ctx.db.insert("invoices", {
      invoiceNumber,
      patientId: apt.patientId,
      appointmentId: args.id,
      date: now,
      dueDate: now + 30 * 86400000,
      subtotal,
      tax: 0,
      total,
      status: "draft",
      notes: serviceType
        ? `Draft from appointment on ${dateStr}.`
        : `Draft from appointment on ${dateStr}. Add line items before sending to patient.`,
      createdBy: args.createdBy,
      createdAt: now,
    });

    if (serviceType) {
      // Add the service type line item
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        description: serviceType.name,
        quantity: 1,
        unitPrice: serviceType.fixedPrice,
        total: serviceType.fixedPrice,
      });

      // Add the associated stock items (billed at K 0)
      if (serviceType.stockItems) {
        for (const si of serviceType.stockItems) {
          const item = await ctx.db.get(si.stockItemId);
          if (item) {
            await ctx.db.insert("invoiceLineItems", {
              invoiceId,
              stockItemId: si.stockItemId,
              description: `${item.name} (stock)`,
              quantity: si.quantity,
              unitPrice: item.pricePerItem,
              total: 0,
            });
          }
        }
      }
    } else {
      // Fallback custom line item
      await ctx.db.insert("invoiceLineItems", {
        invoiceId,
        description: apt.type || "Consultation",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      });
    }

    return { invoiceId };
  },
});

// ── Next upcoming appointment today with patient info ────────────────────
export const nextAppointmentToday = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const apts = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", now).lte("startTime", end.getTime())
      )
      .take(20);
    const next = apts.find(
      (a) => a.status !== "completed" && a.status !== "cancelled" && a.status !== "open"
    );
    if (!next) return null;
    const patient = next.patientId ? await ctx.db.get(next.patientId) : null;
    return {
      ...next,
      patientName: patient?.displayName ?? null,
      patientCode: patient?.patientCode ?? null,
    };
  },
});

// ── List uninvoiced appointments for a patient ────────────────────────
export const listUninvoiced = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .take(200);

    // Filter to completed/confirmed that haven't been invoiced
    const uninvoiced = [];
    for (const apt of appointments) {
      if (apt.status === "cancelled") continue;
      // Check if this appointment already has an invoice
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", apt._id))
        .take(1);
      if (invoice.length === 0) {
        uninvoiced.push(apt);
      }
    }
    return uninvoiced;
  },
});

// ── List today's uninvoiced appointments ──────────────────────────────
export const listTodayUninvoiced = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dayStart = now.getTime();
    const dayEnd = dayStart + 86400000;
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_startTime", (q) =>
        q.gte("startTime", dayStart).lt("startTime", dayEnd)
      )
      .take(100);

    const uninvoiced = [];
    for (const apt of appointments) {
      if (apt.status === "cancelled") continue;
      const invoice = await ctx.db
        .query("invoices")
        .withIndex("by_appointmentId", (q) => q.eq("appointmentId", apt._id))
        .take(1);
      if (invoice.length === 0) {
        uninvoiced.push(apt);
      }
    }
    return uninvoiced;
  },
});

// ── Archive appointment (soft delete) ───────────────────────────────────
export const archive = mutation({
  args: {
    id: v.id("appointments"),
    archivedBy: v.string(),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.archivedBy, "archiveAppointment");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Appointment not found");
    await ctx.db.patch(args.id, {
      isArchived: true,
      archivedBy: args.archivedBy,
      archivedAt: Date.now(),
    });
  },
});

// ── Restore archived appointment ────────────────────────────────────────
export const restore = mutation({
  args: { 
    id: v.id("appointments"),
    restoredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforcePermission(ctx.db, args.restoredBy || "admin", "archiveAppointment");
    await ctx.db.patch(args.id, {
      isArchived: false,
      archivedBy: undefined,
      archivedAt: undefined,
    });
  },
});

function getPatternMs(pattern: string): number {
  const day = 86400000;
  switch (pattern) {
    case "daily":
      return day;
    case "weekly":
      return 7 * day;
    case "biweekly":
      return 14 * day;
    case "monthly":
      return 30 * day;
    default:
      return 0;
  }
}
