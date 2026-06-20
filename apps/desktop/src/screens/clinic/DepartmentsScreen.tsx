import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Building2, Plus, Users, Edit2 } from 'lucide-react';
import { Button, Input, Textarea, Modal, Avatar, EmptyState, Spinner, Card, Badge } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export default function DepartmentsScreen() {
  const { account } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const departments = useQuery(api.departments.list);
  const createDept = useMutation(api.departments.create);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createDept({ name, description: description || undefined, createdBy: account?.email || 'admin' });
      setShowCreate(false); setName(''); setDescription('');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex h-full">
      {/* Department list */}
      <div className="w-72 flex flex-col border-r border-gray-100 bg-white shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Departments</h3>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>Add</Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!departments ? <div className="flex justify-center py-10"><Spinner /></div>
            : departments.length === 0 ? <EmptyState icon={<Building2 size={28} />} title="No departments" action={<Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus size={14} />}>Create</Button>} />
              : departments.map((d: any) => (
                <button key={d._id} onClick={() => setSelected(d)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selected?._id === d._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                  <div className="p-1.5 bg-navy/10 rounded-lg shrink-0"><Building2 size={14} className="text-navy" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Users size={10} />{d.memberCount || 0} members</p>
                  </div>
                </button>
              ))}
        </div>
      </div>

      {/* Department detail */}
      <div className="flex-1 overflow-y-auto bg-surface scrollbar-thin">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center"><Building2 size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select a department</p></div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                {selected.description && <p className="text-sm text-gray-500 mt-0.5">{selected.description}</p>}
                {selected.headName && <p className="text-xs text-gray-400 mt-1">Head: {selected.headName}</p>}
              </div>
              <Badge label={`${selected.memberCount || 0} members`} color="navy" />
            </div>

            {selected.members && selected.members.length > 0 ? (
              <Card className="overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</p>
                </div>
                {selected.members.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    <Avatar name={m.displayName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.displayName}</p>
                      <p className="text-xs text-gray-400">{m.staffRole}</p>
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <p className="text-sm text-gray-400">No members in this department yet</p>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Department" width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Department Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Radiology, Pharmacy" autoFocus />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
        </div>
      </Modal>
    </div>
  );
}
