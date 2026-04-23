const now = Date.now();
const day = 86400000;

export const EXPENSE_CATEGORIES = [
  { key: 'medical_supplies', label: 'Medical Supplies', icon: 'package', color: '#3B4B8A' },
  { key: 'equipment', label: 'Equipment', icon: 'tool', color: '#F0A882' },
  { key: 'utilities', label: 'Utilities', icon: 'zap', color: '#D4892E' },
  { key: 'salaries', label: 'Salaries', icon: 'users', color: '#2E7D5B' },
  { key: 'maintenance', label: 'Maintenance', icon: 'settings', color: '#8E8E9A' },
  { key: 'other', label: 'Other', icon: 'more-horizontal', color: '#4A4A5A' },
];

export const mockExpenses = [
  {
    id: 'exp-001',
    description: 'Monthly dialysis consumables restock',
    amount: 45000,
    category: 'medical_supplies',
    date: now - 3 * day,
    vendorName: 'MedSupply Zambia Ltd',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'BT-20260410-001',
    attachments: [
      { name: 'MedSupply_Invoice_April.pdf', type: 'pdf', size: 1250000 },
    ],
    notes: 'Regular monthly order. Includes heparin, dialysis lines, and filters.',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 3 * day,
    updatedAt: now - 3 * day,
  },
  {
    id: 'exp-002',
    description: 'Electricity bill - March 2026',
    amount: 8500,
    category: 'utilities',
    date: now - 10 * day,
    vendorName: 'ZESCO',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'BT-20260403-002',
    attachments: [
      { name: 'ZESCO_March_2026.pdf', type: 'pdf', size: 450000 },
    ],
    notes: 'Quarterly electricity payment.',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 10 * day,
    updatedAt: now - 10 * day,
  },
  {
    id: 'exp-003',
    description: 'Dialysis machine filter replacement',
    amount: 12000,
    category: 'equipment',
    date: now - 7 * day,
    vendorName: 'Zambia Medical Equipment Co',
    paymentMethod: 'cash',
    referenceNumber: null,
    attachments: [
      { name: 'Receipt_Filter_Replacement.jpg', type: 'jpg', size: 800000 },
    ],
    notes: 'Emergency replacement for Machine #4.',
    createdBy: 'user-001',
    updatedBy: null,
    createdAt: now - 7 * day,
    updatedAt: now - 7 * day,
  },
  {
    id: 'exp-004',
    description: 'Lab reagents - CBC and KFT kits',
    amount: 18500,
    category: 'medical_supplies',
    date: now - 14 * day,
    vendorName: 'NovaChem Laboratories',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'BT-20260330-004',
    attachments: [],
    notes: 'Monthly lab supply order.',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 14 * day,
    updatedAt: now - 14 * day,
  },
  {
    id: 'exp-005',
    description: 'Plumbing repair - water treatment room',
    amount: 3200,
    category: 'maintenance',
    date: now - 5 * day,
    vendorName: 'QuickFix Maintenance',
    paymentMethod: 'cash',
    referenceNumber: null,
    attachments: [
      { name: 'Plumbing_Receipt.jpg', type: 'jpg', size: 500000 },
    ],
    notes: 'Emergency plumbing repair for water treatment unit.',
    createdBy: 'user-005',
    updatedBy: null,
    createdAt: now - 5 * day,
    updatedAt: now - 5 * day,
  },
];

export function getExpenseById(id) {
  return mockExpenses.find(e => e.id === id);
}

export function getExpensesByCategory(category) {
  return mockExpenses.filter(e => e.category === category);
}

export function getExpensesSummary() {
  const total = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = {};
  mockExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  });
  return { total, byCategory };
}

export function getCategoryLabel(key) {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.label || key;
}

export function getCategoryIcon(key) {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.icon || 'more-horizontal';
}

export function getCategoryColor(key) {
  return EXPENSE_CATEGORIES.find(c => c.key === key)?.color || '#4A4A5A';
}
