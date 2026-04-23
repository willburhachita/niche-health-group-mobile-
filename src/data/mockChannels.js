const now = Date.now();

export const mockChannels = [
  { id: 'ch-001', name: 'dialysis-team', displayName: 'Dialysis Team', description: 'Dialysis team coordination and updates', type: 'public', members: ['user-001','user-002','user-003','user-006','user-007'], admins: ['user-001'], unreadCount: 3, isStarred: true, memberCount: 12 },
  { id: 'ch-002', name: 'announcements', displayName: 'Announcements', description: 'Official announcements from admin', type: 'public', members: ['user-001','user-002','user-003','user-004','user-005','user-006','user-007'], admins: ['user-005'], unreadCount: 1, isStarred: true, memberCount: 24 },
  { id: 'ch-003', name: 'general', displayName: 'General', description: 'General discussions for all staff', type: 'public', members: ['user-001','user-002','user-003','user-004','user-005','user-006','user-007'], admins: ['user-005'], unreadCount: 0, isStarred: false, memberCount: 24 },
  { id: 'ch-004', name: 'pharmacy', displayName: 'Pharmacy', description: 'Pharmacy stock updates and requests', type: 'public', members: ['user-001','user-004','user-002'], admins: ['user-004'], unreadCount: 5, isStarred: false, memberCount: 8 },
  { id: 'ch-005', name: 'training-updates', displayName: 'Training Updates', description: 'Training schedules and resources', type: 'public', members: ['user-001','user-002','user-003','user-004','user-005','user-006','user-007'], admins: ['user-005'], unreadCount: 0, isStarred: false, memberCount: 24 },
  { id: 'ch-006', name: 'night-shift', displayName: 'Night Shift', description: 'Night shift coordination and handover notes', type: 'private', members: ['user-001','user-006','user-007'], admins: ['user-006'], unreadCount: 0, isStarred: false, memberCount: 6 },
  { id: 'ch-007', name: 'icu', displayName: 'ICU', description: 'Intensive Care Unit updates', type: 'private', members: ['user-003','user-007'], admins: ['user-003'], unreadCount: 0, isStarred: false, memberCount: 10 },
];

export const mockDiscoverChannels = [
  { id: 'ch-010', name: 'lab-results', displayName: 'Lab Results', description: 'Lab test results and discussions', type: 'public', memberCount: 4 },
  { id: 'ch-011', name: 'social', displayName: 'Social', description: 'Non-work conversation', type: 'public', memberCount: 18 },
  { id: 'ch-012', name: 'maintenance', displayName: 'Maintenance', description: 'Equipment and facility maintenance', type: 'public', memberCount: 3 },
];

export const mockChannelMessages = {
  'ch-001': [
    { id: 'cmsg-001', senderId: 'user-003', content: "Morning team. Bay allocations for today:\nBay 1: 6 patients (Dr. Banda)\nBay 2: 5 patients (Dr. Mbewe)\nBay 3: 4 patients (Dr. Patel)", sentAt: now - 14400000, type: 'text' },
    { id: 'cmsg-002', senderId: 'user-002', content: 'Confirmed. Bay 2 is prepped. Machines 4 and 5 had maintenance yesterday - both cleared.', sentAt: now - 14100000, type: 'text' },
    { id: 'cmsg-003', senderId: 'user-001', content: 'Thanks James. Please double-check water quality readings before we start.', sentAt: now - 13800000, type: 'text' },
    { id: 'cmsg-004', senderId: 'user-002', content: 'Water quality checked. All readings within normal range.\nConductivity: 14.2, Temperature: 37.1C', sentAt: now - 13680000, type: 'text' },
    { id: 'cmsg-005', senderId: 'user-005', content: 'Reminder: Monthly clinical audit is scheduled for Friday 28th March. All bay leads please submit reports by Thursday.', sentAt: now - 12600000, type: 'text', isPinned: true },
  ],
};

export function getChannelById(id) {
  return mockChannels.find(c => c.id === id);
}

let chMsgCounter = 100;
export function addChannelMessage(channelId, senderId, content, type = 'text') {
  chMsgCounter++;
  const msg = {
    id: `cmsg-${chMsgCounter}`,
    senderId,
    content,
    sentAt: Date.now(),
    type,
  };
  if (!mockChannelMessages[channelId]) {
    mockChannelMessages[channelId] = [];
  }
  mockChannelMessages[channelId].push(msg);
  return msg;
}
