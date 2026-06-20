import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Package, Plus, Search, AlertTriangle, TrendingDown, Archive, MessageSquare, Send, RefreshCw, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner, Card, StatCard } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const categoryOptions = ['Medication', 'Equipment', 'Consumable', 'Lab Reagent', 'PPE', 'Other'].map(v => ({ value: v, label: v }));

interface StockForm {
  itemCode: string; name: string; category: string; pricePerItem: string; costPrice: string;
  stockLevel: string; reorderLevel: string; expiryDate: string; notes: string;
  serialNumber: string; supplierId: string;
}
const emptyForm: StockForm = { itemCode: '', name: '', category: 'Medication', pricePerItem: '', costPrice: '', stockLevel: '', reorderLevel: '', expiryDate: '', notes: '', serialNumber: '', supplierId: '' };

export default function StockScreen() {
  const { account, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('increase');
  const [adjReason, setAdjReason] = useState('restock');
  const [adjNotes, setAdjNotes] = useState('');
  const [adjExpiryDate, setAdjExpiryDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const allStock = useQuery(api.stock.list, {});
  const searchResults = useQuery(api.stock.search, search ? { query: search } : 'skip');
  const archivedStock = useQuery(api.archive.listArchivedStock, {});
  const adjustmentHistory = useQuery(
    api.stock.listAdjustments,
    selected ? { stockItemId: selected._id } : 'skip'
  );
  
  const stock = showArchived 
    ? (archivedStock || [])
    : (search ? searchResults : allStock);

  const alerts = useQuery(api.stock.alerts, {});
  const suppliers = useQuery(api.suppliers.list, {});
  const createItem = useMutation(api.stock.create);
  const adjustStock = useMutation(api.stock.adjust);
  const archiveStock = useMutation(api.stock.archive);
  const restoreStock = useMutation(api.stock.restore);
  const addNote = useMutation(api.stock.addNote);
  const stockItems = allStock;

  const set = (k: keyof StockForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const getStatusColor = (item: any): 'red' | 'amber' | 'green' => {
    if (item.stockLevel <= 0) return 'red';
    if (item.stockLevel <= item.reorderLevel) return 'amber';
    return 'green';
  };

  const handleCreate = async () => {
    if (!form.name || !form.itemCode) return;
    setSaving(true);
    try {
      await createItem({
        itemCode: form.itemCode, name: form.name,
        pricePerItem: parseFloat(form.pricePerItem) || 0,
        costPrice: parseFloat(form.costPrice) || 0,
        includesTax: false, taxType: 'none', taxRate: 0,
        stockLevel: parseInt(form.stockLevel) || 0,
        reorderLevel: parseInt(form.reorderLevel) || 5,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).getTime() : undefined,
        notes: form.notes ? `[${form.category || 'General'}] ${form.notes}` : (form.category ? `[${form.category}]` : undefined),
        serialNumber: form.serialNumber || undefined,
        supplierId: form.supplierId ? (form.supplierId as any) : undefined,
        createdBy: account?.email || 'admin',
      });
      setShowCreate(false); setForm(emptyForm);
    } finally { setSaving(false); }
  };

  const handleAdjust = async () => {
    if (!adjQty || !selected) return;
    setSaving(true);
    try {
      await adjustStock({
        stockItemId: selected._id,
        adjustmentType: adjType as any,
        quantity: parseInt(adjQty),
        reason: adjReason,
        notes: adjNotes || undefined,
        adjustedBy: account?.email || 'admin',
        newExpiryDate: (adjType === 'increase' && adjExpiryDate)
          ? new Date(adjExpiryDate).getTime()
          : undefined,
      });
      setShowAdjust(false);
      setAdjQty(''); setAdjNotes(''); setAdjExpiryDate('');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-80 flex flex-col border-r border-gray-100 bg-white">
        <div className="p-4 border-b border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Stock Items</h3>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowCreate(true)}>Add Item</Button>
          </div>
          <Input placeholder="Search stock..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
          {/* Active / Archived tabs toggle */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button
              onClick={() => { setShowArchived(false); setSelected(null); }}
              className={`flex-1 text-center py-1 rounded-lg text-[11px] font-semibold transition ${!showArchived ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Active List
            </button>
            <button
              onClick={() => { setShowArchived(true); setSelected(null); }}
              className={`flex-1 text-center py-1 rounded-lg text-[11px] font-semibold transition ${showArchived ? 'bg-white text-navy shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Archived ({archivedStock?.length || 0})
            </button>
          </div>
        </div>

        {/* Alerts strip */}
        {alerts && (alerts.lowStockCount > 0 || alerts.expiredCount > 0) && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-700">
            <AlertTriangle size={13} />
            {alerts.lowStockCount > 0 && <span>{alerts.lowStockCount} low stock</span>}
            {alerts.expiredCount > 0 && <span>{alerts.expiredCount} expired</span>}
          </div>
        )}

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!stock ? <div className="flex justify-center py-10"><Spinner /></div>
            : stock.length === 0 ? <EmptyState icon={<Package size={28} />} title="No stock items" action={<Button size="sm" onClick={() => setShowCreate(true)} icon={<Plus size={14} />}>Add Item</Button>} />
              : stock.map((item: any) => (
                <button key={item._id} onClick={() => setSelected(item)}
                  className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition text-left ${selected?._id === item._id ? 'bg-navy-50 border-l-2 border-l-navy' : ''}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(item) === 'red' ? 'bg-red-500' : getStatusColor(item) === 'amber' ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.itemCode} · {item.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{item.stockLevel}</p>
                  </div>
                </button>
              ))}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto bg-surface scrollbar-thin">
        {!selected ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center"><Package size={40} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Select a stock item</p></div>
          </div>
        ) : (
          <div className="p-6 max-w-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                <p className="text-sm text-gray-500">{selected.itemCode} · {selected.category}</p>
              </div>
              <div className="flex gap-2">
                {selected.isArchived ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    icon={<RefreshCw size={14} />} 
                    onClick={async () => {
                      if (confirm(`Restore archived stock item "${selected.name}"?`)) {
                        await restoreStock({ id: selected._id });
                        setSelected(null);
                        alert('Stock item restored successfully!');
                      }
                    }}
                  >
                    Restore
                  </Button>
                ) : (
                  <>
                    <Button size="sm" variant="secondary" icon={<TrendingDown size={14} />} onClick={() => setShowAdjust(true)}>Adjust Stock</Button>
                    {hasPermission('archiveStock') && (
                      <Button size="sm" variant="danger" icon={<Archive size={14} />}
                        onClick={async () => {
                          if (!confirm(`Archive stock item "${selected.name}"? It will be hidden from lists but kept for audit.`)) return;
                          await archiveStock({ id: selected._id, archivedBy: account?.email || 'admin' });
                          setSelected(null);
                        }}>Archive</Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Current Level" value={`${selected.stockLevel}`} icon={<Package size={16} />} color={selected.stockLevel <= selected.reorderLevel ? 'text-red-500' : 'text-green-600'} />
              <StatCard label="Reorder Level" value={`${selected.reorderLevel}`} icon={<AlertTriangle size={16} />} color="text-amber-600" />
              <StatCard label="Unit Price" value={`K ${(selected.pricePerItem || 0).toLocaleString()}`} icon={<Package size={16} />} color="text-navy" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(() => {
                const supplierName = selected.supplierId && suppliers
                  ? suppliers.find((s: any) => s._id === selected.supplierId)?.name || 'Unknown Supplier'
                  : 'N/A';
                return [
                  { label: 'Cost Price', value: `K ${(selected.costPrice || 0).toLocaleString()}` },
                  { label: 'Expiry Date', value: selected.expiryDate ? format(new Date(selected.expiryDate), 'dd MMM yyyy') : 'N/A' },
                  { label: 'Serial Number', value: selected.serialNumber || 'N/A' },
                  { label: 'Supplier', value: supplierName },
                ].map(f => (
                  <Card key={f.label} className="p-3">
                    <p className="text-xs text-gray-400">{f.label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</p>
                  </Card>
                ));
              })()}
            </div>
            {selected.notes && <Card className="p-4"><p className="text-xs text-gray-400 mb-1">Notes</p><p className="text-sm text-gray-700">{selected.notes}</p></Card>}

            {/* Adjustment History */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingDown size={14} className="text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-700">Adjustment History</h3>
                </div>
                {adjustmentHistory && adjustmentHistory.length > 0 && (
                  <span className="text-xs text-gray-400">{adjustmentHistory.length} record{adjustmentHistory.length !== 1 ? 's' : ''}</span>
                )}
              </div>

              {!adjustmentHistory ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : adjustmentHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No adjustments recorded yet</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                  {adjustmentHistory.map((adj: any) => {
                    const isIncrease = adj.adjustmentType === 'increase';
                    const source = adj.source || 'manual';
                    const sourceBadgeMap: Record<string, { label: string; color: string }> = {
                      manual:  { label: 'Manual',  color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                      invoice: { label: 'Invoice',  color: 'bg-amber-50 text-amber-700 border-amber-100' },
                      void:    { label: 'Voided',   color: 'bg-rose-50 text-rose-600 border-rose-100' },
                    };
                    const badge = sourceBadgeMap[source] ?? sourceBadgeMap.manual;
                    return (
                      <div key={adj._id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition group">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          isIncrease ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {isIncrease
                            ? <ArrowUp size={13} className="text-green-600" />
                            : <ArrowDown size={13} className="text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">
                              {isIncrease ? '+' : '-'}{adj.quantity}
                            </span>
                            <span className="text-xs text-gray-400">
                              {adj.previousLevel} → {adj.newLevel}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 capitalize">
                            {adj.reason.replace(/_/g, ' ')}
                          </p>
                          {(adj.invoiceNumber || adj.notes) && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {adj.invoiceNumber && (
                                <span className="inline-flex items-center gap-0.5">
                                  <FileText size={10} />
                                  {adj.invoiceNumber}
                                  {adj.notes ? ' · ' : ''}
                                </span>
                              )}
                              {adj.notes && !adj.invoiceNumber && adj.notes}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {adj.adjustedBy} · {format(new Date(adj.adjustedAt), 'dd MMM yyyy HH:mm')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Timestamped Notes */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-700">Notes & Activity</h3>
              </div>
              {selected.stockNotes?.length > 0 ? (
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                  {[...selected.stockNotes].reverse().map((note: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-700">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{note.author} &middot; {format(new Date(note.timestamp), 'dd MMM yyyy HH:mm')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3">No notes yet.</p>
              )}
              <div className="flex gap-2">
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy" onKeyDown={async e => {
                  if (e.key === 'Enter' && newNote.trim()) {
                    await addNote({ id: selected._id, text: newNote.trim(), author: account?.email || 'admin' });
                    setNewNote('');
                    // Refresh selected
                    const updated = await stockItems?.find((s: any) => s._id === selected._id);
                    if (updated) setSelected(updated);
                  }
                }} />
                <Button size="sm" icon={<Send size={13} />} disabled={!newNote.trim()} onClick={async () => {
                  if (!newNote.trim()) return;
                  await addNote({ id: selected._id, text: newNote.trim(), author: account?.email || 'admin' });
                  setNewNote('');
                }}>Send</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Stock Item" width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Add Item</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Item Code *" value={form.itemCode} onChange={e => set('itemCode', e.target.value)} placeholder="e.g. MED-001" />
          <div className="col-span-1"><Select label="Category" options={categoryOptions} value={form.category} onChange={e => set('category', e.target.value)} /></div>
          <div className="col-span-2"><Input label="Name *" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <Input label="Unit Price (K)" type="number" value={form.pricePerItem} onChange={e => set('pricePerItem', e.target.value)} />
          <Input label="Cost Price (K)" type="number" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} />
          <Input label="Current Stock" type="number" value={form.stockLevel} onChange={e => set('stockLevel', e.target.value)} />
          <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={e => set('reorderLevel', e.target.value)} />
          <Input label="Expiry Date" type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
          <Input label="Serial Number" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} placeholder="e.g. SN-12345" />
          <Select 
            label="Supplier" 
            options={(suppliers || []).map((s: any) => ({ value: s._id, label: s.name }))} 
            placeholder="Select supplier (optional)..." 
            value={form.supplierId} 
            onChange={e => set('supplierId', e.target.value)} 
          />
          <div className="col-span-2"><Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} /></div>
        </div>
      </Modal>

      {/* Adjust Modal */}
      <Modal open={showAdjust} onClose={() => { setShowAdjust(false); setAdjExpiryDate(''); }} title={`Adjust Stock — ${selected?.name}`} width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => { setShowAdjust(false); setAdjExpiryDate(''); }}>Cancel</Button><Button loading={saving} onClick={handleAdjust}>Adjust</Button></>}>
        <div className="space-y-4">
          {selected && (
            <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
              Current stock: <span className="font-semibold text-gray-800">{selected.stockLevel}</span>
              {selected.expiryDate && <> · Expiry: <span className="font-semibold text-gray-800">{format(new Date(selected.expiryDate), 'dd MMM yyyy')}</span></>}
            </div>
          )}
          <Select label="Type" options={[{ value: 'increase', label: 'Add Stock' }, { value: 'decrease', label: 'Remove Stock' }]} value={adjType}
            onChange={e => { setAdjType(e.target.value); setAdjExpiryDate(''); }} />
          <Input label="Quantity" type="number" value={adjQty} onChange={e => setAdjQty(e.target.value)} placeholder="0" />
          {adjType === 'increase' && (
            <div>
              <Input label="New Batch Expiry Date (optional)" type="date" value={adjExpiryDate} onChange={e => setAdjExpiryDate(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Leave blank to keep the current expiry date. Set this if the new batch has a different expiry.</p>
            </div>
          )}
          <Select label="Reason"
            options={(adjType === 'increase'
              ? ['restock', 'returned', 'correction', 'other']
              : ['used', 'expired', 'damaged', 'disposed', 'correction', 'other']
            ).map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))}
            value={adjReason} onChange={e => setAdjReason(e.target.value)} />
          <Textarea label="Notes" value={adjNotes} onChange={e => setAdjNotes(e.target.value)} rows={2} />
        </div>
      </Modal>
    </div>
  );
}
