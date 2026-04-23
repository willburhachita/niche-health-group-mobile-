const now = Date.now();
const day = 86400000;

export const TREATMENT_TEMPLATES = [
  'General Consultation',
  'Dialysis Session',
  'Follow-up',
  'Post-Op Review',
  'Custom',
];

export const mockTreatmentNotes = [
  {
    id: 'tn-001',
    patientId: 'pt-004',
    providerId: 'user-001',
    date: now,
    template: 'Dialysis Session',
    subjective: 'Patient reports feeling better this week. Less fatigue after last session. Mild swelling in ankles still present but improving.',
    objective: 'BP 138/88 pre-dialysis. Dry weight 72kg. AV fistula functional with good thrill and bruit. No signs of infection at access site.',
    assessment: 'CKD Stage 3 stable. Fluid overload improving with current dialysis regimen. Blood pressure slightly elevated but trending down.',
    plan: 'Continue current dialysis schedule (3x/week). Adjust dry weight target to 71.5kg. Review antihypertensive dose at next visit. Repeat bloods in 2 weeks.',
    vitals: { bp: '138/88', heartRate: 78, temperature: 36.6, weight: 73.2, o2Sat: 97 },
    attachments: [],
    isPrivate: false,
  },
  {
    id: 'tn-002',
    patientId: 'pt-002',
    providerId: 'user-001',
    date: now - day,
    template: 'General Consultation',
    subjective: 'New patient referral from GP. Progressive fatigue over 6 months. Decreased urine output. Family history of kidney disease.',
    objective: 'BP 152/94. Bilateral pedal oedema. Pallor noted. eGFR 18ml/min. Creatinine 380umol/L. Hb 9.2g/dL.',
    assessment: 'CKD Stage 4 with anaemia. Likely progression from uncontrolled hypertension. Dialysis planning needed.',
    plan: 'Start Erythropoietin for anaemia. Refer for fistula creation. Begin dialysis education. Follow up in 1 week with repeat bloods. Low salt diet advised.',
    vitals: { bp: '152/94', heartRate: 84, temperature: 36.8, weight: 68.5, o2Sat: 96 },
    attachments: [],
    isPrivate: false,
  },
  {
    id: 'tn-003',
    patientId: 'pt-003',
    providerId: 'user-001',
    date: now - 7 * day,
    template: 'Dialysis Session',
    subjective: 'Patient tolerating sessions well. No cramping or hypotension episodes this week. Appetite improving.',
    objective: 'Pre-dialysis weight 65.8kg. BP 128/82. Fistula patent. Kt/V 1.3 (adequate). Post-dialysis weight 63.5kg.',
    assessment: 'ESRD on regular haemodialysis. Dialysis adequacy within target. Anaemia improving with EPO.',
    plan: 'Continue 3x weekly HD. Repeat Hb in 1 week. Maintain current EPO dose. Iron sucrose next session.',
    vitals: { bp: '128/82', heartRate: 72, temperature: 36.5, weight: 65.8, o2Sat: 98 },
    attachments: [],
    isPrivate: false,
  },
  {
    id: 'tn-004',
    patientId: 'pt-005',
    providerId: 'user-001',
    date: now - 3 * day,
    template: 'Post-Op Review',
    subjective: 'Patient reports mild pain at surgical site, manageable with paracetamol. No fever. Bowel movements normal.',
    objective: 'Wound clean and dry. No signs of infection. Mild bruising around incision. Sutures intact.',
    assessment: 'Post-operative recovery on track. No complications.',
    plan: 'Continue paracetamol PRN. Remove sutures at 2-week mark. Return if any redness, swelling, or discharge. Light activity only for 2 more weeks.',
    vitals: { bp: '122/78', heartRate: 68, temperature: 36.7, weight: 81.0, o2Sat: 99 },
    attachments: [],
    isPrivate: false,
  },
  {
    id: 'tn-005',
    patientId: 'pt-001',
    providerId: 'user-005',
    date: now - 14 * day,
    template: 'Follow-up',
    subjective: 'Patient managing well on current medications. Reports occasional dizziness in mornings. Adherent to medication schedule.',
    objective: 'BP 134/84. HbA1c 7.2% (improved from 8.1%). Fasting glucose 6.8mmol/L. BMI 28.3.',
    assessment: 'Hypertension and T2DM improving with current regimen. HbA1c trending toward target. Postural hypotension possible cause of dizziness.',
    plan: 'Continue Metformin and Amlodipine. Check BP lying and standing at next visit. Dietary review with dietitian. Repeat HbA1c in 3 months.',
    vitals: { bp: '134/84', heartRate: 74, temperature: 36.6, weight: 76.5, o2Sat: 98 },
    attachments: [],
    isPrivate: false,
  },
  {
    id: 'tn-006',
    patientId: 'pt-006',
    providerId: 'user-003',
    date: now - 3 * day,
    template: 'General Consultation',
    subjective: 'Patient presents with persistent tiredness. No weight loss or night sweats. Diet mostly balanced but low in red meat.',
    objective: 'Pallor noted. No lymphadenopathy. Hb 10.1g/dL. MCV 68fL. Ferritin 8ug/L. Iron 4umol/L.',
    assessment: 'Iron deficiency anaemia. Likely dietary cause. No red flags for malignancy.',
    plan: 'Start Ferrous Sulphate 200mg TDS. Dietary advice for iron-rich foods. Repeat CBC in 6 weeks. Refer if no improvement.',
    vitals: { bp: '118/72', heartRate: 82, temperature: 36.4, weight: 70.0, o2Sat: 98 },
    attachments: [],
    isPrivate: false,
  },
];

export function getTreatmentNotesForPatient(patientId) {
  return mockTreatmentNotes
    .filter(n => n.patientId === patientId)
    .sort((a, b) => b.date - a.date);
}

export function getTreatmentNoteById(id) {
  return mockTreatmentNotes.find(n => n.id === id);
}

export function getPendingNotesCount() {
  // Mock: count of patients seen today without a note
  return 3;
}
