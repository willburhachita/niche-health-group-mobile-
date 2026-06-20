// ── Desktop role / permission matrix ────────────────────────────────────────
// Mirrors src/utils/authHelpers.js — keep these two files in sync.
//
// Roles:
//   admin           — full access (clinic, financial, staff admin, clinic settings)
//   moderator_plus  — "Power Receptionist": clinical + financial (no staff admin)
//   moderator       — "Receptionist": clinical only, no financial detail
//   bookkeeper      — financial only + read-only patient list
//   member          — messaging + own profile only

export type Role = 'admin' | 'moderator_plus' | 'moderator' | 'bookkeeper' | 'member';

export type Permission =
  // Admin / system
  | 'adminPanel' | 'manageStaff' | 'approveDevices' | 'viewActivityLogs' | 'viewAnalytics' | 'editClinicSettings'
  // Clinic dashboard / patients
  | 'clinicDashboard' | 'viewPatients' | 'createPatient' | 'editPatient' | 'archivePatient'
  // Appointments
  | 'viewAppointments' | 'createAppointment' | 'editAppointment' | 'archiveAppointment'
  // Treatment notes
  | 'viewTreatmentNote' | 'createTreatmentNote' | 'editTreatmentNote'
  // Stock / suppliers
  | 'manageStock' | 'archiveStock' | 'manageSuppliers' | 'archiveSupplier'
  // Financial
  | 'viewFinancials' | 'createInvoice' | 'editInvoice' | 'archiveInvoice'
  | 'recordPayment' | 'managePayments' | 'manageExpenses' | 'archiveExpense'
  | 'viewReports' | 'manageReports'
  // Telehealth & comms
  | 'manageTelehealth' | 'messaging' | 'channels' | 'manageChannels' | 'sendAnnouncements'
  // Shifts / time
  | 'viewShifts' | 'manageShifts' | 'clockInOut';

export const PERMISSION_KEYS: Permission[] = [
  'adminPanel', 'manageStaff', 'approveDevices', 'viewActivityLogs', 'viewAnalytics', 'editClinicSettings',
  'clinicDashboard', 'viewPatients', 'createPatient', 'editPatient', 'archivePatient',
  'viewAppointments', 'createAppointment', 'editAppointment', 'archiveAppointment',
  'viewTreatmentNote', 'createTreatmentNote', 'editTreatmentNote',
  'manageStock', 'archiveStock', 'manageSuppliers', 'archiveSupplier',
  'viewFinancials', 'createInvoice', 'editInvoice', 'archiveInvoice',
  'recordPayment', 'managePayments', 'manageExpenses', 'archiveExpense',
  'viewReports', 'manageReports',
  'manageTelehealth', 'messaging', 'channels', 'manageChannels', 'sendAnnouncements',
  'viewShifts', 'manageShifts', 'clockInOut',
];

export type PermissionMap = Record<Permission, boolean>;

const ALL_TRUE = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as PermissionMap
);
const ALL_FALSE = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as PermissionMap
);

export const PERMISSIONS: Record<Role, PermissionMap> = {
  admin: { ...ALL_TRUE },

  moderator_plus: {
    ...ALL_TRUE,
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,
    // Archiving is admin-only
    archivePatient: false,
    archiveAppointment: false,
    archiveStock: false,
    archiveSupplier: false,
    archiveInvoice: false,
    archiveExpense: false,
    // Editing finalised invoices is admin-only
    editInvoice: false,
  },

  moderator: {
    ...ALL_FALSE,
    clinicDashboard: true,
    viewPatients: true,
    createPatient: true,
    editPatient: true,
    viewAppointments: true,
    createAppointment: true,
    editAppointment: true,
    viewTreatmentNote: true,
    createTreatmentNote: true,
    editTreatmentNote: true,
    manageStock: true,
    manageSuppliers: true,
    manageTelehealth: true,
    messaging: true,
    channels: true,
    viewShifts: true,
    manageShifts: true,
    clockInOut: true,
  },

  bookkeeper: {
    ...ALL_FALSE,
    clinicDashboard: true,
    viewPatients: true,
    viewAppointments: true,
    viewFinancials: true,
    createInvoice: true,
    recordPayment: true,
    managePayments: true,
    manageExpenses: true,
    viewReports: true,
    manageReports: true,
    messaging: true,
    channels: true,
    viewShifts: true,
    clockInOut: true,
  },

  member: {
    ...ALL_FALSE,
    messaging: true,
    channels: true,
    viewShifts: true,
    clockInOut: true,
  },
};

export function getPermissionsForRole(role: string | undefined | null): PermissionMap {
  if (!role) return PERMISSIONS.member;
  const normalized = role.toLowerCase() as Role;
  return PERMISSIONS[normalized] ?? PERMISSIONS.member;
}

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  return getPermissionsForRole(role)[permission] === true;
}

// ── Granular Categorized Permission Groups ────────────────────────────
export interface PermissionGroup {
  category: string;
  permissions: { key: Permission; label: string; desc: string }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    category: 'Admin & Security',
    permissions: [
      { key: 'adminPanel', label: 'Admin Panel', desc: 'Access overall administration settings' },
      { key: 'manageStaff', label: 'Manage Staff', desc: 'Create, edit, or archive staff accounts' },
      { key: 'approveDevices', label: 'Approve Devices', desc: 'Approve or reject device trusted logs' },
      { key: 'viewActivityLogs', label: 'View Activity Logs', desc: 'See full database and audit trail history' },
      { key: 'viewAnalytics', label: 'View Analytics', desc: 'View global clinic dashboard analytics' },
      { key: 'editClinicSettings', label: 'Clinic Settings', desc: 'Modify global configurations and rules' },
    ]
  },
  {
    category: 'Clinic & Patients',
    permissions: [
      { key: 'clinicDashboard', label: 'Clinic Dashboard', desc: 'Access general clinic list sections' },
      { key: 'viewPatients', label: 'View Patients', desc: 'Read patient records and folders' },
      { key: 'createPatient', label: 'Create Patients', desc: 'Add new patient profiles' },
      { key: 'editPatient', label: 'Edit Patients', desc: 'Modify patient details' },
      { key: 'archivePatient', label: 'Archive Patients', desc: 'Archive patient folders (Admin restricted)' },
    ]
  },
  {
    category: 'Appointments & SOAP Notes',
    permissions: [
      { key: 'viewAppointments', label: 'View Appointments', desc: 'See clinic schedules and rostered visits' },
      { key: 'createAppointment', label: 'Create Appointments', desc: 'Add new appointments to schedule' },
      { key: 'editAppointment', label: 'Edit Appointments', desc: 'Reschedule or modify scheduled visits' },
      { key: 'archiveAppointment', label: 'Archive Appointments', desc: 'Remove bookings or cancel appointments' },
      { key: 'viewTreatmentNote', label: 'View SOAP Notes', desc: 'Read past diagnostic consult sheets' },
      { key: 'createTreatmentNote', label: 'Create SOAP Notes', desc: 'Author clinical consult notes' },
      { key: 'editTreatmentNote', label: 'Edit SOAP Notes', desc: 'Edit consultation entries' },
    ]
  },
  {
    category: 'Stock & Suppliers',
    permissions: [
      { key: 'manageStock', label: 'Manage Inventory', desc: 'Access and modify stock counts and catalog' },
      { key: 'archiveStock', label: 'Archive Stock', desc: 'Permanently remove stock items' },
      { key: 'manageSuppliers', label: 'Manage Suppliers', desc: 'Manage supplier accounts and banks' },
      { key: 'archiveSupplier', label: 'Archive Suppliers', desc: 'Delete supplier catalog configurations' },
    ]
  },
  {
    category: 'Financial & Billing',
    permissions: [
      { key: 'viewFinancials', label: 'Financial Access', desc: 'Access invoice ledgers, expenses, and accounting hub' },
      { key: 'createInvoice', label: 'Create Invoices', desc: 'Generate patient invoices' },
      { key: 'editInvoice', label: 'Edit Invoices', desc: 'Modify finalized patient invoices' },
      { key: 'archiveInvoice', label: 'Archive Invoices', desc: 'Remove billing statements' },
      { key: 'recordPayment', label: 'Collect Payments', desc: 'Record multi-source cashless payments' },
      { key: 'managePayments', label: 'Manage Payments', desc: 'Access payment histories' },
      { key: 'manageExpenses', label: 'Manage Expenses', desc: 'Track clinic purchases and utility outlays' },
      { key: 'archiveExpense', label: 'Archive Expenses', desc: 'Permanently remove expense transactions' },
      { key: 'viewReports', label: 'View Reports', desc: 'Review monthly charts and summaries' },
      { key: 'manageReports', label: 'Configure Reports', desc: 'Generate high-level cashflow comparisons' },
    ]
  },
  {
    category: 'Communications & Telehealth',
    permissions: [
      { key: 'manageTelehealth', label: 'Telehealth Consults', desc: 'Invite patients to video consultations' },
      { key: 'messaging', label: 'Direct Messages', desc: 'Access colleague chats' },
      { key: 'channels', label: 'Channels Access', desc: 'Join global staff channels' },
      { key: 'manageChannels', label: 'Manage Channels', desc: 'Create or delete public channels' },
      { key: 'sendAnnouncements', label: 'Send Announcements', desc: 'Broadcast global notices' },
    ]
  },
  {
    category: 'Shifts & Attendance',
    permissions: [
      { key: 'viewShifts', label: 'View Shifts', desc: 'See scheduled staffing schedules' },
      { key: 'manageShifts', label: 'Manage Roster', desc: 'Assign shifts and set schedules' },
      { key: 'clockInOut', label: 'Clock In/Out', desc: 'Track daily attendance working hours' },
    ]
  }
];

// Preset Templates
export const PRESETS: Record<'practitioner' | 'nurse' | 'accountant' | 'manager', Permission[]> = {
  practitioner: [
    'clinicDashboard', 'viewPatients', 'createPatient', 'editPatient',
    'viewAppointments', 'createAppointment', 'editAppointment',
    'viewTreatmentNote', 'createTreatmentNote', 'editTreatmentNote',
    'manageTelehealth', 'messaging', 'channels',
    'viewShifts', 'clockInOut'
  ],
  nurse: [
    'clinicDashboard', 'viewPatients', 'createPatient', 'editPatient',
    'viewAppointments', 'createAppointment', 'editAppointment',
    'viewTreatmentNote', // Read consults but no creation of SOAP note
    'manageTelehealth', 'messaging', 'channels',
    'viewShifts', 'clockInOut'
  ],
  accountant: [
    'clinicDashboard', 'viewPatients', 'viewAppointments',
    'viewFinancials', 'createInvoice', 'recordPayment', 'managePayments', 'manageExpenses', 'viewReports', 'manageReports',
    'messaging', 'channels',
    'viewShifts', 'clockInOut'
  ],
  manager: [
    'clinicDashboard', 'viewPatients', 'createPatient', 'editPatient',
    'viewAppointments', 'createAppointment', 'editAppointment',
    'viewTreatmentNote', 'createTreatmentNote', 'editTreatmentNote',
    'manageStock', 'manageSuppliers',
    'viewFinancials', 'createInvoice', 'recordPayment', 'managePayments', 'manageExpenses', 'viewReports', 'manageReports',
    'manageTelehealth', 'messaging', 'channels', 'manageChannels', 'sendAnnouncements',
    'viewShifts', 'manageShifts', 'clockInOut'
  ]
};
