import { mutation } from "./_generated/server";

/**
 * Seed stock items into the stockItems table.
 *
 * Run via:  npx convex run seedStock:seedStockItems
 *
 * Safe to re-run — it checks each itemCode and skips duplicates.
 */
export const seedStockItems = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // All stock items to seed
    const items = [
      // ── Bloodlines ──────────────────────────────────────────────────
      {
        itemCode: "4008",
        name: "4008 Bloodline",
        pricePerItem: 45.00,
        costPrice: 32.00,
        stockLevel: 150,
        reorderLevel: 30,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Bloodline tubing set compatible with Fresenius 4008 dialysis machines",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "5008",
        name: "5008 Bloodline",
        pricePerItem: 52.00,
        costPrice: 38.00,
        stockLevel: 120,
        reorderLevel: 25,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Bloodline tubing set compatible with Fresenius 5008/5008S dialysis machines",
        expiryDate: now + 365 * 86400000,
      },
      // ── Bibags ──────────────────────────────────────────────────────
      {
        itemCode: "5008",
        name: "5008 Bibag",
        pricePerItem: 38.00,
        costPrice: 26.00,
        stockLevel: 200,
        reorderLevel: 40,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Bicarbonate bibag for Fresenius 5008/5008S dialysis machines",
        expiryDate: now + 270 * 86400000,
      },
      {
        itemCode: "4008",
        name: "4008 Bibag",
        pricePerItem: 35.00,
        costPrice: 24.00,
        stockLevel: 180,
        reorderLevel: 40,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Bicarbonate bibag for Fresenius 4008 dialysis machines",
        expiryDate: now + 270 * 86400000,
      },
      // ── Dialysers ───────────────────────────────────────────────────
      {
        itemCode: "FX60",
        name: "Fx 60 Dialyser",
        pricePerItem: 85.00,
        costPrice: 62.00,
        stockLevel: 80,
        reorderLevel: 20,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Fresenius FX 60 high-flux dialyser — surface area 1.4m²",
        expiryDate: now + 540 * 86400000,
      },
      {
        itemCode: "FX80",
        name: "Fx 80 Dialyser",
        pricePerItem: 95.00,
        costPrice: 70.00,
        stockLevel: 75,
        reorderLevel: 20,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Fresenius FX 80 high-flux dialyser — surface area 1.8m²",
        expiryDate: now + 540 * 86400000,
      },
      {
        itemCode: "FX100",
        name: "Fx 100 Dialyser",
        pricePerItem: 110.00,
        costPrice: 82.00,
        stockLevel: 60,
        reorderLevel: 15,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Fresenius FX 100 high-flux dialyser — surface area 2.2m²",
        expiryDate: now + 540 * 86400000,
      },
      // ── Syringes ────────────────────────────────────────────────────
      {
        itemCode: "SYR5",
        name: "5ml Syringe",
        pricePerItem: 1.50,
        costPrice: 0.80,
        stockLevel: 500,
        reorderLevel: 100,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Disposable 5ml luer-lock syringe",
        expiryDate: now + 730 * 86400000,
      },
      {
        itemCode: "SYR10",
        name: "10ml Syringe",
        pricePerItem: 2.00,
        costPrice: 1.10,
        stockLevel: 450,
        reorderLevel: 100,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Disposable 10ml luer-lock syringe",
        expiryDate: now + 730 * 86400000,
      },
      {
        itemCode: "SYR20",
        name: "20ml Syringe",
        pricePerItem: 3.00,
        costPrice: 1.60,
        stockLevel: 350,
        reorderLevel: 80,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Disposable 20ml luer-lock syringe",
        expiryDate: now + 730 * 86400000,
      },
      // ── Needles ─────────────────────────────────────────────────────
      {
        itemCode: "NDL21G",
        name: "21g Needle",
        pricePerItem: 0.80,
        costPrice: 0.35,
        stockLevel: 600,
        reorderLevel: 150,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "21 gauge hypodermic needle — green hub",
        expiryDate: now + 730 * 86400000,
      },
      {
        itemCode: "NDL23G",
        name: "23g Needle",
        pricePerItem: 0.80,
        costPrice: 0.35,
        stockLevel: 550,
        reorderLevel: 150,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "23 gauge hypodermic needle — blue hub",
        expiryDate: now + 730 * 86400000,
      },
      // ── Injectables / Fluids ────────────────────────────────────────
      {
        itemCode: "WFI10",
        name: "Water for Injection 10ml",
        pricePerItem: 3.50,
        costPrice: 1.80,
        stockLevel: 300,
        reorderLevel: 60,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sterile water for injection 10ml ampoule",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "NS500",
        name: "Normal Saline 500ml",
        pricePerItem: 12.00,
        costPrice: 7.50,
        stockLevel: 200,
        reorderLevel: 50,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sodium Chloride 0.9% IV infusion — 500ml bag",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "NS1000",
        name: "Normal Saline 1 Litre",
        pricePerItem: 18.00,
        costPrice: 11.00,
        stockLevel: 150,
        reorderLevel: 40,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sodium Chloride 0.9% IV infusion — 1000ml bag",
        expiryDate: now + 365 * 86400000,
      },
      // ── PPE / Consumables ───────────────────────────────────────────
      {
        itemCode: "FMSK",
        name: "Face Mask",
        pricePerItem: 2.50,
        costPrice: 1.20,
        stockLevel: 1000,
        reorderLevel: 200,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Disposable 3-ply surgical face mask",
        expiryDate: now + 730 * 86400000,
      },
      {
        itemCode: "SG70",
        name: "Sterile Gloves 7.0",
        pricePerItem: 5.00,
        costPrice: 2.80,
        stockLevel: 300,
        reorderLevel: 60,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sterile surgical gloves size 7.0 — powder-free latex",
        expiryDate: now + 540 * 86400000,
      },
      {
        itemCode: "SG75",
        name: "Sterile Gloves 7.5",
        pricePerItem: 5.00,
        costPrice: 2.80,
        stockLevel: 350,
        reorderLevel: 60,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sterile surgical gloves size 7.5 — powder-free latex",
        expiryDate: now + 540 * 86400000,
      },
      {
        itemCode: "SG80",
        name: "Sterile Gloves 8.0",
        pricePerItem: 5.00,
        costPrice: 2.80,
        stockLevel: 250,
        reorderLevel: 50,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Sterile surgical gloves size 8.0 — powder-free latex",
        expiryDate: now + 540 * 86400000,
      },
      // ── Dressing Sets ───────────────────────────────────────────────
      {
        itemCode: "CATHD",
        name: "Catheter Dressing Set",
        pricePerItem: 15.00,
        costPrice: 9.50,
        stockLevel: 120,
        reorderLevel: 30,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Sterile catheter dressing pack — includes swabs, drape, tape",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "FISD",
        name: "Fistula Dressing Set",
        pricePerItem: 12.00,
        costPrice: 7.00,
        stockLevel: 130,
        reorderLevel: 30,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Sterile fistula dressing pack — includes swabs, plasters, gauze",
        expiryDate: now + 365 * 86400000,
      },
      // ── Medications ─────────────────────────────────────────────────
      {
        itemCode: "HEP25K",
        name: "Heparin 25000iu",
        pricePerItem: 35.00,
        costPrice: 22.00,
        stockLevel: 100,
        reorderLevel: 25,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Heparin Sodium 25,000 IU/5ml — anticoagulant for dialysis circuits",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "IRON100",
        name: "Iron Sucrose 100mg",
        pricePerItem: 45.00,
        costPrice: 30.00,
        stockLevel: 80,
        reorderLevel: 20,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Iron Sucrose 100mg/5ml IV — for iron deficiency anaemia in CKD patients",
        expiryDate: now + 365 * 86400000,
      },
      {
        itemCode: "EPO4K",
        name: "Erythropoietin 4000iu",
        pricePerItem: 120.00,
        costPrice: 85.00,
        stockLevel: 60,
        reorderLevel: 15,
        taxType: "zero_rated",
        taxRate: 0,
        includesTax: false,
        notes: "Erythropoietin 4000 IU prefilled syringe — for renal anaemia management",
        expiryDate: now + 270 * 86400000,
      },
      // ── Dialysis Concentrate ────────────────────────────────────────
      {
        itemCode: "NDC5L",
        name: "Niche Dialysis Concentrate 5L",
        pricePerItem: 65.00,
        costPrice: 42.00,
        stockLevel: 100,
        reorderLevel: 25,
        taxType: "vat_16",
        taxRate: 0.16,
        includesTax: false,
        notes: "Niche Healthcare acid concentrate 5L canister for haemodialysis",
        expiryDate: now + 365 * 86400000,
      },
    ];

    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      // Check if item already exists by itemCode
      const existing = await ctx.db
        .query("stockItems")
        .withIndex("by_itemCode", (q) => q.eq("itemCode", item.itemCode))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("stockItems", {
        ...item,
        status: "active",
        createdBy: "system",
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
    }

    return `Stock seed complete: ${inserted} inserted, ${skipped} skipped (already existed).`;
  },
});

/**
 * One-off cleanup: remove the incorrectly-inserted 5008-BIB record.
 * Run via:  npx convex run seedStock:removeBibagDuplicate
 */
export const removeBibagDuplicate = mutation({
  args: {},
  handler: async (ctx) => {
    const item = await ctx.db
      .query("stockItems")
      .withIndex("by_itemCode", (q) => q.eq("itemCode", "5008-BIB"))
      .first();

    if (!item) {
      return "No 5008-BIB record found — nothing to remove.";
    }

    await ctx.db.delete(item._id);
    return `Deleted 5008-BIB record (id: ${item._id}).`;
  },
});
