const now = Date.now();

export const mockNotifications = [
  { id: 'notif-001', type: 'new_message', icon: 'message-circle', title: 'New message', body: 'James Phiri sent you a message', referenceId: 'conv-001', referenceType: 'conversation', isRead: false, createdAt: now - 120000 },
  { id: 'notif-002', type: 'channel_message', icon: 'hash', title: '#dialysis-team', body: 'Dr. Banda posted in #dialysis-team', referenceId: 'ch-001', referenceType: 'channel', isRead: false, createdAt: now - 900000 },
  { id: 'notif-003', type: 'mention', icon: 'at-sign', title: 'Mention', body: 'Nurse Tembo mentioned you in #pharmacy', referenceId: 'ch-004', referenceType: 'channel', isRead: false, createdAt: now - 3600000 },
  { id: 'notif-004', type: 'announcement', icon: 'bell', title: 'Announcement', body: 'New policy update from Admin', referenceId: 'ann-001', referenceType: 'announcement', isRead: true, createdAt: now - 10800000 },
  { id: 'notif-005', type: 'schedule_reminder', icon: 'calendar', title: 'Schedule', body: 'Your shift for tomorrow has been updated', referenceId: 'evt-001', referenceType: 'event', isRead: true, createdAt: now - 18000000 },
  { id: 'notif-006', type: 'device_approved', icon: 'shield', title: 'Security', body: 'New device approved by admin', referenceId: null, referenceType: null, isRead: true, createdAt: now - 86400000 },
];
