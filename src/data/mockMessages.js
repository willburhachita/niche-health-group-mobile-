const now = Date.now();

export const mockMessages = {
  'conv-001': [
    { id: 'msg-001', senderId: 'user-002', content: 'Good morning Dr. Mbewe, patient in Bay 3 is showing elevated BP readings since 6am', sentAt: now - 7200000, type: 'text' },
    { id: 'msg-002', senderId: 'user-002', content: 'Current reading is 165/95. Patient is on their regular dialysis session.', sentAt: now - 7190000, type: 'text' },
    { id: 'msg-003', senderId: 'user-001', content: 'Thanks James. Has the patient reported any symptoms? Headache or dizziness?', sentAt: now - 7020000, type: 'text' },
    { id: 'msg-004', senderId: 'user-002', content: 'No headache, slight dizziness when standing. Fluid intake has been normal.', sentAt: now - 6960000, type: 'text' },
    { id: 'msg-005', senderId: 'user-001', content: "OK. Let's reduce the UF rate by 200ml/hr and recheck in 30 mins. I'll come by after my 11am.", sentAt: now - 6840000, type: 'text' },
    { id: 'msg-006', senderId: 'user-002', content: 'Noted. Will adjust and monitor. Thank you Doctor.', sentAt: now - 6780000, type: 'text' },
    { id: 'msg-007', senderId: 'user-002', content: 'Patient in Bay 3 needs review', sentAt: now - 120000, type: 'text' },
  ],
  'conv-002': [
    { id: 'msg-010', senderId: 'user-001', content: 'Hi Dr. Banda, could you check the lab results for patient in Bay 1?', sentAt: now - 3600000, type: 'text' },
    { id: 'msg-011', senderId: 'user-003', content: "Sure, I'll pull them up now.", sentAt: now - 3300000, type: 'text' },
    { id: 'msg-012', senderId: 'user-003', content: "Results look normal. Creatinine is within range.", sentAt: now - 2700000, type: 'text' },
    { id: 'msg-013', senderId: 'user-001', content: "Great, thanks for checking.", sentAt: now - 1800000, type: 'text' },
    { id: 'msg-014', senderId: 'user-003', content: "Thanks, I'll check the results", sentAt: now - 900000, type: 'text' },
  ],
  'conv-003': [
    { id: 'msg-020', senderId: 'user-001', content: 'Morning team. Do we have sufficient Heparin stock for the week?', sentAt: now - 7200000, type: 'text' },
    { id: 'msg-021', senderId: 'user-004', content: 'Good morning. Yes, we received the new shipment yesterday. Current stock: 450 units. Should cover us through Friday.', sentAt: now - 6900000, type: 'text' },
    { id: 'msg-022', senderId: 'user-006', content: 'Great news. Bay 2 was running low yesterday.', sentAt: now - 6780000, type: 'text' },
    { id: 'msg-023', senderId: 'user-004', content: "I've allocated 50 units to Bay 2 already. Collection is ready.", sentAt: now - 6480000, type: 'text' },
    { id: 'msg-024', senderId: 'user-001', content: 'Perfect, thank you Mutale. Please also check Erythropoietin stock.', sentAt: now - 6420000, type: 'text' },
    { id: 'msg-025', senderId: 'user-004', content: 'Will check and update by noon.', sentAt: now - 6000000, type: 'text' },
  ],
  'conv-004': [
    { id: 'msg-030', senderId: 'user-005', content: 'Your new device has been approved. You can now access the full app.', sentAt: now - 10800000, type: 'text' },
    { id: 'msg-031', senderId: 'user-001', content: 'Thank you Dr. Patel!', sentAt: now - 10700000, type: 'text' },
  ],
};

export function getMessagesByConversation(conversationId) {
  return mockMessages[conversationId] || [];
}

let msgCounter = 100;
export function addMessage(conversationId, senderId, content, type = 'text') {
  msgCounter++;
  const msg = {
    id: `msg-${msgCounter}`,
    senderId,
    content,
    sentAt: Date.now(),
    type,
  };
  if (!mockMessages[conversationId]) {
    mockMessages[conversationId] = [];
  }
  mockMessages[conversationId].push(msg);
  return msg;
}
