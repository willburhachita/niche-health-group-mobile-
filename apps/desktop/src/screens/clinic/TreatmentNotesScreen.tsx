import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { FileText, Plus, Search, ChevronRight, AlertTriangle, Heart, Pill, Droplet, Printer, Eye, Lock, Edit3, CheckCircle, Download, RefreshCw } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Avatar, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

export default function TreatmentNotesScreen() {
  const { account } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  
  // Modal controllers
  const [showCreate, setShowCreate] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  // Edit states
  const [editingNoteId, setEditingNoteId] = useState<Id<'treatmentNotes'> | null>(null);

  // Note creation form state
  const [form, setForm] = useState({
    template: 'SOAP', // 'SOAP' | 'Progress Note' | 'Consultation' | [Custom Template ID]
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

  const allPatients = useQuery(api.patients.list, {});
  const searchResults = useQuery(api.patients.search, search ? { query: search } : 'skip');
  const patients = search ? searchResults : allPatients;

  const notes = useQuery(
    api.treatmentNotes.listByPatient,
    selectedPatient ? { patientId: selectedPatient._id } : 'skip'
  );
  
  const customTemplates = useQuery(api.treatmentNoteTemplates.list, {});
  const createNote = useMutation(api.treatmentNotes.create);
  const updateNote = useMutation(api.treatmentNotes.update);
  const approveNote = useMutation(api.treatmentNotes.approve);

  // Combine default template options with custom templates
  const templateOptions = [
    { value: 'SOAP', label: 'SOAP (Standard)' },
    { value: 'Progress Note', label: 'Progress Note' },
    { value: 'Consultation', label: 'Consultation' },
    ...(customTemplates || []).map(tpl => ({ value: tpl._id, label: `${tpl.name} (Custom)` }))
  ];

  const selectedCustomTemplate = (customTemplates || []).find(t => t._id === form.template);

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const setCustomResponse = (qId: string, val: string) => {
    setForm(f => ({
      ...f,
      customResponses: { ...f.customResponses, [qId]: val }
    }));
  };

  const handleOpenNewNote = () => {
    setEditingNoteId(null);
    setForm({
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
    setShowCreate(true);
  };

  const handleOpenEditDraft = (note: any) => {
    setEditingNoteId(note._id);
    
    // Parse custom responses map
    const customRespMap: Record<string, string> = {};
    if (note.customResponses) {
      note.customResponses.forEach((r: any) => {
        customRespMap[r.questionId] = r.value;
      });
    }

    setForm({
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
    setShowCreate(true);
  };

  const handleSave = async (status: 'draft' | 'finalized') => {
    if (!selectedPatient) return;
    setSaving(true);
    try {
      const isCustom = selectedCustomTemplate !== undefined;
      const payload: any = {
        template: isCustom ? selectedCustomTemplate.name : form.template,
        isPrivate: form.isPrivate,
        status,
      };

      // Vitals block
      if (form.bp || form.heartRate || form.temperature || form.weight || form.o2Sat) {
        payload.vitals = {
          bp: form.bp || undefined,
          heartRate: form.heartRate ? parseInt(form.heartRate) : undefined,
          temperature: form.temperature ? parseFloat(form.temperature) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          o2Sat: form.o2Sat ? parseInt(form.o2Sat) : undefined,
        };
      } else {
        payload.vitals = undefined;
      }

      if (isCustom) {
        payload.templateId = selectedCustomTemplate._id;
        // Build dynamic responses
        const responses: any[] = [];
        selectedCustomTemplate.sections.forEach(sec => {
          sec.questions.forEach(q => {
            responses.push({
              questionId: q.id,
              questionTitle: q.title,
              value: form.customResponses[q.id] || '',
            });
          });
        });
        payload.customResponses = responses;
      } else {
        payload.templateId = undefined;
        payload.customResponses = undefined;
        payload.subjective = form.subjective || undefined;
        payload.objective = form.objective || undefined;
        payload.assessment = form.assessment || undefined;
        payload.plan = form.plan ? `${form.plan}${form.notes ? '\n\nNotes: ' + form.notes : ''}` : (form.notes || undefined);
      }

      if (editingNoteId) {
        // Edit existing draft
        await updateNote({
          id: editingNoteId,
          ...payload,
        });
      } else {
        // Create new note
        await createNote({
          patientId: selectedPatient._id,
          providerId: account?.email || 'admin',
          ...payload,
        });
      }
      
      setShowCreate(false);
      setSelectedNote(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedNote) return;
    setApproving(true);
    try {
      await approveNote({
        id: selectedNote._id,
        approvedBy: account?.email || 'admin',
      });
      // Re-fetch or update status locally
      setSelectedNote((prev: any) => prev ? { ...prev, status: 'approved', approvedBy: account?.email || 'admin', approvedAt: Date.now() } : null);
    } catch (err: any) {
      alert(err.message || 'Failed to approve note');
    } finally {
      setApproving(false);
    }
  };

  const handleCreateFollowUp = (prevNote: any) => {
    setEditingNoteId(null);
    
    // Parse previous responses map
    const customRespMap: Record<string, string> = {};
    if (prevNote.customResponses) {
      prevNote.customResponses.forEach((r: any) => {
        customRespMap[r.questionId] = `[Prev: ${r.value}]\n`;
      });
    }

    const dateStr = prevNote.createdAt ? format(new Date(prevNote.createdAt), 'dd/MM/yyyy') : '';
    const followUpHeader = `[Follow-up of previous note from ${dateStr}]:\n`;

    setForm({
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
    
    setShowCreate(true);
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
    return 'blue'; // finalized
  };

  // Find linked template for the selected note to configure print options
  const linkedTemplate = selectedNote && selectedNote.templateId
    ? (customTemplates || []).find(t => t._id === selectedNote.templateId)
    : null;

  const handlePrint = () => {
    window.print();
  };

  const loggedInAsAdmin = account?.role === 'admin';

  return (
    <div className="flex h-full">
      {/* Patient list */}
      <div className="w-72 flex flex-col border-r border-gray-100 bg-white shrink-0">
        <div className="p-3 border-b border-gray-100">
          <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!patients ? <div className="flex justify-center py-10"><Spinner /></div>
            : patients.map((p: any) => (
              <button key={p._id} onClick={() => { setSelectedPatient(p); setSelectedNote(null); }}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selectedPatient?._id === p._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                <Avatar name={p.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.displayName}</p>
                  <p className="text-xs text-gray-400">{p.phone || p.email || 'No contact'}</p>
                </div>
                <ChevronRight size={13} className="text-gray-300 shrink-0" />
              </button>
            ))}
        </div>
      </div>

      {/* Notes list + detail */}
      <div className="flex-1 flex bg-surface overflow-hidden">
        {!selectedPatient ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center"><FileText size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select a patient to view notes</p></div>
          </div>
        ) : (
          <>
            {/* Notes list */}
            <div className="w-64 border-r border-gray-100 bg-white flex flex-col shrink-0">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</p>
                <button onClick={handleOpenNewNote} className="text-navy hover:text-navy-dark" aria-label="Add Note"><Plus size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {!notes ? <div className="flex justify-center py-6"><Spinner /></div>
                  : notes.length === 0 ? <EmptyState icon={<FileText size={24} />} title="No notes" description="Add the first note" action={<Button size="sm" onClick={handleOpenNewNote} icon={<Plus size={14} />}>Add Note</Button>} />
                    : notes.map((n: any) => (
                      <button key={n._id} onClick={() => setSelectedNote(n)}
                        className={`w-full flex items-start gap-2 px-3 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selectedNote?._id === n._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 justify-between">
                            <p className="text-xs font-semibold text-gray-800 truncate">{n.template}</p>
                            {n.isPrivate && <Lock size={10} className="text-gray-400 shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-400">{n.createdAt ? format(new Date(n.createdAt), 'dd MMM yyyy') : ''}</p>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold capitalize bg-gray-50 text-gray-600 ${n.status === 'draft' ? 'bg-gray-100 text-gray-500' : n.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                              {n.status || 'finalized'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-505 truncate mt-1">{n.assessment || n.subjective || (n.customResponses?.[0]?.value) || 'Click to view details'}</p>
                        </div>
                      </button>
                    ))}
              </div>
            </div>

            {/* Note detail */}
            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
              {/* Medical Summary Banner */}
              {selectedPatient && (
                <div className="mb-4 bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patient Medical Summary</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Allergies</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(selectedPatient.allergies || []).length > 0
                            ? selectedPatient.allergies.map((a: string) => <Badge key={a} label={a} color="red" />)
                            : <span className="text-xs text-gray-400">None</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Heart size={14} className="text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Conditions</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(selectedPatient.conditions || []).length > 0
                            ? selectedPatient.conditions.map((c: string) => <Badge key={c} label={c} color="amber" />)
                            : <span className="text-xs text-gray-400">None</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Pill size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Medications</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {(selectedPatient.medications || []).length > 0
                            ? selectedPatient.medications.map((m: string) => <Badge key={m} label={m} color="blue" />)
                            : <span className="text-xs text-gray-400">None</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Droplet size={14} className="text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Blood Type & NHIMA</p>
                        <p className="text-xs text-gray-800 mt-0.5 font-semibold">
                          Type: {selectedPatient.bloodType || 'N/A'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          NHIMA: {selectedPatient.nhimaMemberNo || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedNote ? (
                <div className="flex items-center justify-center h-64 text-gray-400 bg-white rounded-xl border border-gray-100">
                  <p className="text-sm">Select a note or create one</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl bg-white border border-gray-100 rounded-xl p-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{selectedNote.template}</h3>
                        <Badge label={selectedNote.status || 'finalized'} color={getStatusBadgeColor(selectedNote.status || 'finalized')} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Written by {selectedNote.providerId} on {selectedNote.createdAt ? format(new Date(selectedNote.createdAt), 'dd MMM yyyy HH:mm') : ''}
                      </p>
                      {selectedNote.approvedBy && (
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1 font-medium">
                          <CheckCircle size={12} /> Approved by {selectedNote.approvedBy} on {selectedNote.approvedAt ? format(new Date(selectedNote.approvedAt), 'dd MMM yyyy HH:mm') : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={() => handleCreateFollowUp(selectedNote)}>Follow-up</Button>
                      <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => handleDownloadTxt(selectedNote, selectedPatient)}>Download</Button>
                      <Button variant="outline" size="sm" icon={<Printer size={14} />} onClick={() => setShowPrintModal(true)}>Print</Button>
                    </div>
                  </div>

                  {/* Vitals rendering */}
                  {selectedNote.vitals && (
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 grid grid-cols-5 gap-2 text-center">
                      {[
                        { label: 'BP', val: selectedNote.vitals.bp },
                        { label: 'HR', val: selectedNote.vitals.heartRate ? `${selectedNote.vitals.heartRate} bpm` : null },
                        { label: 'Temp', val: selectedNote.vitals.temperature ? `${selectedNote.vitals.temperature}°C` : null },
                        { label: 'Weight', val: selectedNote.vitals.weight ? `${selectedNote.vitals.weight} kg` : null },
                        { label: 'O2 Sat', val: selectedNote.vitals.o2Sat ? `${selectedNote.vitals.o2Sat}%` : null },
                      ].map(v => (
                        <div key={v.label} className="border-r border-gray-200 last:border-0">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">{v.label}</p>
                          <p className="text-xs font-bold text-gray-800 mt-0.5">{v.val || '—'}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note SOAP contents */}
                  {selectedNote.templateId ? (
                    // Custom Template responses
                    <div className="space-y-4 pt-2">
                      {selectedNote.customResponses && selectedNote.customResponses.length > 0 ? (
                        selectedNote.customResponses.map((r: any) => (
                          <div key={r.questionId} className="border-b border-gray-50 pb-3 last:border-0">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{r.questionTitle}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.value || <span className="text-gray-300 italic">No response</span>}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">No responses recorded.</p>
                      )}
                    </div>
                  ) : (
                    // Standard SOAP contents
                    <div className="space-y-4 pt-2">
                      {selectedNote.template === 'SOAP' ? (
                        [
                          { label: 'Subjective (Complaints / Symptoms)', value: selectedNote.subjective },
                          { label: 'Objective (Findings / Examination)', value: selectedNote.objective },
                          { label: 'Assessment (Diagnosis)', value: selectedNote.assessment },
                          { label: 'Plan (Treatment / Recommendations)', value: selectedNote.plan },
                        ].filter(f => f.value).map(f => (
                          <Card key={f.label} className="p-4 shadow-none border border-gray-100 bg-gray-50/30">
                            <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">{f.label}</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{f.value}</p>
                          </Card>
                        ))
                      ) : (
                        <Card className="p-4 shadow-none border border-gray-100 bg-gray-50/30">
                          <p className="text-xs font-semibold text-navy uppercase tracking-wider mb-1.5">Clinical Notes</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedNote.subjective}</p>
                        </Card>
                      )}
                    </div>
                  )}

                  {/* Actions footer for signing/locking */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                    <div>
                      {selectedNote.status === 'draft' && (
                        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                          <AlertTriangle size={13} /> This is a draft note and can be edited.
                        </p>
                      )}
                      {selectedNote.status === 'finalized' && (
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <Lock size={13} /> Finalized and locked. Awaiting administrator review.
                        </p>
                      )}
                      {selectedNote.status === 'approved' && (
                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                          <CheckCircle size={13} /> Approved and archived in patient file.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedNote.status === 'draft' && (
                        <Button size="sm" icon={<Edit3 size={14} />} onClick={() => handleOpenEditDraft(selectedNote)}>
                          Edit Draft
                        </Button>
                      )}
                      {selectedNote.status === 'finalized' && loggedInAsAdmin && (
                        <Button size="sm" color="green" loading={approving} icon={<CheckCircle size={14} />} onClick={handleApprove}>
                          Approve Note
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal for creating/editing a note */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={editingNoteId ? `Edit Draft — ${selectedPatient?.displayName || ''}` : `New Note — ${selectedPatient?.displayName || ''}`} width="max-w-2xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="secondary" loading={saving} onClick={() => handleSave('draft')}>Save Draft</Button>
            <Button loading={saving} onClick={() => handleSave('finalized')}>Finalize & Sign</Button>
          </>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Template type" options={templateOptions} value={form.template} onChange={e => set('template', e.target.value)} disabled={editingNoteId !== null} />
            <label className="flex items-center gap-2 mt-7 cursor-pointer">
              <input type="checkbox" checked={form.isPrivate} onChange={e => set('isPrivate', e.target.checked)} className="rounded text-navy border-gray-200 focus:ring-navy" />
              <span className="text-sm text-gray-600 font-medium">Mark note as private</span>
            </label>
          </div>

          {/* Vitals row */}
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Patient Vitals</p>
            <div className="grid grid-cols-5 gap-2">
              <Input placeholder="BP (e.g. 120/80)" value={form.bp} onChange={e => set('bp', e.target.value)} />
              <Input placeholder="HR (bpm)" type="number" value={form.heartRate} onChange={e => set('heartRate', e.target.value)} />
              <Input placeholder="Temp (°C)" type="number" step="0.1" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
              <Input placeholder="Weight (kg)" type="number" step="0.1" value={form.weight} onChange={e => set('weight', e.target.value)} />
              <Input placeholder="O2 Sat (%)" type="number" value={form.o2Sat} onChange={e => set('o2Sat', e.target.value)} />
            </div>
          </div>

          {selectedCustomTemplate ? (
            // Render Dynamic Custom Template inputs
            <div className="space-y-5 border-t border-gray-100 pt-3">
              {selectedCustomTemplate.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-50 pb-1">{section.title}</h4>
                  <div className="space-y-3 pl-2">
                    {section.questions.map((q) => (
                      <div key={q.id}>
                        {q.type === 'text' && (
                          <Input
                            label={q.title}
                            value={form.customResponses[q.id] || ''}
                            onChange={(e) => setCustomResponse(q.id, e.target.value)}
                          />
                        )}
                        {q.type === 'paragraph' && (
                          <Textarea
                            label={q.title}
                            rows={3}
                            value={form.customResponses[q.id] || ''}
                            onChange={(e) => setCustomResponse(q.id, e.target.value)}
                          />
                        )}
                        {q.type === 'select' && (
                          <Select
                            label={q.title}
                            options={(q.options || []).map(o => ({ value: o, label: o }))}
                            value={form.customResponses[q.id] || ''}
                            onChange={(e) => setCustomResponse(q.id, e.target.value)}
                            placeholder="Select an option..."
                          />
                        )}
                        {q.type === 'checkbox' && (
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700">{q.title}</label>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {(q.options || []).map((opt) => {
                                const selectedOpts = (form.customResponses[q.id] || '').split(',').map(s => s.trim()).filter(Boolean);
                                const isChecked = selectedOpts.includes(opt);
                                return (
                                  <label key={opt} className="inline-flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        let nextOpts;
                                        if (e.target.checked) {
                                          nextOpts = [...selectedOpts, opt];
                                        } else {
                                          nextOpts = selectedOpts.filter(o => o !== opt);
                                        }
                                        setCustomResponse(q.id, nextOpts.join(', '));
                                      }}
                                      className="rounded text-navy border-gray-200 focus:ring-navy"
                                    />
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
          ) : form.template === 'SOAP' ? (
            // Render Standard SOAP inputs
            <div className="space-y-3">
              <Textarea label="S — Subjective" value={form.subjective} onChange={e => set('subjective', e.target.value)} rows={3} placeholder="Patient's complaints and symptoms..." />
              <Textarea label="O — Objective" value={form.objective} onChange={e => set('objective', e.target.value)} rows={3} placeholder="Exam findings, vitals..." />
              <Textarea label="A — Assessment" value={form.assessment} onChange={e => set('assessment', e.target.value)} rows={3} placeholder="Diagnosis..." />
              <Textarea label="P — Plan" value={form.plan} onChange={e => set('plan', e.target.value)} rows={3} placeholder="Treatment plan, medications..." />
            </div>
          ) : (
            // Render Standard Clinical Note input
            <div className="space-y-3">
              <Textarea label="Clinical Notes" value={form.subjective} onChange={e => set('subjective', e.target.value)} rows={8} placeholder="Enter clinical note details..." />
            </div>
          )}
        </div>
      </Modal>

      {/* Printable template Note Modal */}
      {selectedNote && selectedPatient && (
        <Modal
          open={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title="Print Preview"
          width="max-w-3xl animate-fadeIn"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>Close</Button>
              <Button onClick={handlePrint} icon={<Printer size={16} />}>Print</Button>
            </>
          }
        >
          {/* Printable Layout Container */}
          <div id="print-area" className="p-8 text-gray-800 font-sans leading-relaxed print:p-0 bg-white">
            {/* Header: title + optional logo */}
            <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
              <div>
                <h1 className="text-2xl font-black uppercase text-gray-900 tracking-tight">
                  {linkedTemplate?.printSettings?.title || selectedNote.template}
                </h1>
                <p className="text-xs text-gray-400 mt-1 font-semibold">
                  NICHE HEALTHCARE LTD · CLINICAL TREATMENT RECORD
                </p>
              </div>
              {/* Conditional Logo based on template settings */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showLogo) && (
                <img src="/logo.png" alt="NHL Logo" className="w-14 h-14 object-contain" />
              )}
            </div>

            {/* Patient demographics section */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6">
              <div>
                <p className="font-semibold text-gray-500">Patient Name</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedPatient.displayName}</p>
              </div>
              
              {/* DOB Checkbox conditional */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientDob) && (
                <div>
                  <p className="font-semibold text-gray-500">Date of Birth</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedPatient.dateOfBirth || '—'}</p>
                </div>
              )}

              {/* Reference Checkbox conditional */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientReference) && (
                <div className="mt-2">
                  <p className="font-semibold text-gray-500">Patient Reference / Code</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.patientCode}</p>
                </div>
              )}

              {/* NHIMA Checkbox conditional */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientNhima) && (
                <div className="mt-2">
                  <p className="font-semibold text-gray-500">NHIMA Scheme Member No.</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedPatient.nhimaMemberNo || 'N/A'}</p>
                </div>
              )}

              {/* Address Checkbox conditional */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientAddress) && (
                <div className="col-span-2 border-t border-gray-200/50 pt-2 mt-2">
                  <p className="font-semibold text-gray-500">Home Address</p>
                  <p className="text-sm text-gray-700 mt-0.5">{selectedPatient.address || 'No address registered.'}</p>
                </div>
              )}

              {/* Occupation Checkbox conditional */}
              {(linkedTemplate === null || linkedTemplate?.printSettings?.showPatientOccupation) && selectedPatient.occupation && (
                <div className="col-span-2 border-t border-gray-200/50 pt-2 mt-2">
                  <p className="font-semibold text-gray-500">Occupation</p>
                  <p className="text-sm text-gray-700 mt-0.5">{selectedPatient.occupation}</p>
                </div>
              )}
            </div>

            {/* Note details */}
            <div className="text-xs text-gray-400 mb-6 flex justify-between">
              <span>Practitioner: <strong className="text-gray-700 font-bold">{selectedNote.providerId}</strong></span>
              <span>Date Authored: <strong className="text-gray-700 font-bold">{selectedNote.createdAt ? format(new Date(selectedNote.createdAt), 'dd MMMM yyyy HH:mm') : ''}</strong></span>
            </div>

            {/* Vitals row */}
            {selectedNote.vitals && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 grid grid-cols-5 gap-2 text-center mb-6">
                {[
                  { label: 'BP', val: selectedNote.vitals.bp },
                  { label: 'Heart Rate', val: selectedNote.vitals.heartRate ? `${selectedNote.vitals.heartRate} bpm` : null },
                  { label: 'Temperature', val: selectedNote.vitals.temperature ? `${selectedNote.vitals.temperature}°C` : null },
                  { label: 'Weight', val: selectedNote.vitals.weight ? `${selectedNote.vitals.weight} kg` : null },
                  { label: 'O2 Sat', val: selectedNote.vitals.o2Sat ? `${selectedNote.vitals.o2Sat}%` : null },
                ].map(v => (
                  <div key={v.label} className="border-r border-gray-200 last:border-0">
                    <p className="text-[9px] text-gray-400 uppercase font-bold">{v.label}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{v.val || '—'}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic sections render */}
            {selectedNote.templateId ? (
              <div className="space-y-6">
                {selectedNote.customResponses?.map((r: any) => (
                  <div key={r.questionId} className="border-b border-gray-100 pb-3 last:border-0">
                    <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">{r.questionTitle}</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{r.value || 'No response recorded.'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {selectedNote.template === 'SOAP' ? (
                  [
                    { label: 'Subjective (Complaints / Symptoms)', value: selectedNote.subjective },
                    { label: 'Objective (Findings / Examination)', value: selectedNote.objective },
                    { label: 'Assessment (Diagnosis)', value: selectedNote.assessment },
                    { label: 'Plan (Treatment / Recommendations)', value: selectedNote.plan },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="border-b border-gray-100 pb-3 last:border-0">
                      <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">{f.label}</h4>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))
                ) : (
                  <div className="border-b border-gray-100 pb-3 last:border-0">
                    <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-2">Clinical Notes</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedNote.subjective}</p>
                  </div>
                )}
              </div>
            )}

            {/* Footer Sign-off block */}
            <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs text-gray-400">
              <div>
                <p className="font-semibold uppercase tracking-wider text-gray-400">Clinician Signature</p>
                <div className="border-b border-gray-300 h-10 mt-2 w-48" />
                <p className="mt-1 text-[10px]">{selectedNote.providerId}</p>
                {selectedNote.approvedBy && (
                  <p className="text-[10px] text-green-600 mt-1 font-semibold">
                    ✓ Approved by Admin: {selectedNote.approvedBy}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>© Niche Healthcare Limited</p>
                <p className="text-[10px] mt-1 text-gray-400">Confidential Medical Record</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
