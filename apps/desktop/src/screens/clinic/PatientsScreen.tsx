import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import {
  Search, Plus, User, Phone, Mail, Edit2, Archive, ChevronRight, AlertTriangle, RefreshCw,
  FileText, Clipboard, Paperclip, Calendar, Briefcase, Receipt, CreditCard, DollarSign,
  Clock, MessageSquare, Download, Printer, Lock, CheckCircle, Eye, Trash2
} from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, Avatar, EmptyState, Spinner, PhoneInput, splitPhone, joinPhone, Card, cn } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const genderOptions = [{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }];
const bloodOptions = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v => ({ value: v, label: v }));
const deptOptions = ['General','Dialysis','ICU','Paediatrics','Maternity','Oncology','Cardiology','Orthopaedics','Other'].map(v => ({ value: v, label: v }));
const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'discharged', label: 'Discharged' }, { value: 'inactive', label: 'Inactive' }];

interface PatientForm {
  firstName: string; lastName: string; dateOfBirth: string; gender: string;
  phoneCountryCode: string; phoneNumber: string;
  email: string; bloodType: string; department: string;
  address: string; nrcNumber: string; occupation: string; employer: string;
  allergies: string; conditions: string; medications: string;
  insuranceProvider: string; policyNumber: string;
  // NHIMA / national insurance
  nhimaMemberNo: string; nhimaScheme: string; nhimaEmployer: string;
  emergencyContactName: string;
  emergencyContactCountryCode: string; emergencyContactNumber: string;
  emergencyContactRelationship: string;
  // Bank details
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
}
const empty: PatientForm = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
  phoneCountryCode: '+260', phoneNumber: '',
  email: '',
  bloodType: '', department: 'General', address: '', nrcNumber: '', occupation: '', employer: '',
  allergies: '', conditions: '', medications: '',
  insuranceProvider: '', policyNumber: '',
  nhimaMemberNo: '', nhimaScheme: '', nhimaEmployer: '',
  emergencyContactName: '',
  emergencyContactCountryCode: '+260', emergencyContactNumber: '',
  emergencyContactRelationship: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: '',
  bankBranchCode: '',
};

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const [y, m, d] = dob.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const mDiff = today.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const toArr = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

export default function PatientsScreen() {
  const { account, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selected, setSelectedState] = useState<any>(null);
  const [selectedSubTab, setSelectedSubTab] = useState<string>('Client details');
  const [form, setForm] = useState<PatientForm>(empty);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'info'|'medical'|'emergency'|'bank'>('info');
  const [showArchived, setShowArchived] = useState(false);

  // Note-related states
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [showNoteCreate, setShowNoteCreate] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [approvingNote, setApprovingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    template: 'SOAP',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    notes: '',
    isPrivate: false,
    bp: '',
    heartRate: '',
    temperature: '',
    weight: '',
    o2Sat: '',
    customResponses: {} as Record<string, string>,
  });

  const setNoteField = (k: string, v: any) => setNoteForm(f => ({ ...f, [k]: v }));
  const setCustomResponse = (qId: string, val: string) => {
    setNoteForm(f => ({
      ...f,
      customResponses: { ...f.customResponses, [qId]: val }
    }));
  };

  // Files uploader states
  const [uploadCategory, setUploadCategory] = useState<'Labs' | 'Other Investigations' | 'Other'>('Labs');
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // New Sub-tab Form States
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [newAlertText, setNewAlertText] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formResponses, setFormResponses] = useState('');
  const [savingForm, setSavingForm] = useState(false);

  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterRecipient, setLetterRecipient] = useState('');
  const [letterSubject, setLetterSubject] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [savingLetter, setSavingLetter] = useState(false);

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [savingCase, setSavingCase] = useState(false);

  const [showRecallModal, setShowRecallModal] = useState(false);
  const [recallType, setRecallType] = useState('');
  const [recallDueDate, setRecallDueDate] = useState('');
  const [recallNotes, setRecallNotes] = useState('');
  const [savingRecall, setSavingRecall] = useState(false);

  const [showCommModal, setShowCommModal] = useState(false);
  const [commType, setCommType] = useState('SMS');
  const [commDirection, setCommDirection] = useState('outbound');
  const [commSubject, setCommSubject] = useState('');
  const [commMessage, setCommMessage] = useState('');
  const [savingComm, setSavingComm] = useState(false);

  const setSelected = (p: any) => {
    setSelectedState(p);
    setSelectedSubTab('Client details');
    setSelectedNote(null);
  };

  const allPatients = useQuery(api.patients.list, {});
  const searchResults = useQuery(api.patients.search, search.length > 1 ? { query: search } : 'skip');
  const archivedPatients = useQuery(api.archive.listArchivedPatients, {});
  const nextCode = useQuery(api.patients.getNextPatientCode);

  // Patient Sub-tab queries
  const patientNotes = useQuery(api.treatmentNotes.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientFiles = useQuery(api.files.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientAppointments = useQuery(api.appointments.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientInvoices = useQuery(api.invoices.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientPayments = useQuery(api.paymentsClinic.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const customTemplates = useQuery(api.treatmentNoteTemplates.list, {});

  // New Patient Sub-tab queries
  const patientForms = useQuery(api.patientForms.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientLetters = useQuery(api.patientLetters.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientCases = useQuery(api.patientCases.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientRecalls = useQuery(api.patientRecalls.listByPatient, selected ? { patientId: selected._id } : 'skip');
  const patientCommunications = useQuery(api.patientCommunications.listByPatient, selected ? { patientId: selected._id } : 'skip');

  // New mutations
  const createPatientForm = useMutation(api.patientForms.create);
  const createPatientLetter = useMutation(api.patientLetters.create);
  const createPatientCase = useMutation(api.patientCases.create);
  const closePatientCase = useMutation(api.patientCases.closeCase);
  const createPatientRecall = useMutation(api.patientRecalls.create);
  const updatePatientRecallStatus = useMutation(api.patientRecalls.updateStatus);
  const createPatientCommunication = useMutation(api.patientCommunications.create);

  const handleRemoveAlert = async (idx: number) => {
    if (!selected) return;
    if (!hasPermission('editPatient')) {
      alert("You do not have permission to modify medical alerts.");
      return;
    }
    const current = selected.medicalAlerts || [];
    const nextAlerts = current.filter((_: any, i: number) => i !== idx);
    try {
      await updatePatient({ id: selected._id, medicalAlerts: nextAlerts, updatedBy: account?.email || 'admin' });
      setSelectedState((prev: any) => prev ? { ...prev, medicalAlerts: nextAlerts } : null);
    } catch (e: any) {
      alert(e.message || "Failed to remove medical alert");
    }
  };

  const handleAddAlert = async () => {
    if (!selected || !newAlertText.trim()) return;
    if (!hasPermission('editPatient')) {
      alert("You do not have permission to modify medical alerts.");
      return;
    }
    const current = selected.medicalAlerts || [];
    const nextAlerts = [...current, newAlertText.trim()];
    try {
      await updatePatient({ id: selected._id, medicalAlerts: nextAlerts, updatedBy: account?.email || 'admin' });
      setSelectedState((prev: any) => prev ? { ...prev, medicalAlerts: nextAlerts } : null);
      setNewAlertText('');
      setShowAlertModal(false);
    } catch (e: any) {
      alert(e.message || "Failed to add medical alert");
    }
  };

  // Renderers for new sub-tabs
  const renderForms = () => {
    const handleSaveForm = async () => {
      if (!formTitle.trim() || !formResponses.trim()) return;
      setSavingForm(true);
      try {
        await createPatientForm({
          patientId: selected._id,
          title: formTitle.trim(),
          responses: formResponses.trim(),
          submittedBy: account?.email || 'admin',
        });
        setFormTitle('');
        setFormResponses('');
        setShowFormModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to save form');
      } finally {
        setSavingForm(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Forms</h3>
            <p className="text-xs text-gray-400 mt-0.5">View and submit medical consent, intake, and assessment forms.</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowFormModal(true)} size="sm">Add Form</Button>
        </div>

        {!patientForms ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientForms.length === 0 ? (
          <EmptyState icon={<Clipboard size={24} />} title="No Forms Submitted" description="No consent or intake forms are registered for this patient." action={<Button icon={<Plus size={14} />} onClick={() => setShowFormModal(true)} size="sm">Add Form</Button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Form Title</th>
                  <th className="px-4 py-3 text-left">Submitted By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Responses Preview</th>
                </tr>
              </thead>
              <tbody>
                {patientForms.map((f: any) => (
                  <tr key={f._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{f.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{f.submittedBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                      {f.submittedAt ? format(new Date(f.submittedAt), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={f.status} color="green" />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-650 max-w-[250px] truncate" title={f.responses}>{f.responses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showFormModal} onClose={() => setShowFormModal(false)} title="Submit Patient Form" width="max-w-lg"
          footer={<><Button variant="outline" onClick={() => setShowFormModal(false)}>Cancel</Button><Button loading={savingForm} onClick={handleSaveForm} disabled={!formTitle.trim() || !formResponses.trim()}>Submit Form</Button></>}>
          <div className="space-y-4">
            <Input label="Form Title *" value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Consent Form, Intake Form" />
            <Textarea label="Form Content / Responses *" value={formResponses} onChange={e => setFormResponses(e.target.value)} placeholder="Enter answers or response details..." rows={6} />
          </div>
        </Modal>
      </div>
    );
  };

  const renderLetters = () => {
    const handleSaveLetter = async () => {
      if (!letterRecipient.trim() || !letterSubject.trim() || !letterBody.trim()) return;
      setSavingLetter(true);
      try {
        await createPatientLetter({
          patientId: selected._id,
          recipient: letterRecipient.trim(),
          subject: letterSubject.trim(),
          body: letterBody.trim(),
          sentBy: account?.email || 'admin',
        });
        setLetterRecipient('');
        setLetterSubject('');
        setLetterBody('');
        setShowLetterModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to save letter');
      } finally {
        setSavingLetter(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Letters</h3>
            <p className="text-xs text-gray-400 mt-0.5">View and compose referral letters, medical certificates, and reports.</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowLetterModal(true)} size="sm">Compose Letter</Button>
        </div>

        {!patientLetters ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientLetters.length === 0 ? (
          <EmptyState icon={<Mail size={24} />} title="No Letters Registered" description="No letters have been composed for this patient." action={<Button icon={<Plus size={14} />} onClick={() => setShowLetterModal(true)} size="sm">Compose Letter</Button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Sent By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Letter Body</th>
                </tr>
              </thead>
              <tbody>
                {patientLetters.map((l: any) => (
                  <tr key={l._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{l.recipient}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{l.subject}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{l.sentBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {l.sentAt ? format(new Date(l.sentAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-650 max-w-[250px] truncate" title={l.body}>{l.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showLetterModal} onClose={() => setShowLetterModal(false)} title="Compose Patient Letter" width="max-w-lg"
          footer={<><Button variant="outline" onClick={() => setShowLetterModal(false)}>Cancel</Button><Button loading={savingLetter} onClick={handleSaveLetter} disabled={!letterRecipient.trim() || !letterSubject.trim() || !letterBody.trim()}>Save & Sent</Button></>}>
          <div className="space-y-4">
            <Input label="Recipient *" value={letterRecipient} onChange={e => setLetterRecipient(e.target.value)} placeholder="e.g. Dr. Jane Mweemba, NHIMA Board" />
            <Input label="Subject *" value={letterSubject} onChange={e => setLetterSubject(e.target.value)} placeholder="e.g. Referral Letter, Sick Note Certificate" />
            <Textarea label="Letter Body *" value={letterBody} onChange={e => setLetterBody(e.target.value)} placeholder="Dear Doctor, I am writing to refer..." rows={8} />
          </div>
        </Modal>
      </div>
    );
  };

  const renderCases = () => {
    const handleSaveCase = async () => {
      if (!caseTitle.trim()) return;
      setSavingCase(true);
      try {
        await createPatientCase({
          patientId: selected._id,
          title: caseTitle.trim(),
          description: caseDescription.trim() || undefined,
          openedBy: account?.email || 'admin',
        });
        setCaseTitle('');
        setCaseDescription('');
        setShowCaseModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to save case');
      } finally {
        setSavingCase(false);
      }
    };

    const handleCloseCase = async (id: any) => {
      if (!confirm("Are you sure you want to close this medical case?")) return;
      try {
        await closePatientCase({ id });
        alert("Case closed successfully.");
      } catch (err: any) {
        alert(err.message || 'Failed to close case');
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Cases</h3>
            <p className="text-xs text-gray-400 mt-0.5">Organize medical notes, records, and visits into structured cases.</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowCaseModal(true)} size="sm">Open Case</Button>
        </div>

        {!patientCases ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientCases.length === 0 ? (
          <EmptyState icon={<Briefcase size={24} />} title="No Cases Opened" description="No medical cases are registered for this patient." action={<Button icon={<Plus size={14} />} onClick={() => setShowCaseModal(true)} size="sm">Open Case</Button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Case Title</th>
                  <th className="px-4 py-3 text-left">Opened By</th>
                  <th className="px-4 py-3 text-left">Opened Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patientCases.map((c: any) => (
                  <tr key={c._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{c.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.openedBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.openedAt ? format(new Date(c.openedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge label={c.status} color={c.status === 'open' ? 'green' : 'gray'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-650 truncate max-w-[150px]">{c.description || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      {c.status === 'open' && (
                        <Button variant="outline" size="sm" onClick={() => handleCloseCase(c._id)}>Close Case</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showCaseModal} onClose={() => setShowCaseModal(false)} title="Open Patient Case" width="max-w-lg"
          footer={<><Button variant="outline" onClick={() => setShowCaseModal(false)}>Cancel</Button><Button loading={savingCase} onClick={handleSaveCase} disabled={!caseTitle.trim()}>Open Case</Button></>}>
          <div className="space-y-4">
            <Input label="Case Title *" value={caseTitle} onChange={e => setCaseTitle(e.target.value)} placeholder="e.g. Chronic Kidney Disease management, Post-Op Care" />
            <Textarea label="Case Description" value={caseDescription} onChange={e => setCaseDescription(e.target.value)} placeholder="Enter details or summary about this case..." rows={4} />
          </div>
        </Modal>
      </div>
    );
  };

  const renderRecalls = () => {
    const activeRecallTypes = useQuery(api.recallTypes.listActive, {}) || [];

    const handleSaveRecall = async () => {
      if (!recallType.trim() || !recallDueDate) return;
      setSavingRecall(true);
      try {
        await createPatientRecall({
          patientId: selected._id,
          recallType: recallType.trim(),
          dueDate: new Date(recallDueDate).getTime(),
          notes: recallNotes.trim() || undefined,
          scheduledBy: account?.email || 'admin',
        });
        setRecallType('');
        setRecallDueDate('');
        setRecallNotes('');
        setShowRecallModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to save recall');
      } finally {
        setSavingRecall(false);
      }
    };

    const handleStatusChange = async (id: any, status: string) => {
      try {
        await updatePatientRecallStatus({ id, status });
        alert(`Recall marked as ${status}.`);
      } catch (err: any) {
        alert(err.message || 'Failed to update status');
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Recalls</h3>
            <p className="text-xs text-gray-400 mt-0.5">Schedule periodic medical check-ups, diagnostics, or routine review dates.</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowRecallModal(true)} size="sm">Schedule Recall</Button>
        </div>

        {!patientRecalls ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientRecalls.length === 0 ? (
          <EmptyState icon={<Clock size={24} />} title="No Recalls Scheduled" description="No upcoming recall reminders set for this patient." action={<Button icon={<Plus size={14} />} onClick={() => setShowRecallModal(true)} size="sm">Schedule Recall</Button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Recall Type</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Scheduled By</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patientRecalls.map((r: any) => (
                  <tr key={r._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{r.recallType}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-navy">
                      {r.dueDate ? format(new Date(r.dueDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.scheduledBy}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.status} color={r.status === 'pending' ? 'amber' : r.status === 'completed' ? 'green' : 'red'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-650 truncate max-w-[150px]">{r.notes || '—'}</td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {r.status === 'pending' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(r._id, 'completed')}>Complete</Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatusChange(r._id, 'cancelled')}>Cancel</Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showRecallModal} onClose={() => setShowRecallModal(false)} title="Schedule Recall Reminder" width="max-w-lg"
          footer={<><Button variant="outline" onClick={() => setShowRecallModal(false)}>Cancel</Button><Button loading={savingRecall} onClick={handleSaveRecall} disabled={!recallType.trim() || !recallDueDate}>Schedule Recall</Button></>}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recall Type *</label>
              <Select
                options={[
                  { value: '', label: 'Select type or enter custom...' },
                  ...activeRecallTypes.map(t => ({ value: t.name, label: t.name }))
                ]}
                value={activeRecallTypes.some(t => t.name === recallType) ? recallType : ''}
                onChange={e => setRecallType(e.target.value)}
              />
              {!activeRecallTypes.some(t => t.name === recallType) && (
                <div className="mt-2">
                  <Input placeholder="Enter custom recall type..." value={recallType} onChange={e => setRecallType(e.target.value)} />
                </div>
              )}
            </div>
            <Input label="Due Date *" type="date" value={recallDueDate} onChange={e => setRecallDueDate(e.target.value)} />
            <Textarea label="Notes" value={recallNotes} onChange={e => setRecallNotes(e.target.value)} placeholder="Recall notes or instructions..." rows={3} />
          </div>
        </Modal>
      </div>
    );
  };

  const renderCommunications = () => {
    const handleSaveComm = async () => {
      if (!commMessage.trim()) return;
      setSavingComm(true);
      try {
        await createPatientCommunication({
          patientId: selected._id,
          type: commType,
          direction: commDirection,
          subject: commSubject.trim() || undefined,
          message: commMessage.trim(),
          sentBy: account?.email || 'admin',
        });
        setCommSubject('');
        setCommMessage('');
        setShowCommModal(false);
      } catch (err: any) {
        alert(err.message || 'Failed to log communication');
      } finally {
        setSavingComm(false);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Communications History</h3>
            <p className="text-xs text-gray-450 mt-0.5">Review and log client contact records including SMS, emails, and phone calls.</p>
          </div>
          <Button icon={<Plus size={14} />} onClick={() => setShowCommModal(true)} size="sm">Log Contact</Button>
        </div>

        {!patientCommunications ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientCommunications.length === 0 ? (
          <EmptyState icon={<MessageSquare size={24} />} title="No Logs Found" description="No contact logs recorded for this patient yet." action={<Button icon={<Plus size={14} />} onClick={() => setShowCommModal(true)} size="sm">Log Contact</Button>} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Direction</th>
                  <th className="px-4 py-3 text-left">Subject</th>
                  <th className="px-4 py-3 text-left">Sent By</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Communication Details</th>
                </tr>
              </thead>
              <tbody>
                {patientCommunications.map((c: any) => (
                  <tr key={c._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-gray-800">{c.type}</td>
                    <td className="px-4 py-3">
                      <Badge label={c.direction} color={c.direction === 'outbound' ? 'blue' : 'green'} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 font-medium">{c.subject || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.sentBy}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.sentAt ? format(new Date(c.sentAt), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-650 max-w-[200px] truncate" title={c.message}>{c.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal open={showCommModal} onClose={() => setShowCommModal(false)} title="Log Communication Record" width="max-w-lg"
          footer={<><Button variant="outline" onClick={() => setShowCommModal(false)}>Cancel</Button><Button loading={savingComm} onClick={handleSaveComm} disabled={!commMessage.trim()}>Save Log</Button></>}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type *" options={[{ value: 'SMS', label: 'SMS' }, { value: 'Email', label: 'Email' }, { value: 'Phone Call', label: 'Phone Call' }, { value: 'Letter', label: 'Letter' }]} value={commType} onChange={e => setCommType(e.target.value)} />
              <Select label="Direction *" options={[{ value: 'outbound', label: 'Outbound' }, { value: 'inbound', label: 'Inbound' }]} value={commDirection} onChange={e => setCommDirection(e.target.value)} />
            </div>
            <Input label="Subject (optional)" value={commSubject} onChange={e => setCommSubject(e.target.value)} placeholder="e.g. Appointment Reminder" />
            <Textarea label="Message / Log Details *" value={commMessage} onChange={e => setCommMessage(e.target.value)} placeholder="Enter details of what was discussed or sent..." rows={5} />
          </div>
        </Modal>
      </div>
    );
  };
  
  const patients = showArchived 
    ? (archivedPatients || [])
    : (search.length > 1 ? searchResults : allPatients);

  const createPatient = useMutation(api.patients.create);
  const updatePatient = useMutation(api.patients.update);
  const archivePatient = useMutation(api.patients.archive);
  const restorePatient = useMutation(api.patients.restore);

  // Note mutations
  const createNote = useMutation(api.treatmentNotes.create);
  const updateNote = useMutation(api.treatmentNotes.update);
  const approveNote = useMutation(api.treatmentNotes.approve);

  // File mutations
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const uploadFileRecord = useMutation(api.files.uploadFileRecord);
  const deleteFileRecord = useMutation(api.files.deleteFileRecord);

  const set = (k: keyof PatientForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(empty); setTab('info'); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    const ph = splitPhone(p.phone || '', p.phoneCountryCode || '+260');
    const ep = splitPhone(p.emergencyContactPhone || '');
    setForm({
      firstName: p.firstName || '', lastName: p.lastName || '',
      dateOfBirth: p.dateOfBirth || '', gender: p.gender || 'Male',
      phoneCountryCode: p.phoneCountryCode || ph.code,
      phoneNumber: ph.number,
      email: p.email || '',
      address: p.address || '', nrcNumber: p.nrcNumber || '',
      occupation: p.occupation || '', employer: p.employer || '',
      bloodType: p.bloodType || '', department: p.department || 'General',
      allergies: (p.allergies || []).join(', '),
      conditions: (p.conditions || []).join(', '),
      medications: (p.medications || []).join(', '),
      insuranceProvider: p.insuranceProvider || '',
      policyNumber: p.policyNumber || '',
      nhimaMemberNo: p.nhimaMemberNo || '',
      nhimaScheme: p.nhimaScheme || '',
      nhimaEmployer: p.nhimaEmployer || '',
      emergencyContactName: p.emergencyContactName || '',
      emergencyContactCountryCode: ep.code,
      emergencyContactNumber: ep.number,
      emergencyContactRelationship: p.emergencyContactRelationship || '',
      bankName: p.bankName || '',
      bankAccountName: p.bankAccountName || '',
      bankAccountNumber: p.bankAccountNumber || '',
      bankBranchCode: p.bankBranchCode || '',
    });
    setTab('info');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber.trim()) return;
    setSaving(true);
    const fullPhone = joinPhone(form.phoneCountryCode, form.phoneNumber);
    const emergencyPhone = form.emergencyContactNumber
      ? joinPhone(form.emergencyContactCountryCode, form.emergencyContactNumber)
      : undefined;
    try {
      const shared = {
        firstName: form.firstName.trim(), lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth, gender: form.gender,
        phone: fullPhone, email: form.email.trim() || undefined,
        address: form.address.trim() || undefined, nrcNumber: form.nrcNumber.trim() || undefined,
        occupation: form.occupation.trim() || undefined, employer: form.employer.trim() || undefined,
        bloodType: form.bloodType || undefined,
        allergies: toArr(form.allergies), conditions: toArr(form.conditions),
        medications: toArr(form.medications),
        insuranceProvider: form.insuranceProvider || undefined,
        policyNumber: form.policyNumber || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: emergencyPhone,
        emergencyContactRelationship: form.emergencyContactRelationship || undefined,
        phoneCountryCode: form.phoneCountryCode || undefined,
        nhimaMemberNo: form.nhimaMemberNo.trim() || undefined,
        nhimaScheme: form.nhimaScheme.trim() || undefined,
        nhimaEmployer: form.nhimaEmployer.trim() || undefined,
        bankName: form.bankName.trim() || undefined,
        bankAccountName: form.bankAccountName.trim() || undefined,
        bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        bankBranchCode: form.bankBranchCode.trim() || undefined,
      };
      if (editing) {
        await updatePatient({ id: editing._id, ...shared, department: form.department, updatedBy: account?.email || 'admin' });
      } else {
        await createPatient({
          ...shared,
          patientCode: nextCode || 'PT-001',
          department: form.department,
          createdBy: account?.email || 'admin',
        });
      }
      setShowModal(false);
      if (!editing) setSelected(null);
    } catch (e: any) {
      console.error('Save patient error:', e);
    } finally { setSaving(false); }
  };

  const handleArchive = async (id: string) => {
    if (!hasPermission('archivePatient')) {
      alert('Only admins can archive patient records.');
      return;
    }
    const reason = prompt('Optional reason for archiving this patient (leave blank to skip):') || undefined;
    if (!confirm('Archive this patient record? Archived records are hidden from lists but kept for audit purposes.')) return;
    await archivePatient({
      id: id as any,
      archivedBy: account?.email || 'admin',
      archiveReason: reason,
    });
    if (selected?._id === id) setSelected(null);
  };

  const renderPlaceholder = (title: string, desc: string) => (
    <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-md mx-auto mt-8">
      <div className="p-3 bg-gray-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-gray-400 mb-3">
        <Clipboard size={20} />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </div>
  );

  const renderClientDetails = () => (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Personal Information</h3>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Phone', value: selected.phone },
          { label: 'Email', value: selected.email },
          { label: 'NRC Number', value: selected.nrcNumber },
          { label: 'Home Address', value: selected.address },
          { label: 'Occupation', value: selected.occupation },
          { label: 'Employer', value: selected.employer },
          { label: 'Blood Type', value: selected.bloodType },
          { label: 'Insurance', value: selected.insuranceProvider },
          { label: 'Policy #', value: selected.policyNumber },
          { label: 'NHIMA Member No.', value: selected.nhimaMemberNo },
          { label: 'NHIMA Scheme', value: selected.nhimaScheme },
          { label: 'NHIMA Employer', value: selected.nhimaEmployer },
          { label: 'Bank Name', value: selected.bankName },
          { label: 'Bank Account Name', value: selected.bankAccountName },
          { label: 'Bank Account Number', value: selected.bankAccountNumber },
          { label: 'Bank Branch Code', value: selected.bankBranchCode },
        ].filter(f => f.value).map(f => (
          <div key={f.label} className="bg-white rounded-xl border border-gray-100 p-3">
            <p className="text-xs text-gray-400">{f.label}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mt-2">Medical Record</h3>
      <div className="space-y-3">
        {selected.allergies?.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-100 p-4">
            <div className="flex items-center gap-1.5 mb-2"><AlertTriangle size={14} className="text-red-500" /><p className="text-xs font-semibold text-red-600">Allergies</p></div>
            <div className="flex flex-wrap gap-1.5">{selected.allergies.map((a: string) => <span key={a} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{a}</span>)}</div>
          </div>
        )}
        {selected.conditions?.length > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">Conditions</p>
            <div className="flex flex-wrap gap-1.5">{selected.conditions.map((c: string) => <span key={c} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{c}</span>)}</div>
          </div>
        )}
        {selected.medications?.length > 0 && (
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Current Medications</p>
            <div className="flex flex-wrap gap-1.5">{selected.medications.map((m: string) => <span key={m} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{m}</span>)}</div>
          </div>
        )}
        {(selected.emergencyContactName || selected.emergencyContactPhone) && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-2">Emergency Contact</p>
            <p className="text-sm font-medium text-gray-800">{selected.emergencyContactName}</p>
            {selected.emergencyContactPhone && <p className="text-xs text-gray-500">{selected.emergencyContactPhone} {selected.emergencyContactRelationship ? `· ${selected.emergencyContactRelationship}` : ''}</p>}
          </div>
        )}
      </div>
    </div>
  );

  const renderTreatmentNotes = () => {
    const templateOptions = [
      { value: 'SOAP', label: 'SOAP (Standard)' },
      { value: 'Progress Note', label: 'Progress Note' },
      { value: 'Consultation', label: 'Consultation' },
      ...(customTemplates || []).map(tpl => ({ value: tpl._id, label: `${tpl.name} (Custom)` }))
    ];

    const selectedCustomTemplate = (customTemplates || []).find(t => t._id === noteForm.template);

    const handleOpenNewNote = () => {
      setEditingNoteId(null);
      setNoteForm({
        template: 'SOAP',
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        notes: '',
        isPrivate: false,
        bp: '',
        heartRate: '',
        temperature: '',
        weight: '',
        o2Sat: '',
        customResponses: {},
      });
      setShowNoteCreate(true);
    };

    const handleOpenEditDraft = (note: any) => {
      setEditingNoteId(note._id);
      const customRespMap: Record<string, string> = {};
      if (note.customResponses) {
        note.customResponses.forEach((r: any) => {
          customRespMap[r.questionId] = r.value;
        });
      }
      setNoteForm({
        template: note.templateId || note.template,
        subjective: note.subjective || '',
        objective: note.objective || '',
        assessment: note.assessment || '',
        plan: note.plan || '',
        notes: '',
        isPrivate: note.isPrivate || false,
        bp: note.vitals?.bp || '',
        heartRate: note.vitals?.heartRate ? String(note.vitals.heartRate) : '',
        temperature: note.vitals?.temperature ? String(note.vitals.temperature) : '',
        weight: note.vitals?.weight ? String(note.vitals.weight) : '',
        o2Sat: note.vitals?.o2Sat ? String(note.vitals.o2Sat) : '',
        customResponses: customRespMap,
      });
      setShowNoteCreate(true);
    };

    const handleSaveNote = async (status: 'draft' | 'finalized') => {
      setSavingNote(true);
      try {
        const isCustom = selectedCustomTemplate !== undefined;
        const payload: any = {
          template: isCustom ? selectedCustomTemplate.name : noteForm.template,
          isPrivate: noteForm.isPrivate,
          status,
        };

        if (noteForm.bp || noteForm.heartRate || noteForm.temperature || noteForm.weight || noteForm.o2Sat) {
          payload.vitals = {
            bp: noteForm.bp || undefined,
            heartRate: noteForm.heartRate ? parseInt(noteForm.heartRate) : undefined,
            temperature: noteForm.temperature ? parseFloat(noteForm.temperature) : undefined,
            weight: noteForm.weight ? parseFloat(noteForm.weight) : undefined,
            o2Sat: noteForm.o2Sat ? parseInt(noteForm.o2Sat) : undefined,
          };
        } else {
          payload.vitals = undefined;
        }

        if (isCustom) {
          payload.templateId = selectedCustomTemplate._id;
          const responses: any[] = [];
          selectedCustomTemplate.sections.forEach(sec => {
            sec.questions.forEach(q => {
              responses.push({
                questionId: q.id,
                questionTitle: q.title,
                value: noteForm.customResponses[q.id] || '',
              });
            });
          });
          payload.customResponses = responses;
        } else {
          payload.templateId = undefined;
          payload.customResponses = undefined;
          payload.subjective = noteForm.subjective || undefined;
          payload.objective = noteForm.objective || undefined;
          payload.assessment = noteForm.assessment || undefined;
          payload.plan = noteForm.plan ? `${noteForm.plan}${noteForm.notes ? '\n\nNotes: ' + noteForm.notes : ''}` : (noteForm.notes || undefined);
        }

        if (editingNoteId) {
          await updateNote({ id: editingNoteId, ...payload, providerId: account?.email || 'admin' });
        } else {
          await createNote({
            patientId: selected._id,
            providerId: account?.email || 'admin',
            ...payload,
          });
        }
        setShowNoteCreate(false);
        setSelectedNote(null);
      } catch (err: any) {
        alert(err.message || 'Failed to save note');
      } finally {
        setSavingNote(false);
      }
    };

    const handleApproveNote = async () => {
      if (!selectedNote) return;
      setApprovingNote(true);
      try {
        await approveNote({
          id: selectedNote._id,
          approvedBy: account?.email || 'admin',
        });
        setSelectedNote((prev: any) => prev ? { ...prev, status: 'approved', approvedBy: account?.email || 'admin', approvedAt: Date.now() } : null);
      } catch (err: any) {
        alert(err.message || 'Failed to approve note');
      } finally {
        setApprovingNote(false);
      }
    };

    const handleCreateFollowUp = (prevNote: any) => {
      setEditingNoteId(null);
      const customRespMap: Record<string, string> = {};
      if (prevNote.customResponses) {
        prevNote.customResponses.forEach((r: any) => {
          customRespMap[r.questionId] = `[Prev: ${r.value}]\n`;
        });
      }
      const dateStr = prevNote.createdAt ? format(new Date(prevNote.createdAt), 'dd/MM/yyyy') : '';
      const followUpHeader = `[Follow-up of previous note from ${dateStr}]:\n`;
      setNoteForm({
        template: prevNote.templateId || prevNote.template,
        subjective: prevNote.subjective ? `${followUpHeader}${prevNote.subjective}\n` : '',
        objective: prevNote.objective ? `${followUpHeader}${prevNote.objective}\n` : '',
        assessment: prevNote.assessment ? `${followUpHeader}${prevNote.assessment}\n` : '',
        plan: prevNote.plan ? `${followUpHeader}${prevNote.plan}\n` : '',
        notes: '',
        isPrivate: prevNote.isPrivate || false,
        bp: prevNote.vitals?.bp || '',
        heartRate: prevNote.vitals?.heartRate ? String(prevNote.vitals.heartRate) : '',
        temperature: prevNote.vitals?.temperature ? String(prevNote.vitals.temperature) : '',
        weight: prevNote.vitals?.weight ? String(prevNote.vitals.weight) : '',
        o2Sat: prevNote.vitals?.o2Sat ? String(prevNote.vitals.o2Sat) : '',
        customResponses: customRespMap,
      });
      setShowNoteCreate(true);
    };

    const handleDownloadTxt = (note: any, patient: any) => {
      const vitalsStr = note.vitals 
        ? `PATIENT VITALS:\n- Blood Pressure: ${note.vitals.bp || 'N/A'}\n- Heart Rate: ${note.vitals.heartRate ? note.vitals.heartRate + ' bpm' : 'N/A'}\n- Temperature: ${note.vitals.temperature ? note.vitals.temperature + ' °C' : 'N/A'}\n- Weight: ${note.vitals.weight ? note.vitals.weight + ' kg' : 'N/A'}\n- O2 Saturation: ${note.vitals.o2Sat ? note.vitals.o2Sat + '%' : 'N/A'}\n\n`
        : '';
      
      let contentStr = '';
      if (note.templateId) {
        (note.customResponses || []).forEach((r: any) => {
          contentStr += `[${r.questionTitle.toUpperCase()}]\n${r.value || 'No response recorded.'}\n\n`;
        });
      } else if (note.template === 'SOAP') {
        contentStr += `[SUBJECTIVE]\n${note.subjective || 'N/A'}\n\n` +
                      `[OBJECTIVE]\n${note.objective || 'N/A'}\n\n` +
                      `[ASSESSMENT]\n${note.assessment || 'N/A'}\n\n` +
                      `[PLAN]\n${note.plan || 'N/A'}\n\n`;
      } else {
        contentStr += `[CLINICAL NOTES]\n${note.subjective || 'N/A'}\n\n`;
      }
      
      const docText = `NICHE HEALTHCARE LTD · CLINICAL TREATMENT RECORD\n` +
        `======================================================================\n` +
        `Document Title: ${note.template}\n` +
        `Document Status: ${(note.status || 'finalized').toUpperCase()}\n` +
        `Date Authored: ${note.createdAt ? format(new Date(note.createdAt), 'dd MMMM yyyy HH:mm') : 'N/A'}\n` +
        `Authored By: ${note.providerId}\n` +
        `Approved By: ${note.approvedBy || 'N/A'}\n` +
        `Approved At: ${note.approvedAt ? format(new Date(note.approvedAt), 'dd MMMM yyyy HH:mm') : 'N/A'}\n` +
        `======================================================================\n\n` +
        `PATIENT INFORMATION:\n` +
        `- Full Name: ${patient.displayName}\n` +
        `- Date of Birth: ${patient.dateOfBirth || 'N/A'}\n` +
        `- NHIMA Member No.: ${patient.nhimaMemberNo || 'N/A'}\n` +
        `- Patient Code: ${patient.patientCode || 'N/A'}\n` +
        `- Occupation: ${patient.occupation || 'N/A'}\n` +
        `- Address: ${patient.address || 'N/A'}\n\n` +
        `======================================================================\n\n` +
        vitalsStr +
        contentStr +
        `\n\nPractitioner electronic signature: ${note.providerId}\n` +
        `Confidential Medical EMR Record © Niche Healthcare Limited\n`;
      
      const blob = new Blob([docText], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${patient.displayName.replace(/\s+/g, '_')}_TreatmentNote_${note.createdAt}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const getStatusBadgeColor = (status: string) => {
      if (status === 'draft') return 'gray';
      if (status === 'approved') return 'green';
      return 'blue';
    };

    const loggedInAsAdmin = account?.role === 'admin';
    const linkedTemplate = selectedNote && selectedNote.templateId
      ? (customTemplates || []).find(t => t._id === selectedNote.templateId)
      : null;

    return (
      <div className="flex flex-col space-y-4 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Treatment Notes</h3>
          <Button icon={<Plus size={14} />} onClick={handleOpenNewNote} size="sm">Add Note</Button>
        </div>

        <div className="flex gap-4 items-stretch h-[500px]">
          {/* Notes list left panel */}
          <div className="w-64 border border-gray-100 rounded-xl bg-white flex flex-col shrink-0 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {!patientNotes ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : patientNotes.length === 0 ? (
              <EmptyState icon={<FileText size={24} />} title="No notes" description="Add the first EMR note" />
            ) : (
              patientNotes.map((n: any) => (
                <button
                  key={n._id}
                  onClick={() => setSelectedNote(n)}
                  className={cn(
                    "w-full flex flex-col px-3 py-2.5 rounded-lg border text-left transition-all duration-150",
                    selectedNote?._id === n._id
                      ? "bg-navy/5 border-navy/20"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{n.template}</span>
                    {n.isPrivate && <Lock size={10} className="text-gray-400 shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between w-full mt-1.5">
                    <span className="text-[10px] text-gray-400">{n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy') : ''}</span>
                    <Badge label={n.status || 'finalized'} color={getStatusBadgeColor(n.status || 'finalized')} />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Note detail right panel */}
          <div className="flex-1 border border-gray-100 rounded-xl bg-white p-5 overflow-y-auto scrollbar-thin">
            {!selectedNote ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText size={36} className="opacity-30 mb-2" />
                <p className="text-sm">Select a note to view EMR details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-gray-900">{selectedNote.template}</h4>
                      <Badge label={selectedNote.status || 'finalized'} color={getStatusBadgeColor(selectedNote.status || 'finalized')} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      By {selectedNote.providerId} on {selectedNote.createdAt ? format(new Date(selectedNote.createdAt), 'dd MMM yyyy HH:mm') : ''}
                    </p>
                    {selectedNote.approvedBy && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                        <CheckCircle size={11} /> Approved by {selectedNote.approvedBy}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" icon={<RefreshCw size={13} />} onClick={() => handleCreateFollowUp(selectedNote)}>Follow-up</Button>
                    <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={() => handleDownloadTxt(selectedNote, selected)}>Download</Button>
                    <Button variant="outline" size="sm" icon={<Printer size={13} />} onClick={() => setShowPrintModal(true)}>Print</Button>
                  </div>
                </div>

                {/* Vitals */}
                {selectedNote.vitals && (
                  <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 grid grid-cols-5 gap-1.5 text-center">
                    {[
                      { label: 'BP', val: selectedNote.vitals.bp },
                      { label: 'HR', val: selectedNote.vitals.heartRate ? `${selectedNote.vitals.heartRate} bpm` : null },
                      { label: 'Temp', val: selectedNote.vitals.temperature ? `${selectedNote.vitals.temperature}°C` : null },
                      { label: 'Weight', val: selectedNote.vitals.weight ? `${selectedNote.vitals.weight} kg` : null },
                      { label: 'O2 Sat', val: selectedNote.vitals.o2Sat ? `${selectedNote.vitals.o2Sat}%` : null },
                    ].map(v => (
                      <div key={v.label} className="border-r border-gray-200/60 last:border-0">
                        <p className="text-[9px] text-gray-400 uppercase font-semibold">{v.label}</p>
                        <p className="text-xs font-bold text-gray-700 mt-0.5">{v.val || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Note Content */}
                {selectedNote.templateId ? (
                  <div className="space-y-4">
                    {selectedNote.customResponses?.map((r: any) => (
                      <div key={r.questionId} className="border-b border-gray-50 pb-2.5 last:border-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{r.questionTitle}</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.value || <span className="text-gray-300 italic">No response</span>}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedNote.template === 'SOAP' ? (
                      [
                        { label: 'Subjective (Complaints / Symptoms)', value: selectedNote.subjective },
                        { label: 'Objective (Findings / Examination)', value: selectedNote.objective },
                        { label: 'Assessment (Diagnosis)', value: selectedNote.assessment },
                        { label: 'Plan (Treatment / Recommendations)', value: selectedNote.plan },
                      ].filter(f => f.value).map(f => (
                        <Card key={f.label} className="p-3 shadow-none border border-gray-100 bg-gray-50/20">
                          <p className="text-[10px] font-semibold text-navy uppercase tracking-wider mb-1">{f.label}</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.value}</p>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-3 shadow-none border border-gray-100 bg-gray-50/20">
                        <p className="text-[10px] font-semibold text-navy uppercase tracking-wider mb-1">Clinical Notes</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.subjective}</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Signing Footer */}
                <div className="flex items-center justify-between border-t border-gray-150 pt-3 mt-4">
                  <div>
                    {selectedNote.status === 'draft' && <p className="text-[11px] text-amber-600 font-medium">⚠️ Draft: Edit allowed.</p>}
                    {selectedNote.status === 'finalized' && <p className="text-[11px] text-blue-600 font-medium">🔒 Finalized: Signed and locked.</p>}
                    {selectedNote.status === 'approved' && <p className="text-[11px] text-green-600 font-medium">✓ Approved: Audited and closed.</p>}
                  </div>
                  <div className="flex gap-2">
                    {selectedNote.status === 'draft' && (
                      <Button size="sm" icon={<Edit2 size={13} />} onClick={() => handleOpenEditDraft(selectedNote)}>Edit Draft</Button>
                    )}
                    {selectedNote.status === 'finalized' && loggedInAsAdmin && (
                      <Button size="sm" color="green" loading={approvingNote} icon={<CheckCircle size={13} />} onClick={handleApproveNote}>Approve Note</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note modal */}
        <Modal open={showNoteCreate} onClose={() => setShowNoteCreate(false)} title={editingNoteId ? `Edit Draft Note` : `New Treatment Note`} width="max-w-2xl"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowNoteCreate(false)}>Cancel</Button>
              <Button variant="secondary" loading={savingNote} onClick={() => handleSaveNote('draft')}>Save Draft</Button>
              <Button loading={savingNote} onClick={() => handleSaveNote('finalized')}>Finalize & Sign</Button>
            </>
          }>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Template type" options={templateOptions} value={noteForm.template} onChange={e => setNoteField('template', e.target.value)} disabled={editingNoteId !== null} />
              <label className="flex items-center gap-2 mt-7 cursor-pointer">
                <input type="checkbox" checked={noteForm.isPrivate} onChange={e => setNoteField('isPrivate', e.target.checked)} className="rounded text-navy border-gray-200 focus:ring-navy" />
                <span className="text-sm text-gray-600 font-medium">Private note</span>
              </label>
            </div>

            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Patient Vitals</p>
              <div className="grid grid-cols-5 gap-2">
                <Input placeholder="BP" value={noteForm.bp} onChange={e => setNoteField('bp', e.target.value)} />
                <Input placeholder="HR" type="number" value={noteForm.heartRate} onChange={e => setNoteField('heartRate', e.target.value)} />
                <Input placeholder="Temp" type="number" step="0.1" value={noteForm.temperature} onChange={e => setNoteField('temperature', e.target.value)} />
                <Input placeholder="Weight" type="number" step="0.1" value={noteForm.weight} onChange={e => setNoteField('weight', e.target.value)} />
                <Input placeholder="O2 Sat" type="number" value={noteForm.o2Sat} onChange={e => setNoteField('o2Sat', e.target.value)} />
              </div>
            </div>

            {selectedCustomTemplate ? (
              <div className="space-y-4 border-t border-gray-100 pt-3">
                {selectedCustomTemplate.sections.map((section, sIdx) => (
                  <div key={sIdx} className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-50 pb-1">{section.title}</h4>
                    <div className="space-y-3 pl-2">
                      {section.questions.map((q) => (
                        <div key={q.id}>
                          {q.type === 'text' && <Input label={q.title} value={noteForm.customResponses[q.id] || ''} onChange={(e) => setCustomResponse(q.id, e.target.value)} />}
                          {q.type === 'paragraph' && <Textarea label={q.title} rows={3} value={noteForm.customResponses[q.id] || ''} onChange={(e) => setCustomResponse(q.id, e.target.value)} />}
                          {q.type === 'select' && <Select label={q.title} options={(q.options || []).map(o => ({ value: o, label: o }))} value={noteForm.customResponses[q.id] || ''} onChange={(e) => setCustomResponse(q.id, e.target.value)} placeholder="Select..." />}
                          {q.type === 'checkbox' && (
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-700">{q.title}</label>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {(q.options || []).map((opt) => {
                                  const selectedOpts = (noteForm.customResponses[q.id] || '').split(',').map(s => s.trim()).filter(Boolean);
                                  const isChecked = selectedOpts.includes(opt);
                                  return (
                                    <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={isChecked} className="rounded text-navy border-gray-200 focus:ring-navy" onChange={(e) => {
                                        let nextOpts = e.target.checked ? [...selectedOpts, opt] : selectedOpts.filter(o => o !== opt);
                                        setCustomResponse(q.id, nextOpts.join(', '));
                                      }} />
                                      <span className="text-sm text-gray-600">{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : noteForm.template === 'SOAP' ? (
              <div className="space-y-3">
                <Textarea label="S — Subjective" value={noteForm.subjective} onChange={e => setNoteField('subjective', e.target.value)} rows={3} placeholder="Complaints..." />
                <Textarea label="O — Objective" value={noteForm.objective} onChange={e => setNoteField('objective', e.target.value)} rows={3} placeholder="Examination..." />
                <Textarea label="A — Assessment" value={noteForm.assessment} onChange={e => setNoteField('assessment', e.target.value)} rows={3} placeholder="Diagnosis..." />
                <Textarea label="P — Plan" value={noteForm.plan} onChange={e => setNoteField('plan', e.target.value)} rows={3} placeholder="Treatment plan..." />
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea label="Clinical Notes" value={noteForm.subjective} onChange={e => setNoteField('subjective', e.target.value)} rows={8} placeholder="Enter clinical note details..." />
              </div>
            )}
          </div>
        </Modal>

        {/* Print Modal */}
        {selectedNote && (
          <Modal open={showPrintModal} onClose={() => setShowPrintModal(false)} title="Print Preview" width="max-w-3xl"
            footer={<><Button variant="outline" onClick={() => setShowPrintModal(false)}>Close</Button><Button onClick={() => window.print()} icon={<Printer size={16} />}>Print</Button></>}>
            <div id="print-area" className="p-8 text-gray-800 bg-white font-sans">
              <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
                <div>
                  <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">{linkedTemplate?.printSettings?.title || selectedNote.template}</h1>
                  <p className="text-xs text-gray-400 mt-1 font-semibold">NICHE HEALTHCARE LTD · CLINICAL TREATMENT RECORD</p>
                </div>
                {(linkedTemplate === null || linkedTemplate?.printSettings?.showLogo) && (
                  <img src="/logo.png" alt="NHL Logo" className="w-14 h-14 object-contain" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
                <div>
                  <p className="font-semibold text-gray-500">Patient Name</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{selected.displayName}</p>
                </div>
                {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientDob) && (
                  <div>
                    <p className="font-semibold text-gray-500">Date of Birth</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">{selected.dateOfBirth || '—'}</p>
                  </div>
                )}
                {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientReference) && (
                  <div className="mt-2">
                    <p className="font-semibold text-gray-500">Patient Code</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{selected.patientCode}</p>
                  </div>
                )}
                {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientNhima) && (
                  <div className="mt-2">
                    <p className="font-semibold text-gray-500">NHIMA Member No.</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">{selected.nhimaMemberNo || 'N/A'}</p>
                  </div>
                )}
                {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientAddress) && (
                  <div className="col-span-2 border-t border-gray-200/50 pt-2 mt-2">
                    <p className="font-semibold text-gray-500">Address</p>
                    <p className="text-sm text-gray-700 mt-0.5">{selected.address || '—'}</p>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 mb-6 flex justify-between">
                <span>Practitioner: <strong>{selectedNote.providerId}</strong></span>
                <span>Date: <strong>{selectedNote.createdAt ? format(new Date(selectedNote.createdAt), 'dd MMMM yyyy HH:mm') : ''}</strong></span>
              </div>

              {selectedNote.vitals && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 grid grid-cols-5 gap-2 text-center mb-6">
                  {[{ label: 'BP', val: selectedNote.vitals.bp }, { label: 'Heart Rate', val: selectedNote.vitals.heartRate ? `${selectedNote.vitals.heartRate} bpm` : null }, { label: 'Temperature', val: selectedNote.vitals.temperature ? `${selectedNote.vitals.temperature}°C` : null }, { label: 'Weight', val: selectedNote.vitals.weight ? `${selectedNote.vitals.weight} kg` : null }, { label: 'O2 Sat', val: selectedNote.vitals.o2Sat ? `${selectedNote.vitals.o2Sat}%` : null }].map(v => (
                    <div key={v.label} className="border-r border-gray-200 last:border-0">
                      <p className="text-[9px] text-gray-400 uppercase font-bold">{v.label}</p>
                      <p className="text-xs font-bold text-gray-800 mt-0.5">{v.val || '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedNote.templateId ? (
                <div className="space-y-6">
                  {selectedNote.customResponses?.map((r: any) => (
                    <div key={r.questionId} className="border-b border-gray-100 pb-3 last:border-0">
                      <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">{r.questionTitle}</h4>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.value || 'No response recorded.'}</p>
                    </div>
                  ))}
                </div>
              ) : selectedNote.template === 'SOAP' ? (
                <div className="space-y-6">
                  {[{ label: 'Subjective (Complaints / Symptoms)', value: selectedNote.subjective }, { label: 'Objective (Findings / Examination)', value: selectedNote.objective }, { label: 'Assessment (Diagnosis)', value: selectedNote.assessment }, { label: 'Plan (Treatment / Recommendations)', value: selectedNote.plan }].filter(f => f.value).map(f => (
                    <div key={f.label} className="border-b border-gray-100 pb-3 last:border-0">
                      <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">{f.label}</h4>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-b border-gray-100 pb-3 last:border-0">
                  <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">Clinical Notes</h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedNote.subjective}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  };

  const renderFiles = () => {
    const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingFiles(true);
      try {
        for (const file of Array.from(e.target.files)) {
          const uploadUrl = await generateUploadUrl({});
          const res = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file
          });
          if (!res.ok) throw new Error('File upload failed');
          const { storageId } = await res.json();
          
          await uploadFileRecord({
            name: file.name,
            fileType: file.type,
            size: file.size,
            uploadedBy: account?.email || 'admin',
            storageId,
            patientId: selected._id,
            category: uploadCategory,
          });
        }
        alert('Files uploaded successfully!');
      } catch (err: any) {
        alert(err.message || 'Upload failed');
      } finally {
        setUploadingFiles(false);
      }
    };

    const handleDeleteFile = async (id: any) => {
      if (!confirm('Are you sure you want to delete this file from patient EMR folder?')) return;
      try {
        await deleteFileRecord({ id });
        alert('File deleted successfully.');
      } catch (e: any) {
        alert(e.message || 'Failed to delete file.');
      }
    };

    const labsFiles = (patientFiles || []).filter(f => f.category === 'Labs');
    const investigationsFiles = (patientFiles || []).filter(f => f.category === 'Other Investigations');
    const otherFiles = (patientFiles || []).filter(f => f.category === 'Other' || !f.category);

    const renderFileList = (filesList: any[], categoryLabel: string) => {
      return (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1.5">{categoryLabel} ({filesList.length})</h4>
          {filesList.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-2">No files in this category.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-50 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Size</th>
                    <th className="px-4 py-2 text-left font-semibold">Uploaded</th>
                    <th className="px-4 py-2 text-left font-semibold">By</th>
                    <th className="px-4 py-2 text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {filesList.map((f: any) => (
                    <tr key={f._id} className="border-b border-gray-50 hover:bg-gray-50/30 transition last:border-0">
                      <td className="px-4 py-2.5 font-medium text-gray-800 flex items-center gap-2 truncate max-w-[240px]">
                        <Paperclip size={13} className="text-gray-400" />
                        <span className="truncate" title={f.name}>{f.name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">{(f.size ? (f.size / 1024).toFixed(1) : 0)} KB</td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{f.uploadedAt ? format(new Date(f.uploadedAt), 'dd MMM yyyy') : ''}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{f.uploadedBy || '—'}</td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        {f.url && (
                          <a href={f.url} download={f.name} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs text-navy hover:underline font-semibold">
                            <Download size={13} />
                          </a>
                        )}
                        <button onClick={() => handleDeleteFile(f._id)} className="text-gray-300 hover:text-red-500 transition p-1">
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Labs & Other Investigations</h3>
            <p className="text-xs text-gray-450 mt-0.5">Securely attach diagnostic reports, laboratory files, or imaging scans to patient records.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: 'Labs', label: 'Labs' },
                { value: 'Other Investigations', label: 'Other Investigations' },
                { value: 'Other', label: 'Other' },
              ]}
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value as any)}
              className="w-44 h-9 py-1"
            />
            <input
              type="file"
              multiple
              id="patient-files-uploader"
              className="hidden"
              onChange={handleUploadFiles}
            />
            <Button
              size="sm"
              loading={uploadingFiles}
              icon={<Paperclip size={14} />}
              onClick={() => document.getElementById('patient-files-uploader')?.click()}
            >
              Upload
            </Button>
          </div>
        </div>

        {uploadingFiles && (
          <div className="flex items-center gap-2 text-xs text-navy bg-navy/5 p-3 rounded-lg border border-navy/10">
            <Spinner size={14} />
            <span>Uploading attached documents to patient EMR, please wait...</span>
          </div>
        )}

        <div className="space-y-6">
          {renderFileList(labsFiles, 'Labs')}
          {renderFileList(investigationsFiles, 'Other Investigations')}
          {renderFileList(otherFiles, 'Other Documents')}
        </div>
      </div>
    );
  };

  const renderAppointments = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Appointments</h3>
        {!patientAppointments ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientAppointments.length === 0 ? (
          <EmptyState icon={<Calendar size={24} />} title="No appointments" description="No appointments scheduled for this patient." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Date & Time</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Provider ID</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {patientAppointments.map((app: any) => (
                  <tr key={app._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-medium text-gray-800">
                      {app.startTime ? format(new Date(app.startTime), 'dd MMM yyyy HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{app.type || 'Standard'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{app.providerId}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={app.status}
                        color={app.status === 'confirmed' || app.status === 'completed' ? 'green' : app.status === 'cancelled' ? 'red' : 'amber'}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-405 truncate max-w-[150px]">{app.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderInvoices = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Invoices</h3>
        {!patientInvoices ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientInvoices.length === 0 ? (
          <EmptyState icon={<Receipt size={24} />} title="No invoices" description="No billing invoices generated for this patient." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice #</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">NHIMA Status</th>
                </tr>
              </thead>
              <tbody>
                {patientInvoices.map((inv: any) => (
                  <tr key={inv._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs font-semibold text-navy">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inv.date ? format(new Date(inv.date), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-800">K {(inv.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge
                        label={inv.status}
                        color={inv.status === 'paid' ? 'green' : inv.status === 'unpaid' ? 'red' : 'amber'}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{inv.nhimaStatus || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderPayments = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Patient Payments</h3>
        {!patientPayments ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : patientPayments.length === 0 ? (
          <EmptyState icon={<CreditCard size={24} />} title="No payments" description="No invoice payments recorded for this patient." />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Reference #</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {patientPayments.map((pay: any) => (
                  <tr key={pay._id} className="border-t border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {pay.paymentDate ? format(new Date(pay.paymentDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700 capitalize font-medium">{pay.method?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{pay.referenceNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-green-600">K {(pay.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{pay.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderSubTabContent = () => {
    switch (selectedSubTab) {
      case 'Client details':
        return renderClientDetails();
      case 'Treatment notes':
        return renderTreatmentNotes();
      case 'Files':
        return renderFiles();
      case 'Appointments':
        return renderAppointments();
      case 'Invoices':
        return renderInvoices();
      case 'Payments':
        return renderPayments();
      case 'Forms':
        return renderForms();
      case 'Letters':
        return renderLetters();
      case 'Cases':
        return renderCases();
      case 'Recalls':
        return renderRecalls();
      case 'Communications':
        return renderCommunications();
      default:
        return renderPlaceholder(selectedSubTab, `This patient has no active ${selectedSubTab.toLowerCase()} registered.`);
    }
  };

  const statusColor: Record<string, any> = { active: 'green', discharged: 'amber', inactive: 'gray' };

  return (
    <div className="flex h-full">
      {/* List pane */}
      <div className="flex flex-col w-96 border-r border-gray-100 bg-white shrink-0">
        <div className="p-4 space-y-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
            </div>
            {hasPermission('createPatient') && (
              <Button icon={<Plus size={15} />} onClick={openNew} size="md">New</Button>
            )}
          </div>
          {/* Active / Archived local tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => { setShowArchived(false); setSelected(null); }}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${!showArchived ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Active File
            </button>
            <button
              onClick={() => { setShowArchived(true); setSelected(null); }}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${showArchived ? 'bg-white text-navy shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Archived ({archivedPatients?.length || 0})
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!patients ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : patients.length === 0 ? (
            <EmptyState icon={<User size={32} />} title="No patients found"
              description={search ? 'Try a different search' : 'Add your first patient'}
              action={<Button onClick={openNew} icon={<Plus size={15} />}>Add Patient</Button>} />
          ) : patients.map((p: any) => (
            <button key={p._id} onClick={() => setSelected(p)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selected?._id === p._id ? 'bg-navy/5 border-l-2 border-l-navy' : ''}`}>
              <Avatar name={p.displayName} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{p.displayName}</p>
                <p className="text-xs text-gray-500 truncate">{p.patientCode} · {p.phone || p.email || 'No contact'}</p>
              </div>
              <Badge label={p.status} color={statusColor[p.status] || 'gray'} />
            </button>
          ))}
        </div>
      </div>

      {/* Detail pane */}
      <div className="flex-1 bg-surface overflow-hidden">
        {!selected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center"><User size={40} className="mx-auto mb-2 text-gray-200" /><p className="text-sm text-gray-400">Select a patient to view details</p></div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-white">
            {/* Patient Header Banner */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-4">
                <Avatar name={selected.displayName} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{selected.displayName}</h2>
                    <Badge label={selected.status} color={statusColor[selected.status] || 'gray'} />
                  </div>
                  <p className="text-sm text-gray-500">{selected.patientCode} · {selected.gender} · DOB: {selected.dateOfBirth || '—'}{selected.dateOfBirth ? ` (${calcAge(selected.dateOfBirth)} yrs)` : ''}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{selected.department}</p>

                  {/* Medical Alerts HUD */}
                  <div className="flex flex-wrap gap-1.5 items-center mt-2.5 max-w-[500px]">
                    {selected.medicalAlerts?.map((alert: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-[#b93a3a] text-white px-2 py-0.5 rounded text-[11px] font-semibold shadow-sm transition hover:bg-[#a03232]">
                        <span>{alert}</span>
                        {hasPermission('editPatient') && (
                          <button onClick={() => handleRemoveAlert(idx)} className="hover:text-red-250 transition font-bold leading-none text-xs px-1">×</button>
                        )}
                      </span>
                    ))}
                    {hasPermission('editPatient') && (
                      <button
                        onClick={() => setShowAlertModal(true)}
                        className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 border border-gray-250 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium transition"
                      >
                        <span className="text-[#3c8dbc] font-bold">+</span> Add medical alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.isArchived ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={<RefreshCw size={14} />} 
                    onClick={async () => {
                      if (confirm('Restore this patient to active list?')) {
                        await restorePatient({ id: selected._id, restoredBy: account?.email || 'admin' });
                        setSelected(null);
                        alert('Patient record restored successfully!');
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    {hasPermission('editPatient') && (
                      <Button variant="outline" size="sm" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Edit</Button>
                    )}
                    {hasPermission('archivePatient') && (
                      <Button variant="danger" size="sm" icon={<Archive size={14} />} onClick={() => handleArchive(selected._id)}>Archive</Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Split layout: sidebar tabs on left, tab content on right */}
            <div className="flex flex-1 overflow-hidden">
              {/* Vertical Side Tabs */}
              <div className="w-56 border-r border-gray-100 bg-white p-3 space-y-1 overflow-y-auto shrink-0 scrollbar-thin">
                {[
                  { name: 'Client details', icon: <User size={14} />, count: null, permission: 'viewPatients' },
                  { name: 'Treatment notes', icon: <FileText size={14} />, count: patientNotes?.length ?? 0, permission: 'viewTreatmentNote' },
                  { name: 'Forms', icon: <Clipboard size={14} />, count: patientForms?.length ?? 0, permission: 'viewTreatmentNote' },
                  { name: 'Letters', icon: <Mail size={14} />, count: patientLetters?.length ?? 0, permission: 'viewTreatmentNote' },
                  { name: 'Files', icon: <Paperclip size={14} />, count: patientFiles?.length ?? 0, permission: 'viewPatients' },
                  { name: 'Appointments', icon: <Calendar size={14} />, count: patientAppointments?.length ?? 0, permission: 'viewAppointments' },
                  { name: 'Cases', icon: <Briefcase size={14} />, count: patientCases?.filter(c => c.status === 'open').length ?? 0, permission: 'viewTreatmentNote' },
                  { name: 'Invoices', icon: <Receipt size={14} />, count: patientInvoices?.length ?? 0, permission: 'viewFinancials' },
                  { name: 'Payments', icon: <CreditCard size={14} />, count: patientPayments?.length ?? 0, permission: 'viewFinancials' },
                  { name: 'Account statement', icon: <DollarSign size={14} />, count: null, permission: 'viewFinancials' },
                  { name: 'Recalls', icon: <Clock size={14} />, count: patientRecalls?.filter(r => r.status === 'pending').length ?? 0, permission: 'viewAppointments' },
                  { name: 'Communications', icon: <MessageSquare size={14} />, count: patientCommunications?.length ?? 0, permission: 'messaging' },
                ].filter(t => !t.permission || hasPermission(t.permission as any)).map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedSubTab(t.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-left",
                      selectedSubTab === t.name 
                        ? "bg-navy text-white shadow-sm font-semibold" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span>{t.name}</span>
                    </div>
                    {t.count !== null && t.count > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                        selectedSubTab === t.name ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      )}>
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Sub-tab content area */}
              <div className="flex-1 overflow-y-auto bg-surface p-6 scrollbar-thin">
                {renderSubTabContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editing ? `Edit — ${editing.displayName}` : `New Patient ${nextCode ? `(${nextCode})` : ''}`}
        width="max-w-2xl"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave} disabled={!form.firstName || !form.lastName || !form.phoneNumber}>Save Patient</Button></>}>
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-100 mb-4 -mt-1">
          {(['info', 'medical', 'emergency'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-2 text-sm font-medium capitalize border-b-2 transition ${tab === t ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
              {t === 'info' ? 'Personal Info' : t === 'medical' ? 'Medical' : 'Emergency'}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name *" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="e.g. Mwansa" />
            <Input label="Last Name *" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="e.g. Chilufya" />
            <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
            <Select label="Gender" options={genderOptions} value={form.gender} onChange={e => set('gender', e.target.value)} />
            <div><PhoneInput label="Phone *" countryCode={form.phoneCountryCode} value={form.phoneNumber} onChangeCountry={v => set('phoneCountryCode', v)} onChangeNumber={v => set('phoneNumber', v)} /></div>
            <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="patient@email.com" />
            <Input label="NRC Number" value={form.nrcNumber} onChange={e => set('nrcNumber', e.target.value)} placeholder="e.g. 123456/78/1" />
            <div className="col-span-2"><Input label="Home Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="e.g. 123 Main Rd, Lusaka" /></div>
            <Input label="Occupation" value={form.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g. Teacher" />
            <Input label="Employer" value={form.employer} onChange={e => set('employer', e.target.value)} placeholder="Company / Organisation" />
            <Select label="Department" options={deptOptions} value={form.department} onChange={e => set('department', e.target.value)} />
            <Select label="Blood Type" options={bloodOptions} placeholder="Select" value={form.bloodType} onChange={e => set('bloodType', e.target.value)} />
            <Input label="Insurance Provider" value={form.insuranceProvider} onChange={e => set('insuranceProvider', e.target.value)} />
            <Input label="Policy Number" value={form.policyNumber} onChange={e => set('policyNumber', e.target.value)} />
            <div className="col-span-2 grid grid-cols-3 gap-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
              <div className="col-span-3 text-xs font-semibold text-emerald-700">NHIMA (National Health Insurance)</div>
              <Input label="NHIMA Member No." value={form.nhimaMemberNo} onChange={e => set('nhimaMemberNo', e.target.value)} placeholder="e.g. NHIMA-12345" />
              <Input label="Scheme" value={form.nhimaScheme} onChange={e => set('nhimaScheme', e.target.value)} placeholder="e.g. Formal Sector" />
              <Input label="Employer" value={form.nhimaEmployer} onChange={e => set('nhimaEmployer', e.target.value)} />
            </div>
            {form.dateOfBirth && <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-700 font-medium">Age: {calcAge(form.dateOfBirth)} years</div>}
          </div>
        )}
        {tab === 'medical' && (
          <div className="space-y-4">
            <Textarea label="Allergies (comma-separated)" value={form.allergies} onChange={e => set('allergies', e.target.value)} placeholder="e.g. Penicillin, Sulfa" rows={2} />
            <Textarea label="Medical Conditions (comma-separated)" value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="e.g. Hypertension, Diabetes" rows={2} />
            <Textarea label="Current Medications (comma-separated)" value={form.medications} onChange={e => set('medications', e.target.value)} placeholder="e.g. Metformin 500mg, Amlodipine" rows={2} />
          </div>
        )}
        {tab === 'emergency' && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={form.emergencyContactName} onChange={e => set('emergencyContactName', e.target.value)} />
            <PhoneInput
              label="Contact Phone"
              countryCode={form.emergencyContactCountryCode}
              value={form.emergencyContactNumber}
              onChangeCountry={v => set('emergencyContactCountryCode', v)}
              onChangeNumber={v => set('emergencyContactNumber', v)}
            />
            <div className="col-span-2">
              <Input label="Relationship" value={form.emergencyContactRelationship} onChange={e => set('emergencyContactRelationship', e.target.value)} placeholder="e.g. Spouse, Parent, Sibling" />
            </div>
          </div>
        )}
      </Modal>

      {/* Medical Alert Modal */}
      <Modal open={showAlertModal} onClose={() => setShowAlertModal(false)} title="Add Medical Alert" width="max-w-md"
        footer={<><Button variant="outline" onClick={() => setShowAlertModal(false)}>Cancel</Button><Button onClick={handleAddAlert} disabled={!newAlertText.trim()}>Add Alert</Button></>}>
        <div className="space-y-3">
          <Input label="Medical Alert Text *" value={newAlertText} onChange={e => setNewAlertText(e.target.value)} placeholder="e.g. Developed likely Rash/petechial haemorrhage on 9th December" />
        </div>
      </Modal>
    </div>
  );
}
