const now = Date.now();
const day = 86400000;
const hour = 3600000;

// Helper to get today at a specific hour
function todayAt(h, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function tomorrowAt(h, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function daysFromNowAt(days, h, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export const APPOINTMENT_TYPES = [
  'Consultation',
  'Follow-up',
  'Dialysis Session',
  'Lab Review',
  'Post-Op Check',
  'Prescription Renewal',
  'Telehealth',
  'Other',
];

export const APPOINTMENT_STATUSES = {
  confirmed: { label: 'Confirmed', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  cancelled: { label: 'Cancelled', color: 'error' },
  completed: { label: 'Completed', color: 'mediumGrey' },
  noShow: { label: 'No Show', color: 'error' },
  open: { label: 'Available', color: 'navyBlue' },
};

export const mockAppointments = [
  // Today
  {
    id: 'apt-001',
    patientId: 'pt-004',
    providerId: 'user-001',
    type: 'Dialysis Follow-up',
    startTime: todayAt(8, 30),
    endTime: todayAt(9, 30),
    duration: 60,
    location: 'Dialysis Unit, Bay 2',
    status: 'confirmed',
    notes: 'Patient reports improved fluid levels. Review latest bloods.',
    isRecurring: false,
    reminderSent: true,
  },
  {
    id: 'apt-002',
    patientId: 'pt-002',
    providerId: 'user-001',
    type: 'Consultation',
    startTime: todayAt(9, 15),
    endTime: todayAt(10, 0),
    duration: 45,
    location: 'Consultation Room 1',
    status: 'confirmed',
    notes: 'Initial assessment for dialysis program candidacy.',
    isRecurring: false,
    reminderSent: true,
  },
  {
    id: 'apt-003',
    patientId: 'pt-006',
    providerId: 'user-003',
    type: 'Lab Review',
    startTime: todayAt(10, 0),
    endTime: todayAt(10, 30),
    duration: 30,
    location: 'Consultation Room 2',
    status: 'pending',
    notes: 'Review iron panel and CBC results.',
    isRecurring: false,
    reminderSent: false,
  },
  {
    id: 'apt-004',
    patientId: 'pt-003',
    providerId: 'user-001',
    type: 'Dialysis Session',
    startTime: todayAt(11, 0),
    endTime: todayAt(15, 0),
    duration: 240,
    location: 'Dialysis Unit, Bay 1',
    status: 'confirmed',
    notes: 'Regular haemodialysis session. Monitor BP closely.',
    isRecurring: true,
    reminderSent: true,
  },
  {
    id: 'apt-005',
    patientId: 'pt-005',
    providerId: 'user-001',
    type: 'Post-Op Check',
    startTime: todayAt(14, 0),
    endTime: todayAt(14, 30),
    duration: 30,
    location: 'Consultation Room 1',
    status: 'confirmed',
    notes: 'Two-week post-operative wound check.',
    isRecurring: false,
    reminderSent: true,
  },
  {
    id: 'apt-006',
    patientId: 'pt-001',
    providerId: 'user-005',
    type: 'Prescription Renewal',
    startTime: todayAt(15, 30),
    endTime: todayAt(16, 0),
    duration: 30,
    location: 'Consultation Room 3',
    status: 'pending',
    notes: 'Review and renew hypertension and diabetes medications.',
    isRecurring: false,
    reminderSent: false,
  },
  {
    id: 'apt-007',
    patientId: null,
    providerId: 'user-001',
    type: null,
    startTime: todayAt(16, 0),
    endTime: todayAt(17, 0),
    duration: 60,
    location: null,
    status: 'open',
    notes: null,
    isRecurring: false,
    reminderSent: false,
  },
  // Tomorrow
  {
    id: 'apt-008',
    patientId: 'pt-002',
    providerId: 'user-001',
    type: 'Dialysis Session',
    startTime: tomorrowAt(8, 0),
    endTime: tomorrowAt(12, 0),
    duration: 240,
    location: 'Dialysis Unit, Bay 2',
    status: 'confirmed',
    notes: 'Scheduled haemodialysis. Check fistula condition.',
    isRecurring: true,
    reminderSent: true,
  },
  {
    id: 'apt-009',
    patientId: 'pt-004',
    providerId: 'user-003',
    type: 'Lab Review',
    startTime: tomorrowAt(10, 0),
    endTime: tomorrowAt(10, 30),
    duration: 30,
    location: 'Consultation Room 2',
    status: 'confirmed',
    notes: 'Follow-up on kidney function tests.',
    isRecurring: false,
    reminderSent: true,
  },
  // Day after tomorrow
  {
    id: 'apt-010',
    patientId: 'pt-006',
    providerId: 'user-001',
    type: 'Telehealth',
    startTime: daysFromNowAt(2, 10, 0),
    endTime: daysFromNowAt(2, 10, 30),
    duration: 30,
    location: 'Virtual',
    status: 'confirmed',
    notes: 'Remote check-in on iron supplementation progress.',
    isRecurring: false,
    reminderSent: false,
  },
  {
    id: 'apt-011',
    patientId: 'pt-001',
    providerId: 'user-001',
    type: 'Follow-up',
    startTime: daysFromNowAt(2, 14, 0),
    endTime: daysFromNowAt(2, 14, 45),
    duration: 45,
    location: 'Consultation Room 1',
    status: 'pending',
    notes: 'BP monitoring follow-up. Bring home BP readings.',
    isRecurring: false,
    reminderSent: false,
  },
  // Past (yesterday)
  {
    id: 'apt-012',
    patientId: 'pt-003',
    providerId: 'user-001',
    type: 'Dialysis Session',
    startTime: todayAt(8, 0) - day,
    endTime: todayAt(12, 0) - day,
    duration: 240,
    location: 'Dialysis Unit, Bay 1',
    status: 'completed',
    notes: 'Session completed without complications. Dry weight achieved.',
    isRecurring: true,
    reminderSent: true,
  },
];

export function getAppointmentsForDate(targetDate) {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const nextDay = new Date(target);
  nextDay.setDate(nextDay.getDate() + 1);
  return mockAppointments
    .filter(a => a.startTime >= target.getTime() && a.startTime < nextDay.getTime())
    .sort((a, b) => a.startTime - b.startTime);
}

export function getTodaysAppointments() {
  return getAppointmentsForDate(new Date());
}

export function getUpcomingAppointments() {
  return mockAppointments
    .filter(a => a.startTime > now && a.status !== 'cancelled' && a.status !== 'completed')
    .sort((a, b) => a.startTime - b.startTime);
}

export function getPastAppointments() {
  return mockAppointments
    .filter(a => a.status === 'completed' || a.startTime < now)
    .sort((a, b) => b.startTime - a.startTime);
}

export function getAppointmentById(id) {
  return mockAppointments.find(a => a.id === id);
}

export function getAppointmentsForPatient(patientId) {
  return mockAppointments
    .filter(a => a.patientId === patientId)
    .sort((a, b) => b.startTime - a.startTime);
}

export function getPendingAppointmentsCount() {
  return mockAppointments.filter(a => a.status === 'pending').length;
}
