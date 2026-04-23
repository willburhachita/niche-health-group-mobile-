const now = Date.now();
const day = 86400000;

// ── Patient Consents ──────────────────────────────────────────────────────────
export const mockPatientConsents = [
  { id: 'con-001', patientId: 'pt-001', privacyPolicyAccepted: true, privacyPolicyDate: now - 180 * day, dataAccessConsent: true, dataAccessDate: now - 180 * day, commPreferences: { sms: true, email: true, phone: false }, commPreferencesDate: now - 180 * day, version: '1.0', recordedBy: 'user-005', createdAt: now - 180 * day, updatedAt: now - 180 * day },
  { id: 'con-002', patientId: 'pt-002', privacyPolicyAccepted: true, privacyPolicyDate: now - 365 * day, dataAccessConsent: true, dataAccessDate: now - 365 * day, commPreferences: { sms: true, email: false, phone: true }, commPreferencesDate: now - 365 * day, version: '1.0', recordedBy: 'user-001', createdAt: now - 365 * day, updatedAt: now - 365 * day },
  { id: 'con-003', patientId: 'pt-004', privacyPolicyAccepted: true, privacyPolicyDate: now - 90 * day, dataAccessConsent: true, dataAccessDate: now - 90 * day, commPreferences: { sms: true, email: true, phone: true }, commPreferencesDate: now - 90 * day, version: '1.0', recordedBy: 'user-005', createdAt: now - 90 * day, updatedAt: now - 90 * day },
];

export function getConsentForPatient(patientId) {
  return mockPatientConsents.find(c => c.patientId === patientId) || null;
}

export function hasValidConsent(patientId) {
  const c = getConsentForPatient(patientId);
  return c ? c.privacyPolicyAccepted && c.dataAccessConsent : false;
}

// ── Patient Letters ───────────────────────────────────────────────────────────
export const mockPatientLetters = [
  { id: 'let-001', patientId: 'pt-002', type: 'referral', title: 'Referral to Dialysis Programme', content: 'Dear Dr. Mbewe,\n\nI am referring Mrs. Mary Chanda for assessment for the dialysis programme. She has been diagnosed with CKD Stage 4 and her eGFR has declined to 18ml/min.\n\nPlease arrange fistula creation and dialysis education.\n\nYours sincerely,\nDr. Chisanga Banda', recipientName: 'Dr. Sarah Mbewe', recipientOrg: 'Niche Healthcare - Dialysis Unit', attachments: [], createdBy: 'user-003', createdAt: now - day },
  { id: 'let-002', patientId: 'pt-005', type: 'medical_certificate', title: 'Medical Certificate - Post-Operative Recovery', content: 'This is to certify that Mr. Joseph Tembo has undergone a surgical procedure and requires 4 weeks of recovery. He is unfit for work from 1 April to 29 April 2026.', recipientName: null, recipientOrg: null, attachments: [], createdBy: 'user-001', createdAt: now - 14 * day },
  { id: 'let-003', patientId: 'pt-007', type: 'discharge_summary', title: 'Discharge Summary - Pneumonia Treatment', content: 'Patient Emmanuel Kapata was admitted on 15 March 2026 with community-acquired pneumonia. Treated with IV antibiotics (Amoxicillin + Clarithromycin). Condition improved. Discharged on 28 March 2026 with oral antibiotics for 7 days.', recipientName: 'GP Records', recipientOrg: null, attachments: [], createdBy: 'user-003', createdAt: now - 14 * day },
];

export function getLettersForPatient(patientId) {
  return mockPatientLetters.filter(l => l.patientId === patientId).sort((a, b) => b.createdAt - a.createdAt);
}

// ── Patient Cases ─────────────────────────────────────────────────────────────
export const mockPatientCases = [
  { id: 'case-001', patientId: 'pt-002', name: 'CKD Stage 4 - Dialysis Assessment', description: 'Initial assessment and preparation for haemodialysis programme', status: 'open', startDate: now - day, endDate: null, linkedAppointmentIds: ['apt-002'], linkedNoteIds: ['tn-002'], linkedInvoiceIds: ['inv-002'], createdBy: 'user-001', createdAt: now - day, updatedAt: now - day },
  { id: 'case-002', patientId: 'pt-005', name: 'Post-Surgical Recovery', description: 'Monitoring and follow-up after surgical procedure', status: 'open', startDate: now - 14 * day, endDate: null, linkedAppointmentIds: ['apt-005'], linkedNoteIds: ['tn-004'], linkedInvoiceIds: ['inv-005'], createdBy: 'user-001', createdAt: now - 14 * day, updatedAt: now - 3 * day },
  { id: 'case-003', patientId: 'pt-003', name: 'ESRD - Regular Haemodialysis', description: 'Ongoing management of end-stage renal disease', status: 'open', startDate: now - 730 * day, endDate: null, linkedAppointmentIds: ['apt-004', 'apt-012'], linkedNoteIds: ['tn-003'], linkedInvoiceIds: ['inv-004'], createdBy: 'user-001', createdAt: now - 730 * day, updatedAt: now - 7 * day },
];

export function getCasesForPatient(patientId) {
  return mockPatientCases.filter(c => c.patientId === patientId).sort((a, b) => b.createdAt - a.createdAt);
}

// ── Patient Recalls ───────────────────────────────────────────────────────────
export const mockPatientRecalls = [
  { id: 'rec-001', patientId: 'pt-001', reason: 'HbA1c retest (3-month follow-up)', dueDate: now + 75 * day, status: 'pending', assignedTo: 'user-005', notificationMethod: 'sms', notificationSent: false, notes: 'Check if dietary changes have improved HbA1c.', completedAt: null, createdBy: 'user-005', createdAt: now - 14 * day },
  { id: 'rec-002', patientId: 'pt-005', reason: 'Suture removal - 2 week post-op', dueDate: now + 3 * day, status: 'pending', assignedTo: 'user-001', notificationMethod: 'sms', notificationSent: true, notes: 'Check wound healing. Remove sutures if clean.', completedAt: null, createdBy: 'user-001', createdAt: now - 11 * day },
  { id: 'rec-003', patientId: 'pt-006', reason: 'CBC retest - 6 week iron review', dueDate: now + 30 * day, status: 'pending', assignedTo: 'user-003', notificationMethod: 'email', notificationSent: false, notes: 'Check if ferritin has improved with supplementation.', completedAt: null, createdBy: 'user-003', createdAt: now - 3 * day },
  { id: 'rec-004', patientId: 'pt-004', reason: 'Kidney function retest', dueDate: now - 5 * day, status: 'overdue', assignedTo: 'user-001', notificationMethod: 'phone', notificationSent: true, notes: 'Repeat bloods for eGFR and creatinine.', completedAt: null, createdBy: 'user-001', createdAt: now - 19 * day },
];

export function getRecallsForPatient(patientId) {
  return mockPatientRecalls.filter(r => r.patientId === patientId).sort((a, b) => a.dueDate - b.dueDate);
}

export function getOverdueRecalls() {
  return mockPatientRecalls.filter(r => r.status === 'overdue');
}

export function getPendingRecalls() {
  return mockPatientRecalls.filter(r => r.status === 'pending');
}

// ── Communication Logs ────────────────────────────────────────────────────────
export const mockCommunicationLogs = [
  { id: 'comm-001', patientId: 'pt-001', staffId: null, type: 'sms', direction: 'outbound', subject: null, content: 'Reminder: Your appointment with Dr. Patel is tomorrow at 3:30 PM.', duration: null, status: 'delivered', loggedBy: 'user-005', createdAt: now - day },
  { id: 'comm-002', patientId: 'pt-002', staffId: null, type: 'phone_call', direction: 'outbound', subject: 'Dialysis programme discussion', content: 'Called to discuss dialysis programme entry. Patient has questions about fistula procedure.', duration: 480, status: 'completed', loggedBy: 'user-001', createdAt: now - 2 * day },
  { id: 'comm-003', patientId: 'pt-004', staffId: null, type: 'sms', direction: 'outbound', subject: null, content: 'Your blood test results are ready. Please book a follow-up appointment.', duration: null, status: 'delivered', loggedBy: 'user-001', createdAt: now - 3 * day },
  { id: 'comm-004', patientId: 'pt-003', staffId: null, type: 'email', direction: 'outbound', subject: 'Dialysis Schedule Update', content: 'Dear Mrs. Nkole, your dialysis schedule has been updated. Your next session is Monday at 11:00 AM.', duration: null, status: 'sent', loggedBy: 'user-001', createdAt: now - 5 * day },
  { id: 'comm-005', patientId: 'pt-005', staffId: null, type: 'phone_call', direction: 'inbound', subject: 'Post-op pain query', content: 'Patient called regarding increased pain at surgical site. Advised to continue paracetamol and come in if worsening.', duration: 300, status: 'completed', loggedBy: 'user-001', createdAt: now - 4 * day },
];

export function getCommsForPatient(patientId) {
  return mockCommunicationLogs.filter(c => c.patientId === patientId).sort((a, b) => b.createdAt - a.createdAt);
}
