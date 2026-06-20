// ── Roles & Permissions ─────────────────────────────────────────────────────
// Roles map to the matrix in §6 of may-2026-owner-feedback-assessment.md.
//   admin           — full access (clinic, financial, staff admin, clinic settings)
//   moderator_plus  — "Power Receptionist": clinical + financial (no staff admin)
//   moderator       — "Receptionist": clinical only, no financial detail
//   bookkeeper      — financial only + read-only patient list (no clinical edits)
//   member          — messaging + own profile only
export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Admin',
    description: 'Full access including staff admin and clinic settings',
  },
  moderator_plus: {
    key: 'moderator_plus',
    label: 'Moderator+',
    description: 'Clinical and financial access (no staff admin)',
  },
  moderator: {
    key: 'moderator',
    label: 'Moderator',
    description: 'Clinical access only — no financial detail',
  },
  bookkeeper: {
    key: 'bookkeeper',
    label: 'Bookkeeper',
    description: 'Financial only + read-only patient list',
  },
  member: {
    key: 'member',
    label: 'Member',
    description: 'Messaging and chat only',
  },
};

// Canonical permission keys. Every screen / mutation gate should reference
// one of these — never branch on role directly.
export const PERMISSION_KEYS = [
  // Admin / system
  'adminPanel', 'manageStaff', 'approveDevices', 'viewActivityLogs', 'viewAnalytics', 'editClinicSettings',
  // Clinic dashboard / patients
  'clinicDashboard', 'viewPatients', 'createPatient', 'editPatient', 'archivePatient',
  // Appointments
  'viewAppointments', 'createAppointment', 'editAppointment', 'archiveAppointment',
  // Treatment notes
  'viewTreatmentNote', 'createTreatmentNote', 'editTreatmentNote',
  // Stock / suppliers
  'manageStock', 'archiveStock', 'manageSuppliers', 'archiveSupplier',
  // Financial
  'viewFinancials', 'createInvoice', 'editInvoice', 'archiveInvoice',
  'recordPayment', 'managePayments', 'manageExpenses', 'archiveExpense',
  'viewReports', 'manageReports',
  // Telehealth & comms
  'manageTelehealth', 'messaging', 'channels', 'manageChannels', 'sendAnnouncements',
  // Shifts / time
  'viewShifts', 'manageShifts', 'clockInOut',
];

const ALL_TRUE = PERMISSION_KEYS.reduce((acc, k) => ({ ...acc, [k]: true }), {});

export const PERMISSIONS = {
  // ── Admin: everything ────────────────────────────────────────────────────
  admin: { ...ALL_TRUE },

  // ── Moderator+ : clinical + financial, no staff admin ────────────────────
  moderator_plus: {
    ...ALL_TRUE,
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,
    // Archiving is admin-only per M-07
    archivePatient: false,
    archiveAppointment: false,
    archiveStock: false,
    archiveSupplier: false,
    archiveInvoice: false,
    archiveExpense: false,
    // Editing finalised invoices is admin-only
    editInvoice: false,
  },

  // ── Moderator: clinical only, no financial detail ────────────────────────
  moderator: {
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,

    clinicDashboard: true,
    viewPatients: true,
    createPatient: true,
    editPatient: true,
    archivePatient: false,

    viewAppointments: true,
    createAppointment: true,
    editAppointment: true,
    archiveAppointment: false,

    viewTreatmentNote: true,
    createTreatmentNote: true,
    editTreatmentNote: true,

    manageStock: true,
    archiveStock: false,
    manageSuppliers: true,
    archiveSupplier: false,

    // No financial access
    viewFinancials: false,
    createInvoice: false,
    editInvoice: false,
    archiveInvoice: false,
    recordPayment: false,
    managePayments: false,
    manageExpenses: false,
    archiveExpense: false,
    viewReports: false,
    manageReports: false,

    manageTelehealth: true,
    messaging: true,
    channels: true,
    manageChannels: false,
    sendAnnouncements: false,

    viewShifts: true,
    manageShifts: true,
    clockInOut: true,
  },

  // ── Bookkeeper: financial only + read-only patient list ──────────────────
  bookkeeper: {
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,

    clinicDashboard: true,
    viewPatients: true,
    createPatient: false,
    editPatient: false,
    archivePatient: false,

    viewAppointments: true,
    createAppointment: false,
    editAppointment: false,
    archiveAppointment: false,

    viewTreatmentNote: false,
    createTreatmentNote: false,
    editTreatmentNote: false,

    manageStock: false,
    archiveStock: false,
    manageSuppliers: false,
    archiveSupplier: false,

    viewFinancials: true,
    createInvoice: true,
    editInvoice: false,
    archiveInvoice: false,
    recordPayment: true,
    managePayments: true,
    manageExpenses: true,
    archiveExpense: false,
    viewReports: true,
    manageReports: true,

    manageTelehealth: false,
    messaging: true,
    channels: true,
    manageChannels: false,
    sendAnnouncements: false,

    viewShifts: true,
    manageShifts: false,
    clockInOut: true,
  },

  // ── Member: messaging only ───────────────────────────────────────────────
  member: {
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,

    clinicDashboard: false,
    viewPatients: false,
    createPatient: false,
    editPatient: false,
    archivePatient: false,

    viewAppointments: false,
    createAppointment: false,
    editAppointment: false,
    archiveAppointment: false,

    viewTreatmentNote: false,
    createTreatmentNote: false,
    editTreatmentNote: false,

    manageStock: false,
    archiveStock: false,
    manageSuppliers: false,
    archiveSupplier: false,

    viewFinancials: false,
    createInvoice: false,
    editInvoice: false,
    archiveInvoice: false,
    recordPayment: false,
    managePayments: false,
    manageExpenses: false,
    archiveExpense: false,
    viewReports: false,
    manageReports: false,

    manageTelehealth: false,
    messaging: true,
    channels: true,
    manageChannels: false,
    sendAnnouncements: false,

    viewShifts: true,
    manageShifts: false,
    clockInOut: true,
  },
};

// ── Title Options ───────────────────────────────────────────────────────────
export const TITLE_OPTIONS = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Nurse'];

// ── Permission Helpers ──────────────────────────────────────────────────────
export function getPermissionsForRole(role) {
  return PERMISSIONS[role] || PERMISSIONS.member;
}

export function hasPermission(role, permission) {
  const perms = getPermissionsForRole(role);
  return perms[permission] === true;
}

// ── Password Generator ──────────────────────────────────────────────────────
export function generateStrongPassword(length = 14) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*?';
  const all = upper + lower + digits + special;

  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Device Helpers ──────────────────────────────────────────────────────────
export function generateDeviceId() {
  return 'device-' + Math.random().toString(36).substring(2, 10);
}
