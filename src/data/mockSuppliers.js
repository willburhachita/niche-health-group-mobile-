const now = Date.now();
const day = 86400000;

export const mockSuppliers = [
  {
    id: 'sup-001',
    name: 'MedSupply Zambia Ltd',
    contactPerson: 'David Kangwa',
    phone: '+260971500001',
    email: 'orders@medsupply.co.zm',
    address: '12 Industrial Rd, Lusaka',
    notes: 'Primary supplier for dialysis consumables. Delivery within 48 hours.',
    isFrequent: true,
    orderCount: 14,
    lastOrderDate: now - 3 * day,
    createdBy: 'user-005',
    createdAt: now - 365 * day,
    updatedAt: now - 3 * day,
  },
  {
    id: 'sup-002',
    name: 'PharmaCare International',
    contactPerson: 'Susan Tembo',
    phone: '+260971500002',
    email: 'sales@pharmacare.com',
    address: '45 Cairo Road, Lusaka',
    notes: 'Pharmaceutical supplier. Minimum order K5,000.',
    isFrequent: true,
    orderCount: 8,
    lastOrderDate: now - 7 * day,
    createdBy: 'user-005',
    createdAt: now - 300 * day,
    updatedAt: now - 7 * day,
  },
  {
    id: 'sup-003',
    name: 'Zambia Medical Equipment Co',
    contactPerson: 'Peter Mulenga',
    phone: '+260971500003',
    email: 'info@zammedequip.co.zm',
    address: '78 Great East Road, Lusaka',
    notes: 'Equipment and large orders. Lead time 2 weeks.',
    isFrequent: false,
    orderCount: 3,
    lastOrderDate: now - 60 * day,
    createdBy: 'user-005',
    createdAt: now - 200 * day,
    updatedAt: now - 60 * day,
  },
  {
    id: 'sup-004',
    name: 'NovaChem Laboratories',
    contactPerson: 'Grace Phiri',
    phone: '+260971500004',
    email: 'supply@novachem.co.zm',
    address: '22 Lumumba Road, Lusaka',
    notes: 'Lab reagents and testing kits.',
    isFrequent: true,
    orderCount: 6,
    lastOrderDate: now - 14 * day,
    createdBy: 'user-005',
    createdAt: now - 150 * day,
    updatedAt: now - 14 * day,
  },
];

export function getSupplierById(id) {
  return mockSuppliers.find(s => s.id === id);
}

export function searchSuppliers(query) {
  const q = query.toLowerCase();
  return mockSuppliers.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.contactPerson?.toLowerCase().includes(q)
  );
}
