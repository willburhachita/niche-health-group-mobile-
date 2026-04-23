const now = Date.now();

export const mockAnnouncements = [
  {
    id: 'ann-001',
    title: 'Updated SOPs for Q1 2026',
    body: 'All staff are advised that the Standard Operating Procedures for dialysis treatment have been updated. The key changes include new monitoring intervals for patients with elevated blood pressure during treatment, updated fluid balance recording requirements, and revised emergency protocols for machine malfunction.\n\nPlease review the attached document and confirm your acknowledgement by end of this week. If you have questions, direct them to your department lead or Dr. Patel.',
    author: 'user-005',
    attachments: [
      { name: 'SOP_Dialysis_v3.2.pdf', size: 2516582, type: 'pdf' },
    ],
    acknowledgedBy: ['user-001', 'user-002', 'user-003'],
    totalStaff: 24,
    createdAt: now - 7200000,
  },
  {
    id: 'ann-002',
    title: 'Staff Meeting - April Schedule',
    body: 'Monthly staff meeting will be held on April 2nd at 10:00 AM in Conference Room A. Attendance is mandatory for all department leads.',
    author: 'user-005',
    attachments: [],
    acknowledgedBy: ['user-001'],
    totalStaff: 24,
    createdAt: now - 172800000,
  },
];

export const mockFiles = [
  { id: 'folder-001', name: 'Standard Operating Procedures', type: 'folder', itemCount: 12 },
  { id: 'folder-002', name: 'Training Materials', type: 'folder', itemCount: 8 },
  { id: 'folder-003', name: 'Policies & Guidelines', type: 'folder', itemCount: 5 },
  { id: 'file-001', name: 'Shift_Rota_March_2026.xlsx', type: 'xlsx', size: 250880, uploadedBy: 'user-005', uploadedAt: now - 259200000 },
  { id: 'file-002', name: 'Dialysis_Protocol_v3.2.pdf', type: 'pdf', size: 1887436, uploadedBy: 'user-003', uploadedAt: now - 604800000 },
  { id: 'file-003', name: 'Infection_Control_Guide.pdf', type: 'pdf', size: 3355443, uploadedBy: 'user-005', uploadedAt: now - 1209600000 },
];

export const mockDepartments = [
  { id: 'dept-001', name: 'Dialysis Unit', lead: 'user-001', memberCount: 8, channel: 'ch-001', description: 'Specialised renal dialysis treatment and monitoring' },
  { id: 'dept-002', name: 'Pharmacy', lead: 'user-004', memberCount: 4, channel: 'ch-004', description: 'Medication dispensing, stock control and procurement' },
  { id: 'dept-003', name: 'ICU', lead: 'user-003', memberCount: 6, channel: 'ch-007', description: 'Intensive care and critical patient management' },
  { id: 'dept-004', name: 'Night Shift', lead: 'user-006', memberCount: 4, channel: 'ch-006', description: 'Overnight patient care and monitoring' },
  { id: 'dept-005', name: 'Administration', lead: 'user-005', memberCount: 2, channel: null, description: 'System administration, HR and facility management' },
];

export const mockDevices = [
  { id: 'dev-001', deviceName: 'iPhone 15 Pro', platform: 'iOS', trustStatus: 'trusted', lastActiveAt: now, isCurrentDevice: true },
  { id: 'dev-002', deviceName: 'MacBook Pro', platform: 'Web - Chrome', trustStatus: 'trusted', lastActiveAt: now - 172800000, isCurrentDevice: false },
  { id: 'dev-003', deviceName: 'Samsung Galaxy S24', platform: 'Android', trustStatus: 'pending', lastActiveAt: now - 3600000, isCurrentDevice: false },
];
