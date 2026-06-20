import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Id } from '@convex/_generated/dataModel';
import { Plus, Trash2, Save, FileText, ArrowLeft, Settings, CheckSquare, ListPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button, Input, Select, Textarea, Spinner, EmptyState, Card, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

interface Question {
  id: string;
  title: string;
  type: string;
  options?: string[];
}

interface Section {
  title: string;
  questions: Question[];
}

interface TemplateForm {
  name: string;
  description: string;
  sections: Section[];
  printSettings: {
    title: string;
    showLogo: boolean;
    showPatientAddress: boolean;
    showPatientDob: boolean;
    showPatientNhima: boolean;
    showPatientReference: boolean;
    showPatientOccupation: boolean;
  };
}

const QUESTION_TYPES = [
  { value: 'text', label: 'Single Line Text' },
  { value: 'paragraph', label: 'Paragraph / Multi-line Text' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'checkbox', label: 'Checkboxes' },
];

export default function TemplateDesignerScreen() {
  const { account } = useAuth();
  const templates = useQuery(api.treatmentNoteTemplates.list, {});
  const createTemplate = useMutation(api.treatmentNoteTemplates.create);
  const updateTemplate = useMutation(api.treatmentNoteTemplates.update);
  const archiveTemplate = useMutation(api.treatmentNoteTemplates.archive);

  const [editingId, setEditingId] = useState<Id<'treatmentNoteTemplates'> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultForm = (): TemplateForm => ({
    name: '',
    description: '',
    sections: [{ title: 'Subjective / Objective Findings', questions: [] }],
    printSettings: {
      title: '',
      showLogo: true,
      showPatientAddress: true,
      showPatientDob: true,
      showPatientNhima: true,
      showPatientReference: true,
      showPatientOccupation: true,
    },
  });

  const [form, setForm] = useState<TemplateForm>(defaultForm());

  const handleEdit = (tpl: any) => {
    setForm({
      name: tpl.name,
      description: tpl.description || '',
      sections: tpl.sections || [],
      printSettings: {
        title: tpl.printSettings?.title || '',
        showLogo: tpl.printSettings?.showLogo ?? true,
        showPatientAddress: tpl.printSettings?.showPatientAddress ?? true,
        showPatientDob: tpl.printSettings?.showPatientDob ?? true,
        showPatientNhima: tpl.printSettings?.showPatientNhima ?? true,
        showPatientReference: tpl.printSettings?.showPatientReference ?? true,
        showPatientOccupation: tpl.printSettings?.showPatientOccupation ?? true,
      },
    });
    setEditingId(tpl._id);
    setIsNew(false);
  };

  const handleCreateNew = () => {
    setForm(defaultForm());
    setIsNew(true);
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsNew(false);
  };

  // Section managers
  const addSection = () => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: `New Section ${prev.sections.length + 1}`, questions: [] }],
    }));
  };

  const removeSection = (sIdx: number) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, idx) => idx !== sIdx),
    }));
  };

  const updateSectionTitle = (sIdx: number, val: string) => {
    setForm((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sIdx].title = val;
      return { ...prev, sections: nextSecs };
    });
  };

  // Question managers
  const addQuestion = (sIdx: number) => {
    const qId = `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setForm((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sIdx].questions = [
        ...nextSecs[sIdx].questions,
        { id: qId, title: 'New Question', type: 'text' },
      ];
      return { ...prev, sections: nextSecs };
    });
  };

  const removeQuestion = (sIdx: number, qIdx: number) => {
    setForm((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sIdx].questions = nextSecs[sIdx].questions.filter((_, idx) => idx !== qIdx);
      return { ...prev, sections: nextSecs };
    });
  };

  const updateQuestion = (sIdx: number, qIdx: number, updates: Partial<Question>) => {
    setForm((prev) => {
      const nextSecs = [...prev.sections];
      nextSecs[sIdx].questions[qIdx] = {
        ...nextSecs[sIdx].questions[qIdx],
        ...updates,
      };
      return { ...prev, sections: nextSecs };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateTemplate({
          id: editingId,
          name: form.name,
          description: form.description || undefined,
          sections: form.sections,
          printSettings: form.printSettings,
        });
      } else {
        await createTemplate({
          name: form.name,
          description: form.description || undefined,
          sections: form.sections,
          printSettings: form.printSettings,
          createdBy: account?.email || 'admin',
        });
      }
      setEditingId(null);
      setIsNew(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (id: Id<'treatmentNoteTemplates'>) => {
    if (confirm('Are you sure you want to archive this treatment note template?')) {
      await archiveTemplate({ id });
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  const isEditing = editingId !== null || isNew;

  return (
    <div className="flex h-full bg-surface">
      {!isEditing ? (
        // LIST VIEW
        <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Treatment Note Templates</h1>
              <p className="text-sm text-gray-500">Design dynamic fields and custom print formats for clinic SOAP notes.</p>
            </div>
            <Button icon={<Plus size={16} />} onClick={handleCreateNew}>New Template</Button>
          </div>

          {!templates ? (
            <div className="flex justify-center py-20"><Spinner size={32} /></div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} className="opacity-20" />}
              title="No Custom Templates"
              description="Create a dynamic template with customized sections, check boxes, dropdowns, and logo settings."
              action={<Button size="sm" onClick={handleCreateNew} icon={<Plus size={14} />}>Add Note Template</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <Card key={tpl._id} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 truncate">{tpl.name}</h3>
                      <Badge label={`${tpl.sections.reduce((acc, s) => acc + s.questions.length, 0)} fields`} color="navy" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Created by {tpl.createdBy}</p>
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2 h-10">{tpl.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(tpl)}>Edit Template</Button>
                    <button onClick={() => handleArchive(tpl._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="Archive Template">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        // EDITOR FORM VIEW
        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button type="button" onClick={handleCancel} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <ArrowLeft size={16} />
              </button>
              <div>
                <h1 className="text-base font-bold text-gray-900">{editingId ? 'Edit Note Template' : 'New Note Template'}</h1>
                <p className="text-xs text-gray-400">Design sections, custom inputs, and configure print display settings.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button type="submit" loading={saving} icon={<Save size={16} />}>Save Template</Button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Template fields designer */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin border-r border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Template Name"
                  placeholder="e.g., General Assessment, Dialysis Checklist"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  label="Description (Optional)"
                  placeholder="Brief note about when this template is used..."
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Sections list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Template Sections</h3>
                  <Button type="button" variant="outline" size="sm" icon={<Plus size={14} />} onClick={addSection}>Add Section</Button>
                </div>

                {form.sections.map((section, sIdx) => (
                  <div key={sIdx} className="border border-gray-100 rounded-xl bg-gray-50/50 p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Section Title (e.g. Vitals, Patient Symptoms)"
                        value={section.title}
                        onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                        className="flex-1 font-semibold"
                      />
                      {form.sections.length > 1 && (
                        <button type="button" onClick={() => removeSection(sIdx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition" title="Remove Section">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Questions in Section */}
                    <div className="space-y-3 pl-4 border-l-2 border-navy/10">
                      {section.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="bg-white border border-gray-100 rounded-lg p-3 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Question Title (e.g. Blood Pressure, Target Weight)"
                                value={q.title}
                                onChange={(e) => updateQuestion(sIdx, qIdx, { title: e.target.value })}
                              />
                              <Select
                                options={QUESTION_TYPES}
                                value={q.type}
                                onChange={(e) => updateQuestion(sIdx, qIdx, { type: e.target.value })}
                              />
                            </div>
                            <button type="button" onClick={() => removeQuestion(sIdx, qIdx)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0 transition">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {(q.type === 'select' || q.type === 'checkbox') && (
                            <Input
                              label="Comma Separated Options"
                              placeholder="e.g. Yes, No, N/A or Option 1, Option 2, Option 3"
                              value={q.options ? q.options.join(', ') : ''}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, {
                                  options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean),
                                })
                              }
                            />
                          )}
                        </div>
                      ))}

                      <button type="button" onClick={() => addQuestion(sIdx)} className="inline-flex items-center gap-1.5 text-xs text-navy hover:text-navy-dark font-medium py-1.5 px-2 hover:bg-navy-50/50 rounded-lg transition">
                        <Plus size={12} /> Add Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Print Settings panel */}
            <div className="w-80 overflow-y-auto p-6 space-y-6 shrink-0 scrollbar-thin bg-gray-50/50">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm uppercase tracking-wider">
                <Settings size={16} />
                <span>Print Settings</span>
              </div>

              <div className="space-y-4">
                <Input
                  label="Alternative Document Title"
                  placeholder="If left blank, template name is used"
                  value={form.printSettings.title}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      printSettings: { ...prev.printSettings, title: e.target.value },
                    }))
                  }
                />

                <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Print Elements</p>
                  
                  {[
                    { key: 'showLogo', label: 'Show Clinic Logo' },
                    { key: 'showPatientAddress', label: "Show Patient's Address" },
                    { key: 'showPatientDob', label: "Show Patient's DOB" },
                    { key: 'showPatientNhima', label: 'Show NHIMA Member No.' },
                    { key: 'showPatientReference', label: 'Show Patient Reference (Code)' },
                    { key: 'showPatientOccupation', label: "Show Patient's Occupation" },
                  ].map((elem) => {
                    const isChecked = (form.printSettings as any)[elem.key];
                    return (
                      <label key={elem.key} className="flex items-center justify-between py-1.5 cursor-pointer">
                        <span className="text-sm text-gray-600 font-medium">{elem.label}</span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={isChecked}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              printSettings: { ...prev.printSettings, [elem.key]: e.target.checked },
                            }))
                          }
                          aria-label={elem.label}
                        />
                        {isChecked ? (
                          <ToggleRight size={32} className="text-navy" />
                        ) : (
                          <ToggleLeft size={32} className="text-gray-300" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
