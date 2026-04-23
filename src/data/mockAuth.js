const now = Date.now();
const day = 86400000;

// ── Roles & Permissions ─────────────────────────────────────────────────────
export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Admin',
    description: 'Full access to all features including admin dashboard',
  },
  moderator: {
    key: 'moderator',
    label: 'Moderator',
    description: 'Full access except admin dashboard',
  },
  member: {
    key: 'member',
    label: 'Member',
    description: 'Messaging and chat only — no clinic access',
  },
};

export const PERMISSIONS = {
  admin: {
    adminPanel: true,
    clinicDashboard: true,
    createPatient: true,
    editPatient: true,
    deletePatient: true,
    createAppointment: true,
    editAppointment: true,
    deleteAppointment: true,
    createInvoice: true,
    editInvoice: true,
    deleteInvoice: true,
    createTreatmentNote: true,
    editTreatmentNote: true,
    manageStock: true,
    manageSuppliers: true,
    manageExpenses: true,
    managePayments: true,
    viewReports: true,
    manageTelehealth: true,
    messaging: true,
    channels: true,
    manageChannels: true,
    sendAnnouncements: true,
    manageStaff: true,
    approveDevices: true,
    viewActivityLogs: true,
    viewAnalytics: true,
  },
  moderator: {
    adminPanel: false,
    clinicDashboard: true,
    createPatient: true,
    editPatient: true,
    deletePatient: false,
    createAppointment: true,
    editAppointment: true,
    deleteAppointment: false,
    createInvoice: true,
    editInvoice: true,
    deleteInvoice: false,
    createTreatmentNote: true,
    editTreatmentNote: true,
    manageStock: true,
    manageSuppliers: true,
    manageExpenses: true,
    managePayments: true,
    viewReports: true,
    manageTelehealth: true,
    messaging: true,
    channels: true,
    manageChannels: false,
    sendAnnouncements: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
  },
  member: {
    adminPanel: false,
    clinicDashboard: false,
    createPatient: false,
    editPatient: false,
    deletePatient: false,
    createAppointment: false,
    editAppointment: false,
    deleteAppointment: false,
    createInvoice: false,
    editInvoice: false,
    deleteInvoice: false,
    createTreatmentNote: false,
    editTreatmentNote: false,
    manageStock: false,
    manageSuppliers: false,
    manageExpenses: false,
    managePayments: false,
    viewReports: false,
    manageTelehealth: false,
    messaging: true,
    channels: true,
    manageChannels: false,
    sendAnnouncements: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
  },
};

// ── Title Options ───────────────────────────────────────────────────────────
export const TITLE_OPTIONS = ['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Nurse'];

// ── Staff Accounts ──────────────────────────────────────────────────────────
// In production these would be in the database. For now, mock accounts.
// Passwords are stored as plain text for mock purposes only.
// isOnboarded: false means they need to complete profile setup on first login
// trustedDevices: list of device IDs that are approved for this account
export const mockStaffAccounts = [
  {
    id: 'staff-001',
    userId: 'user-005',
    email: 'wilburhachita@gmail.com',
    phone: null,
    title: null,
    displayName: null,
    fullName: null,
    role: 'admin',
    password: 'Michelle13//.',
    verificationCode: '123456',
    isActive: true,
    isOnboarded: false,
    trustedDevices: ['device-emulator-001'],
    createdBy: 'system',
    createdAt: now - 365 * day,
    lastLoginAt: now - day,
  },
  {
    id: 'staff-002',
    userId: 'user-001',
    email: 'sarah.mbewe@nichehealthcare.co.uk',
    phone: '+447700900890',
    title: 'Dr',
    displayName: 'Dr. Sarah Mbewe',
    fullName: 'Sarah Mbewe',
    role: 'moderator',
    password: 'Nkw$8mR!pLz3',
    verificationCode: '482917',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-web-001'],
    createdBy: 'staff-001',
    createdAt: now - 90 * day,
    lastLoginAt: now - 2 * day,
  },
  {
    id: 'staff-003',
    userId: 'user-002',
    email: 'james.phiri@nichehealthcare.co.uk',
    phone: '+447700900891',
    title: 'Mr',
    displayName: 'Nurse James Phiri',
    fullName: 'James Phiri',
    role: 'member',
    password: 'Xv#9tQm!kW2p',
    verificationCode: '739201',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-android-001'],
    createdBy: 'staff-001',
    createdAt: now - 120 * day,
    lastLoginAt: now - 3 * day,
  },
  {
    id: 'staff-004',
    userId: 'user-003',
    email: 'chisanga.banda@nichehealthcare.co.uk',
    phone: '+447700900892',
    title: 'Dr',
    displayName: 'Dr. Chisanga Banda',
    fullName: 'Chisanga Banda',
    role: 'moderator',
    password: 'Bm@7nRx!pL4s',
    verificationCode: '561843',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-ios-001'],
    createdBy: 'staff-001',
    createdAt: now - 200 * day,
    lastLoginAt: now - 7 * day,
  },
  {
    id: 'staff-005',
    userId: 'user-004',
    email: 'grace.mutale@nichehealthcare.co.uk',
    phone: '+447700900893',
    title: 'Miss',
    displayName: 'Pharmacist Grace Mutale',
    fullName: 'Grace Mutale',
    role: 'member',
    password: 'Hy#5wLk!mN8r',
    verificationCode: '294756',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-ios-002'],
    createdBy: 'staff-001',
    createdAt: now - 150 * day,
    lastLoginAt: now - 5 * day,
  },
  {
    id: 'staff-006',
    userId: 'user-006',
    email: 'david.tembo@nichehealthcare.co.uk',
    phone: '+447700900895',
    title: 'Mr',
    displayName: 'Nurse David Tembo',
    fullName: 'David Tembo',
    role: 'member',
    password: 'Qp@3sVn!xK7m',
    verificationCode: '813625',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-android-002'],
    createdBy: 'staff-001',
    createdAt: now - 100 * day,
    lastLoginAt: now - 10 * day,
  },
  {
    id: 'staff-007',
    userId: 'user-007',
    email: 'ruth.chomba@nichehealthcare.co.uk',
    phone: '+447700900896',
    title: 'Mrs',
    displayName: 'Nurse Ruth Chomba',
    fullName: 'Ruth Chomba',
    role: 'member',
    password: 'Tz#6dWm!pR9k',
    verificationCode: '470382',
    isActive: true,
    isOnboarded: true,
    trustedDevices: ['device-android-003'],
    createdBy: 'staff-001',
    createdAt: now - 80 * day,
    lastLoginAt: now - 2 * day,
  },
];

// ── Device Approval Requests ────────────────────────────────────────────────
// When a user logs in from an untrusted device, a request is created here
export const mockDeviceRequests = [
  {
    id: 'dreq-001',
    staffId: 'staff-004',
    staffName: 'Dr. Chisanga Banda',
    email: 'chisanga.banda@nichehealthcare.co.uk',
    deviceId: 'device-samsung-s24',
    deviceName: 'Samsung Galaxy S24',
    platform: 'Android',
    status: 'pending', // pending | approved | rejected
    requestedAt: now - 3600000,
    reviewedBy: null,
    reviewedAt: null,
  },
];

// ── Admin Notifications (login alerts) ──────────────────────────────────────
export const mockAdminAlerts = [
  {
    id: 'alert-001',
    type: 'login_success',
    staffId: 'staff-002',
    staffName: 'Dr. Sarah Mbewe',
    deviceName: 'MacBook Pro - Chrome',
    message: 'Dr. Sarah Mbewe logged in successfully',
    createdAt: now - 2 * day,
    isRead: true,
  },
  {
    id: 'alert-002',
    type: 'new_device_request',
    staffId: 'staff-004',
    staffName: 'Dr. Chisanga Banda',
    deviceName: 'Samsung Galaxy S24',
    message: 'Dr. Chisanga Banda is requesting access from a new device',
    createdAt: now - 3600000,
    isRead: false,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
export function getAccountByEmail(email) {
  return mockStaffAccounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.isActive
  );
}

export function verifyCode(email, code) {
  const account = getAccountByEmail(email);
  if (!account) return { success: false, error: 'Account not found' };
  if (account.verificationCode !== code)
    return { success: false, error: 'Invalid verification code' };
  return { success: true, account };
}

export function verifyPassword(email, password) {
  const account = getAccountByEmail(email);
  if (!account) return { success: false, error: 'Account not found' };
  if (account.password !== password)
    return { success: false, error: 'Incorrect password' };
  return { success: true, account };
}

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

  // Ensure at least one of each category
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

export function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ── Device Helpers ──────────────────────────────────────────────────────────
export function generateDeviceId() {
  return 'device-' + Math.random().toString(36).substring(2, 10);
}

export function isDeviceTrusted(account, deviceId) {
  if (!account || !deviceId) return false;
  return account.trustedDevices?.includes(deviceId) || false;
}

export function addTrustedDevice(account, deviceId) {
  if (!account.trustedDevices) account.trustedDevices = [];
  if (!account.trustedDevices.includes(deviceId)) {
    account.trustedDevices.push(deviceId);
  }
}

export function createDeviceRequest(account, deviceId, deviceName, platform) {
  const request = {
    id: 'dreq-' + Math.random().toString(36).substring(2, 8),
    staffId: account.id,
    staffName: account.displayName,
    email: account.email,
    deviceId,
    deviceName,
    platform,
    status: 'pending',
    requestedAt: Date.now(),
    reviewedBy: null,
    reviewedAt: null,
  };
  mockDeviceRequests.push(request);
  // Also create an admin alert
  mockAdminAlerts.unshift({
    id: 'alert-' + Math.random().toString(36).substring(2, 8),
    type: 'new_device_request',
    staffId: account.id,
    staffName: account.displayName,
    deviceName,
    message: `${account.displayName} is requesting access from a new device (${deviceName})`,
    createdAt: Date.now(),
    isRead: false,
  });
  return request;
}

export function createLoginAlert(account, deviceName) {
  mockAdminAlerts.unshift({
    id: 'alert-' + Math.random().toString(36).substring(2, 8),
    type: 'login_success',
    staffId: account.id,
    staffName: account.displayName,
    deviceName,
    message: `${account.displayName} logged in successfully from ${deviceName}`,
    createdAt: Date.now(),
    isRead: false,
  });
}

export function getPendingDeviceRequests() {
  return mockDeviceRequests.filter((r) => r.status === 'pending');
}

export function getDeviceRequestForAccount(staffId, deviceId) {
  return mockDeviceRequests.find(
    (r) => r.staffId === staffId && r.deviceId === deviceId
  );
}

export function approveDeviceRequest(requestId, adminId) {
  const req = mockDeviceRequests.find((r) => r.id === requestId);
  if (!req) return false;
  req.status = 'approved';
  req.reviewedBy = adminId;
  req.reviewedAt = Date.now();
  // Add device to account's trusted devices
  const account = mockStaffAccounts.find((a) => a.id === req.staffId);
  if (account) addTrustedDevice(account, req.deviceId);
  return true;
}

export function rejectDeviceRequest(requestId, adminId) {
  const req = mockDeviceRequests.find((r) => r.id === requestId);
  if (!req) return false;
  req.status = 'rejected';
  req.reviewedBy = adminId;
  req.reviewedAt = Date.now();
  return true;
}

export function getUnreadAdminAlerts() {
  return mockAdminAlerts.filter((a) => !a.isRead);
}

export function completeOnboarding(account, title, fullName, phone) {
  // fullName is "Surname FirstName"
  const parts = fullName.split(' ');
  const surname = parts[0] || '';
  const firstInitial = parts[1] ? ` ${parts[1].charAt(0).toUpperCase()}.` : '';
  account.title = title;
  account.fullName = fullName;
  account.displayName = `${title}. ${surname}${firstInitial}`;
  account.phone = phone;
  account.isOnboarded = true;
}
