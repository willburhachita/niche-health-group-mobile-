const now = Date.now();

export const CURRENT_USER_ID = 'user-005';

export const mockUsers = [
  {
    id: 'user-001',
    displayName: 'Dr. Sarah Mbewe',
    firstName: 'Sarah',
    lastName: 'Mbewe',
    initials: 'SM',
    userType: 'staff',
    staffRole: 'doctor',
    department: 'Dialysis',
    email: 'sarah.mbewe@nichehealthcare.co.uk',
    phone: '+447700900890',
    onlineStatus: 'online',
    joinedAt: now - 90 * 86400000,
    bio: 'Specialist in renal dialysis. 12 years experience in nephrology care.',
  },
  {
    id: 'user-002',
    displayName: 'Nurse James Phiri',
    firstName: 'James',
    lastName: 'Phiri',
    initials: 'JP',
    userType: 'staff',
    staffRole: 'nurse',
    department: 'Dialysis',
    email: 'james.phiri@nichehealthcare.co.uk',
    phone: '+447700900891',
    onlineStatus: 'online',
    joinedAt: now - 120 * 86400000,
    bio: 'Senior Dialysis Nurse. Certified in peritoneal and haemodialysis.',
  },
  {
    id: 'user-003',
    displayName: 'Dr. Chisanga Banda',
    firstName: 'Chisanga',
    lastName: 'Banda',
    initials: 'CB',
    userType: 'staff',
    staffRole: 'doctor',
    department: 'General Medicine',
    email: 'chisanga.banda@nichehealthcare.co.uk',
    phone: '+447700900892',
    onlineStatus: 'offline',
    lastSeenAt: now - 7200000,
    joinedAt: now - 200 * 86400000,
    bio: 'General Medicine consultant with focus on internal medicine.',
  },
  {
    id: 'user-004',
    displayName: 'Pharmacist Grace Mutale',
    firstName: 'Grace',
    lastName: 'Mutale',
    initials: 'GM',
    userType: 'staff',
    staffRole: 'pharmacist',
    department: 'Pharmacy',
    email: 'grace.mutale@nichehealthcare.co.uk',
    phone: '+447700900893',
    onlineStatus: 'away',
    joinedAt: now - 150 * 86400000,
    bio: 'Lead Pharmacist. Manages all medication dispensing and stock control.',
  },
  {
    id: 'user-005',
    displayName: 'Dr. Yusuf Patel',
    firstName: 'Yusuf',
    lastName: 'Patel',
    initials: 'YP',
    userType: 'staff',
    staffRole: 'admin',
    department: 'Administration',
    email: 'yusuf.patel@nichehealthcare.co.uk',
    phone: '+447700900894',
    onlineStatus: 'online',
    joinedAt: now - 365 * 86400000,
    bio: 'Chief Administrator and founding member of Niche Healthcare.',
  },
  {
    id: 'user-006',
    displayName: 'Nurse David Tembo',
    firstName: 'David',
    lastName: 'Tembo',
    initials: 'DT',
    userType: 'staff',
    staffRole: 'nurse',
    department: 'Night Shift',
    email: 'david.tembo@nichehealthcare.co.uk',
    phone: '+447700900895',
    onlineStatus: 'offline',
    lastSeenAt: now - 28800000,
    joinedAt: now - 100 * 86400000,
    bio: 'Night shift lead nurse. Experienced in emergency care.',
  },
  {
    id: 'user-007',
    displayName: 'Nurse Ruth Chomba',
    firstName: 'Ruth',
    lastName: 'Chomba',
    initials: 'RC',
    userType: 'staff',
    staffRole: 'nurse',
    department: 'ICU',
    email: 'ruth.chomba@nichehealthcare.co.uk',
    phone: '+447700900896',
    onlineStatus: 'offline',
    lastSeenAt: now - 3600000,
    joinedAt: now - 80 * 86400000,
    bio: 'ICU specialist nurse. Advanced Life Support certified.',
  },
];

export function getUserById(id) {
  return mockUsers.find(u => u.id === id);
}

export function getCurrentUser() {
  return getUserById(CURRENT_USER_ID);
}

export function getStaffByDepartment(dept) {
  return mockUsers.filter(u => u.department === dept);
}

export function getStaffByRole(role) {
  return mockUsers.filter(u => u.staffRole === role);
}
