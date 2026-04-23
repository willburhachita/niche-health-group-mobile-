const now = Date.now();

export const mockConversations = [
  {
    id: 'conv-001',
    type: 'direct',
    members: ['user-001', 'user-002'],
    lastMessage: 'Patient in Bay 3 needs review',
    lastMessageBy: 'user-002',
    lastMessageAt: now - 120000,
    unreadCount: 2,
  },
  {
    id: 'conv-002',
    type: 'direct',
    members: ['user-001', 'user-003'],
    lastMessage: "Thanks, I'll check the results",
    lastMessageBy: 'user-003',
    lastMessageAt: now - 900000,
    unreadCount: 0,
  },
  {
    id: 'conv-003',
    type: 'group',
    name: 'Pharmacy Team',
    members: ['user-001', 'user-004', 'user-002', 'user-006'],
    lastMessage: 'Dr. Mbewe: New stock arrived',
    lastMessageBy: 'user-001',
    lastMessageAt: now - 3600000,
    unreadCount: 5,
  },
  {
    id: 'conv-004',
    type: 'direct',
    members: ['user-001', 'user-005'],
    lastMessage: 'Your device has been approved',
    lastMessageBy: 'user-005',
    lastMessageAt: now - 10800000,
    unreadCount: 0,
  },
  {
    id: 'conv-005',
    type: 'direct',
    members: ['user-001', 'user-005'],
    lastMessage: 'Training session confirmed',
    lastMessageBy: 'user-005',
    lastMessageAt: now - 86400000,
    unreadCount: 0,
  },
  {
    id: 'conv-006',
    type: 'group',
    name: 'Night Shift Handover',
    members: ['user-001', 'user-006', 'user-007', 'user-002'],
    lastMessage: 'Nurse Tembo: All stable tonight',
    lastMessageBy: 'user-006',
    lastMessageAt: now - 86400000,
    unreadCount: 0,
  },
];

export function getConversationById(id) {
  return mockConversations.find(c => c.id === id);
}

export function updateConversationLastMessage(conversationId, content, senderId) {
  const conv = mockConversations.find(c => c.id === conversationId);
  if (conv) {
    conv.lastMessage = content;
    conv.lastMessageBy = senderId;
    conv.lastMessageAt = Date.now();
  }
}
