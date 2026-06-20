import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Salary Configurations CRUD ──────────────────────────────────────────

export const saveSalaryConfig = mutation({
  args: {
    userId: v.string(), // staff email
    baseSalary: v.number(),
    allowances: v.number(),
    napsaRate: v.number(),
    nhimaRate: v.number(),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    bankBranchCode: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("staffSalaryConfig")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const data = {
      userId: args.userId,
      baseSalary: args.baseSalary,
      allowances: args.allowances,
      napsaRate: args.napsaRate,
      nhimaRate: args.nhimaRate,
      bankName: args.bankName,
      bankAccountNumber: args.bankAccountNumber,
      bankBranchCode: args.bankBranchCode,
      isActive: true,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("staffSalaryConfig", data);
    }
  },
});

export const getSalaryConfig = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("staffSalaryConfig")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const listSalaryConfigs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("staffSalaryConfig").collect();
  },
});

// ── Payroll Slips Processing ─────────────────────────────────────────────

export const listPayrollByPeriod = query({
  args: { period: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payrollRecords")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .collect();
  },
});

// Helper function for Zambian PAYE (Pay-As-You-Earn) income tax calculation
function calculatePAYE(grossPay: number): number {
  // 2024 / 2026 Zambian PAYE tax brackets:
  // Up to K5,100           - 0%
  // K5,100.01 to K7,100    - 20%
  // K7,100.01 to K9,200    - 30%
  // Above K9,200           - 37%
  let tax = 0;
  if (grossPay <= 5100) {
    return 0;
  }
  
  // Bracket 1: K5,100 to K7,100 (range of K2,000)
  if (grossPay > 5100) {
    const taxable = Math.min(grossPay - 5100, 2000);
    tax += taxable * 0.20;
  }
  
  // Bracket 2: K7,100 to K9,200 (range of K2,100)
  if (grossPay > 7100) {
    const taxable = Math.min(grossPay - 7100, 2100);
    tax += taxable * 0.30;
  }
  
  // Bracket 3: Above K9,200
  if (grossPay > 9200) {
    const taxable = grossPay - 9200;
    tax += taxable * 0.37;
  }
  
  return Number(tax.toFixed(2));
}

export const generatePayroll = mutation({
  args: {
    period: v.string(), // "2026-05"
    createdBy: v.string(),
  },
  handler: async (ctx, { period, createdBy }) => {
    console.log(`[PAYROLL] Generating payroll for ${period} by ${createdBy}`);
    
    // 1. Wipe existing draft records for the same period to allow re-runs
    const existing = await ctx.db
      .query("payrollRecords")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();
    
    for (const record of existing) {
      if (record.status === "draft") {
        await ctx.db.delete(record._id);
      }
    }

    // 2. Fetch all active salary configurations
    const configs = await ctx.db
      .query("staffSalaryConfig")
      .withIndex("by_isActive", (q) => q.eq("isActive", true))
      .collect();

    // 3. For each config, calculate payroll slip details
    const createdIds = [];
    for (const config of configs) {
      const baseSalary = config.baseSalary;
      const allowances = config.allowances;
      const grossPay = baseSalary + allowances;

      // Deductions
      const napsaDeduction = Number((grossPay * config.napsaRate).toFixed(2));
      const nhimaDeduction = Number((grossPay * config.nhimaRate).toFixed(2));
      const payeDeduction = calculatePAYE(grossPay);
      
      const netPay = Number((grossPay - (napsaDeduction + nhimaDeduction + payeDeduction)).toFixed(2));

      // Calculate attendance hours if any
      // Let's check timeEntries for the given month
      const timeEntries = await ctx.db
        .query("timeEntries")
        .withIndex("by_userId", (q) => q.eq("userId", config.userId))
        .collect();

      const periodStart = new Date(`${period}-01T00:00:00`).getTime();
      const periodEnd = new Date(`${period}-31T23:59:59`).getTime(); // approximate end

      const monthEntries = timeEntries.filter(
        (e) => e.clockIn >= periodStart && e.clockIn <= periodEnd && e.clockOut != null
      );
      const totalMinutes = monthEntries.reduce((sum, e) => sum + (e.totalMinutes || 0), 0);
      const hoursWorked = Number((totalMinutes / 60).toFixed(1));

      const id = await ctx.db.insert("payrollRecords", {
        userId: config.userId,
        period,
        baseSalary,
        allowances,
        grossPay,
        napsaDeduction,
        nhimaDeduction,
        payeDeduction,
        netPay,
        hoursWorked,
        status: "draft",
        createdBy,
        createdAt: Date.now(),
      });
      createdIds.push(id);
    }

    await ctx.db.insert("activityLogs", {
      action: "Payroll Generated",
      category: "admin",
      performedBy: createdBy,
      target: period,
      details: `Generated ${createdIds.length} draft payroll pay slips for period ${period}`,
      timestamp: Date.now(),
    });

    return { count: createdIds.length };
  },
});

export const approvePayroll = mutation({
  args: {
    period: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, { period, adminEmail }) => {
    const records = await ctx.db
      .query("payrollRecords")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();

    let approvedCount = 0;
    for (const record of records) {
      if (record.status === "draft") {
        await ctx.db.patch(record._id, { status: "approved" });
        approvedCount++;
      }
    }

    await ctx.db.insert("activityLogs", {
      action: "Payroll Approved",
      category: "admin",
      performedBy: adminEmail,
      target: period,
      details: `Approved ${approvedCount} draft payroll slips for period ${period}`,
      timestamp: Date.now(),
    });

    return { approvedCount };
  },
});

export const markPaid = mutation({
  args: {
    period: v.string(),
    adminEmail: v.string(),
  },
  handler: async (ctx, { period, adminEmail }) => {
    const records = await ctx.db
      .query("payrollRecords")
      .withIndex("by_period", (q) => q.eq("period", period))
      .collect();

    let paidCount = 0;
    for (const record of records) {
      if (record.status === "approved") {
        await ctx.db.patch(record._id, { status: "paid", paidAt: Date.now() });
        paidCount++;

        // Log salary expense dynamically in the expenses table!
        // This coordinates our payroll system directly with the clinic expenses ledger!
        await ctx.db.insert("expenses", {
          description: `Staff Salary Payment - ${record.userId} (${period})`,
          amount: record.netPay,
          category: "salaries",
          date: Date.now(),
          vendorName: "Staff Member",
          paymentMethod: "bank_transfer",
          notes: `Payroll net salary payout for ${period}`,
          isArchived: false,
          createdBy: adminEmail,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.insert("activityLogs", {
      action: "Payroll Paid & Ledger Logged",
      category: "admin",
      performedBy: adminEmail,
      target: period,
      details: `Marked ${paidCount} approved payroll slips as paid for ${period} and recorded expenses in the general ledger`,
      timestamp: Date.now(),
    });

    return { paidCount };
  },
});

// ── Update Draft Payroll Record & Recalculate Deductions ────────────────────────
export const updateDraftPayrollRecord = mutation({
  args: {
    id: v.id("payrollRecords"),
    baseSalary: v.number(),
    allowances: v.number(),
    hoursWorked: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Payroll record not found");
    if (existing.status !== "draft") throw new Error("Only draft payroll records can be edited");

    const grossPay = args.baseSalary + args.allowances;

    // Fetch config to retrieve rates
    const config = await ctx.db
      .query("staffSalaryConfig")
      .withIndex("by_userId", (q) => q.eq("userId", existing.userId))
      .first();

    const napsaRate = config?.napsaRate ?? 0.05;
    const nhimaRate = config?.nhimaRate ?? 0.01;

    // Deductions recalculation
    const napsaDeduction = Number((grossPay * napsaRate).toFixed(2));
    const nhimaDeduction = Number((grossPay * nhimaRate).toFixed(2));
    const payeDeduction = calculatePAYE(grossPay);
    
    const netPay = Number((grossPay - (napsaDeduction + nhimaDeduction + payeDeduction)).toFixed(2));

    await ctx.db.patch(args.id, {
      baseSalary: args.baseSalary,
      allowances: args.allowances,
      hoursWorked: args.hoursWorked,
      grossPay,
      napsaDeduction,
      nhimaDeduction,
      payeDeduction,
      netPay,
      notes: args.notes,
    });
  },
});
