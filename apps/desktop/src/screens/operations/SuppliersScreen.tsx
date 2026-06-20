import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Truck, Plus, Search, Phone, Mail, Edit2, RefreshCw } from 'lucide-react';
import { Button, Input, Textarea, Modal, Avatar, EmptyState, Spinner, Card } from '../../components/ui';
import { Archive } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SupForm { name: string; contactPerson: string; phone: string; email: string; address: string; city: string; region: string; country: string; notes: string; }
const empty: SupForm = { name: '', contactPerson: '', phone: '', email: '', address: '', city: '', region: '', country: '', notes: '' };

export default function SuppliersScreen() {
  const { account, hasPermission } = useAuth();
  const archiveSupplier = useMutation(api.suppliers.archive);
  const restoreSupplier = useMutation(api.suppliers.restore);
  const handleArchive = async (id: string, name: string) => {
    if (!hasPermission('archiveSupplier')) { alert('Only admins can archive suppliers.'); return; }
    if (!confirm(`Archive supplier "${name}"? Archived suppliers are hidden from lists but kept for audit.`)) return;
    await archiveSupplier({ id: id as any, archivedBy: account?.email || 'admin' });
    setSelected((s: any) => s?._id === id ? null : s);
  };
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<SupForm>(empty);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const allSuppliers = useQuery(api.suppliers.list);
  const searchResults = useQuery(api.suppliers.search, search ? { query: search } : 'skip');
  const archivedSuppliers = useQuery(api.archive.listArchivedSuppliers, {});
  
  const suppliers = showArchived 
    ? (archivedSuppliers || [])
    : (search ? searchResults : allSuppliers);

  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);

  const set = (k: keyof SupForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setEditing(null); setForm(empty); setShowModal(true); };
  const openEdit = (s: any) => {
    setEditing(s);
    setForm({ name: s.name || '', contactPerson: s.contactPerson || '', phone: s.phone || '', email: s.email || '', address: s.address || '', city: s.city || '', region: s.region || '', country: s.country || '', notes: s.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateSupplier({ id: editing._id, name: form.name, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, city: form.city || undefined, region: form.region || undefined, country: form.country || undefined, notes: form.notes || undefined });
      } else {
        await createSupplier({ name: form.name, contactPerson: form.contactPerson || undefined, phone: form.phone || undefined, email: form.email || undefined, address: form.address || undefined, city: form.city || undefined, region: form.region || undefined, country: form.country || undefined, notes: form.notes || undefined, createdBy: account?.email || 'admin' });
      }
      setShowModal(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="flex h-full">
      <div className="w-80 flex flex-col border-r border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Suppliers</h3>
            <Button size="sm" icon={<Plus size={14} />} onClick={openNew}>Add</Button>
          </div>
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
          {/* Active / Archived local tabs */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => { setShowArchived(false); setSelected(null); }}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${!showArchived ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Active
            </button>
            <button
              onClick={() => { setShowArchived(true); setSelected(null); }}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${showArchived ? 'bg-white text-navy shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Archived ({archivedSuppliers?.length || 0})
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!suppliers ? <div className="flex justify-center py-10"><Spinner /></div>
            : suppliers.length === 0 ? <EmptyState icon={<Truck size={28} />} title="No suppliers" action={<Button size="sm" onClick={openNew} icon={<Plus size={14} />}>Add Supplier</Button>} />
              : suppliers.map((s: any) => (
                <button key={s._id} onClick={() => setSelected(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selected?._id === s._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                  <Avatar name={s.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.contactPerson || 'No contact'}</p>
                  </div>
                </button>
              ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface scrollbar-thin">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center"><Truck size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select a supplier</p></div>
          </div>
        ) : (
          <div className="p-6 max-w-xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={selected.name} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{selected.contactPerson || 'No contact person'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {selected.isArchived ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={<RefreshCw size={14} />} 
                    onClick={async () => {
                      if (confirm(`Restore archived supplier "${selected.name}"?`)) {
                        await restoreSupplier({ id: selected._id });
                        setSelected(null);
                        alert('Supplier record restored successfully!');
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="outline" icon={<Edit2 size={14} />} onClick={() => openEdit(selected)}>Edit</Button>
                    {hasPermission('archiveSupplier') && (
                      <Button size="sm" variant="danger" icon={<Archive size={14} />} onClick={() => handleArchive(selected._id, selected.name)}>Archive</Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Phone size={14} />, label: 'Phone', value: selected.phone },
                { icon: <Mail size={14} />, label: 'Email', value: selected.email },
                { icon: null, label: 'Address', value: selected.address },
                { icon: null, label: 'City', value: selected.city },
                { icon: null, label: 'Region / Province', value: selected.region },
                { icon: null, label: 'Country', value: selected.country },
                { icon: null, label: 'Orders', value: selected.orderCount ? `${selected.orderCount} orders` : 'No orders' },
              ].filter(f => f.value).map(f => (
                <Card key={f.label} className="p-3">
                  <p className="text-xs text-gray-400">{f.label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
                </Card>
              ))}
            </div>
            {selected.notes && <Card className="p-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></Card>}
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Supplier' : 'New Supplier'}
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Company Name *" value={form.name} onChange={e => set('name', e.target.value)} />
          <Input label="Contact Person" value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Lusaka" />
            <Input label="Region / Province" value={form.region} onChange={e => set('region', e.target.value)} placeholder="e.g. Lusaka Province" />
            <Input label="Country" value={form.country} onChange={e => set('country', e.target.value)} placeholder="e.g. Zambia" />
          </div>
          <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
        </div>
      </Modal>
    </div>
  );
}
