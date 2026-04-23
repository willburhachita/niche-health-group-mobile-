const now = Date.now();
const day = 86400000;

export const TAX_TYPES = [
  { key: 'vat_16', label: 'VAT (16%)', rate: 0.16 },
  { key: 'zero_rated', label: 'Zero-rated', rate: 0 },
  { key: 'exempt', label: 'Exempt', rate: 0 },
];

export const INCREASE_REASONS = [
  { key: 'stock_purchase', label: 'Stock Purchase' },
  { key: 'returned', label: 'Returned' },
  { key: 'other_increase', label: 'Other' },
];

export const DECREASE_REASONS = [
  { key: 'damaged', label: 'Damaged' },
  { key: 'out_of_date', label: 'Out of Date' },
  { key: 'used', label: 'Used / Consumed' },
  { key: 'other_decrease', label: 'Other' },
];

export const mockStockItems = [
  {
    id: 'stk-001',
    itemCode: 'STK-001',
    name: 'Heparin 5000 IU/mL',
    serialNumber: 'HEP-2026-A',
    supplierId: 'sup-001',
    pricePerItem: 85,
    includesTax: false,
    taxType: 'vat_16',
    taxRate: 0.16,
    costPrice: 98.6,
    stockLevel: 450,
    reorderLevel: 100,
    expiryDate: now + 180 * day,
    notes: 'Store between 2-8 degrees Celsius.',
    status: 'active',
    createdBy: 'user-005',
    updatedBy: 'user-001',
    createdAt: now - 90 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: 'stk-002',
    itemCode: 'STK-002',
    name: 'Dialysis Lines (Arterial)',
    serialNumber: 'DLA-2026-B',
    supplierId: 'sup-001',
    pricePerItem: 120,
    includesTax: false,
    taxType: 'vat_16',
    taxRate: 0.16,
    costPrice: 139.2,
    stockLevel: 75,
    reorderLevel: 30,
    expiryDate: now + 365 * day,
    notes: 'Single-use. Dispose after each session.',
    status: 'active',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 90 * day,
    updatedAt: now - 30 * day,
  },
  {
    id: 'stk-003',
    itemCode: 'STK-003',
    name: 'Erythropoietin 4000 IU',
    serialNumber: 'EPO-2026-C',
    supplierId: 'sup-002',
    pricePerItem: 450,
    includesTax: true,
    taxType: 'vat_16',
    taxRate: 0.16,
    costPrice: 450,
    stockLevel: 22,
    reorderLevel: 20,
    expiryDate: now + 60 * day,
    notes: 'Refrigerate. Check stock weekly.',
    status: 'active',
    createdBy: 'user-001',
    updatedBy: null,
    createdAt: now - 60 * day,
    updatedAt: now - 5 * day,
  },
  {
    id: 'stk-004',
    itemCode: 'STK-004',
    name: 'Syringes 10mL',
    serialNumber: null,
    supplierId: 'sup-001',
    pricePerItem: 3.5,
    includesTax: false,
    taxType: 'exempt',
    taxRate: 0,
    costPrice: 3.5,
    stockLevel: 2000,
    reorderLevel: 500,
    expiryDate: now + 730 * day,
    notes: 'Bulk order. Standard Luer lock.',
    status: 'active',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 120 * day,
    updatedAt: now - 10 * day,
  },
  {
    id: 'stk-005',
    itemCode: 'STK-005',
    name: 'Ferrous Sulphate 200mg Tabs',
    serialNumber: 'FER-2026-D',
    supplierId: 'sup-002',
    pricePerItem: 0.8,
    includesTax: false,
    taxType: 'exempt',
    taxRate: 0,
    costPrice: 0.8,
    stockLevel: 5000,
    reorderLevel: 1000,
    expiryDate: now + 300 * day,
    notes: 'Iron supplement. Dispense with Vitamin C advice.',
    status: 'active',
    createdBy: 'user-004',
    updatedBy: null,
    createdAt: now - 60 * day,
    updatedAt: now - 7 * day,
  },
  {
    id: 'stk-006',
    itemCode: 'STK-006',
    name: 'Calcium Carbonate 500mg',
    serialNumber: 'CAL-2026-E',
    supplierId: 'sup-002',
    pricePerItem: 1.2,
    includesTax: false,
    taxType: 'exempt',
    taxRate: 0,
    costPrice: 1.2,
    stockLevel: 3,
    reorderLevel: 500,
    expiryDate: now + 25 * day,
    notes: 'LOW STOCK - reorder immediately.',
    status: 'active',
    createdBy: 'user-004',
    updatedBy: null,
    createdAt: now - 100 * day,
    updatedAt: now - day,
  },
  {
    id: 'stk-007',
    itemCode: 'STK-007',
    name: 'Iron Sucrose IV 100mg/5mL',
    serialNumber: 'ISU-2025-F',
    supplierId: 'sup-004',
    pricePerItem: 280,
    includesTax: true,
    taxType: 'vat_16',
    taxRate: 0.16,
    costPrice: 280,
    stockLevel: 8,
    reorderLevel: 10,
    expiryDate: now + 15 * day,
    notes: 'Expiring soon. Use first.',
    status: 'active',
    createdBy: 'user-001',
    updatedBy: null,
    createdAt: now - 200 * day,
    updatedAt: now - 2 * day,
  },
  {
    id: 'stk-008',
    itemCode: 'STK-008',
    name: 'Amoxicillin 500mg Caps',
    serialNumber: 'AMX-2025-G',
    supplierId: 'sup-002',
    pricePerItem: 1.5,
    includesTax: false,
    taxType: 'exempt',
    taxRate: 0,
    costPrice: 1.5,
    stockLevel: 0,
    reorderLevel: 200,
    expiryDate: now - 10 * day,
    notes: 'EXPIRED. Do not dispense.',
    status: 'active',
    createdBy: 'user-004',
    updatedBy: null,
    createdAt: now - 300 * day,
    updatedAt: now - 10 * day,
  },
];

export const mockStockAdjustments = [
  { id: 'adj-001', stockItemId: 'stk-001', adjustmentType: 'increase', reason: 'stock_purchase', quantity: 200, previousLevel: 250, newLevel: 450, notes: 'Monthly restock from MedSupply', adjustedBy: 'user-005', adjustedAt: now - 2 * day, linkedInvoiceId: null },
  { id: 'adj-002', stockItemId: 'stk-003', adjustmentType: 'decrease', reason: 'used', quantity: 3, previousLevel: 25, newLevel: 22, notes: 'Used for 3 dialysis patients', adjustedBy: 'user-001', adjustedAt: now - 5 * day, linkedInvoiceId: 'inv-001' },
  { id: 'adj-003', stockItemId: 'stk-006', adjustmentType: 'decrease', reason: 'damaged', quantity: 50, previousLevel: 53, newLevel: 3, notes: 'Water damage in storage room', adjustedBy: 'user-004', adjustedAt: now - day, linkedInvoiceId: null },
  { id: 'adj-004', stockItemId: 'stk-002', adjustmentType: 'increase', reason: 'returned', quantity: 5, previousLevel: 70, newLevel: 75, notes: 'Returned unused from Bay 3', adjustedBy: 'user-002', adjustedAt: now - 3 * day, linkedInvoiceId: null },
  { id: 'adj-005', stockItemId: 'stk-008', adjustmentType: 'decrease', reason: 'out_of_date', quantity: 150, previousLevel: 150, newLevel: 0, notes: 'Expired batch disposed', adjustedBy: 'user-004', adjustedAt: now - 10 * day, linkedInvoiceId: null },
];

export function getStockItemById(id) {
  return mockStockItems.find(s => s.id === id);
}

export function searchStockItems(query) {
  const q = query.toLowerCase();
  return mockStockItems.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.itemCode.toLowerCase().includes(q)
  );
}

export function getLowStockItems() {
  return mockStockItems.filter(s => s.status === 'active' && s.stockLevel <= s.reorderLevel);
}

export function getExpiringSoonItems(withinDays = 90) {
  const cutoff = now + withinDays * day;
  return mockStockItems.filter(s => s.status === 'active' && s.expiryDate && s.expiryDate <= cutoff && s.expiryDate > now);
}

export function getExpiredItems() {
  return mockStockItems.filter(s => s.expiryDate && s.expiryDate <= now);
}

export function getOutOfStockItems() {
  return mockStockItems.filter(s => s.status === 'active' && s.stockLevel === 0);
}

export function getAdjustmentsForItem(stockItemId) {
  return mockStockAdjustments
    .filter(a => a.stockItemId === stockItemId)
    .sort((a, b) => b.adjustedAt - a.adjustedAt);
}

export function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
