const now = Date.now();
const day = 86400000;

export const mockSchedule = [
  { id: 'evt-001', title: 'Morning Shift', type: 'shift', description: 'Regular morning shift. Bay 2 lead responsibilities.', location: 'Dialysis Unit, Bay 2', startTime: now, endTime: now + 28800000, organizer: 'user-005', attendees: ['user-001','user-002'], isAllDay: false, acknowledgedBy: ['user-001'] },
  { id: 'evt-002', title: 'Shift Handover', type: 'meeting', description: 'End of day handover meeting with night shift team.', location: 'Staff Room', startTime: now + 25200000, endTime: now + 27000000, organizer: 'user-005', attendees: ['user-001','user-002','user-006'], isAllDay: false, acknowledgedBy: [] },
  { id: 'evt-003', title: 'Morning Shift', type: 'shift', description: 'Morning shift.', location: 'Dialysis Unit', startTime: now + day, endTime: now + day + 28800000, organizer: 'user-005', attendees: ['user-001'], isAllDay: false, acknowledgedBy: [] },
  { id: 'evt-004', title: 'Off Day', type: 'other', description: 'Scheduled day off.', location: null, startTime: now + 2 * day, endTime: now + 3 * day, organizer: 'user-005', attendees: ['user-001'], isAllDay: true, acknowledgedBy: ['user-001'] },
  { id: 'evt-005', title: 'Morning Shift', type: 'shift', description: 'Morning shift with clinical audit.', location: 'Dialysis Unit', startTime: now + 3 * day, endTime: now + 3 * day + 28800000, organizer: 'user-005', attendees: ['user-001','user-002'], isAllDay: false, acknowledgedBy: [] },
  { id: 'evt-006', title: 'Clinical Audit', type: 'meeting', description: 'Monthly clinical audit review meeting.', location: 'Conference Room A', startTime: now + 3 * day + 7200000, endTime: now + 3 * day + 10800000, organizer: 'user-005', attendees: ['user-001','user-003','user-005'], isAllDay: false, acknowledgedBy: [] },
  { id: 'evt-007', title: 'IV Cannulation Refresher', type: 'training', description: 'Refresher course on IV cannulation techniques and best practices.', location: 'Training Room', startTime: now + 4 * day + 14400000, endTime: now + 4 * day + 21600000, organizer: 'user-005', attendees: ['user-001','user-002','user-007'], isAllDay: false, acknowledgedBy: [] },
];

export const mockTrainingSessions = [
  { id: 'evt-007', title: 'IV Cannulation Refresher', date: now + 4 * day, time: '14:00 - 16:00', instructor: 'Dr. Patel', isRegistered: true },
  { id: 'tr-002', title: 'New Dialysis Protocol Training', date: now + 11 * day, time: '10:00 - 13:00', instructor: 'Dr. Banda', isRegistered: false },
  { id: 'tr-003', title: 'Infection Control Update', date: now + 18 * day, time: '09:00 - 11:00', instructor: 'Admin', isRegistered: false },
];

export function getEventsForDate(targetDate) {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const nextDay = new Date(target);
  nextDay.setDate(nextDay.getDate() + 1);
  return mockSchedule.filter(e => {
    const start = new Date(e.startTime);
    return start >= target && start < nextDay;
  });
}
