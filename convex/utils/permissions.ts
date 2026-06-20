import { DatabaseReader } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

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

const ALL_TRUE = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as Record<Permission, boolean>
);
const ALL_FALSE = PERMISSION_KEYS.reduce(
  (acc, k) => ({ ...acc, [k]: false }),
  {} as Record<Permission, boolean>
);

export const PERMISSIONS: Record<Role, Record<Permission, boolean>> = {
  admin: { ...ALL_TRUE },

  moderator_plus: {
    ...ALL_TRUE,
    adminPanel: false,
    manageStaff: false,
    approveDevices: false,
    viewActivityLogs: false,
    viewAnalytics: false,
    editClinicSettings: false,
    archivePatient: false,
    archiveAppointment: false,
    archiveStock: false,
    archiveSupplier: false,
    archiveInvoice: false,
    archiveExpense: false,
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

export async function checkPermission(
  db: DatabaseReader,
  emailOrId: string | undefined | null,
  permission: Permission
): Promise<boolean> {
  if (!emailOrId) return false;
  let account: Doc<"staffAccounts"> | null = null;
  
  if (emailOrId.includes("@")) {
    account = await db
      .query("staffAccounts")
      .withIndex("by_email", (q) => q.eq("email", emailOrId.toLowerCase()))
      .first();
  } else {
    // Try by userId
    account = await db
      .query("staffAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", emailOrId))
      .first();
    
    // Try as a direct document ID if still not found
    if (!account) {
      try {
        const doc = await db.get(emailOrId as any);
        if (doc && "role" in doc && "isActive" in doc && "email" in doc) {
          account = doc as unknown as Doc<"staffAccounts">;
        }
      } catch {
        // Suppress ID parsing errors
      }
    }
  }
  
  if (!account || !account.isActive) return false;

  // Custom overrides list
  if (account.permissions && Array.isArray(account.permissions)) {
    return account.permissions.includes(permission);
  }

  const role = (account.role?.toLowerCase() as Role) || 'member';
  const roleMap = PERMISSIONS[role] ?? PERMISSIONS.member;
  return roleMap[permission] === true;
}

export async function enforcePermission(
  db: DatabaseReader,
  email: string | undefined | null,
  permission: Permission
): Promise<void> {
  const allowed = await checkPermission(db, email, permission);
  if (!allowed) {
    throw new Error(`Unauthorized: Required permission '${permission}'`);
  }
}
