import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Layers, Plus, Search, Trash2, X, Archive, Package } from 'lucide-react';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner, Card, cn } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export default function ServiceTypesScreen() {
  const { account, hasPermission } = useAuth();
  const isAdmin = account?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fixedPrice, setFixedPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [treatmentTemplate, setTreatmentTemplate] = useState('');
  const [selectedStockItems, setSelectedStockItems] = useState<{ stockItemId: string; quantity: number }[]>([]);
  const [stockSearch, setStockSearch] = useState('');

  const serviceTypes = useQuery(api.serviceTypes.list);
  const stockItems = useQuery(api.stock.list, {});
  const createService = useMutation(api.serviceTypes.create);
  const updateService = useMutation(api.serviceTypes.update);
  const archiveService = useMutation(api.serviceTypes.archive);

  const activeStock = (stockItems || []).filter((s: any) => !s.isArchived && s.status !== 'discontinued');
  const filteredActiveStock = activeStock.filter((s: any) =>
    s.name.toLowerCase().includes(stockSearch.toLowerCase())
  );

  const filtered = (serviceTypes || []).filter((s: any) =>
    !s.isArchived && (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => {
    setName(''); setDescription(''); setFixedPrice(''); setDuration('');
    setTreatmentTemplate(''); setSelectedStockItems([]); setEditing(null);
    setStockSearch('');
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (svc: any) => {
    setEditing(svc);
    setName(svc.name);
    setDescription(svc.description || '');
    setFixedPrice(String(svc.fixedPrice));
    setDuration(svc.duration ? String(svc.duration) : '');
    setTreatmentTemplate(svc.treatmentTemplate || '');
    setSelectedStockItems(svc.stockItems?.map((si: any) => ({
      stockItemId: si.stockItemId,
      quantity: si.quantity,
    })) || []);
    setShowModal(true);
  };

  const removeStockItem = (id: string) => {
    setSelectedStockItems(prev => prev.filter(si => si.stockItemId !== id));
  };

  const handleSave = async () => {
    if (!name.trim() || !fixedPrice) return;
    setSaving(true);
    try {
      const stockPayload = selectedStockItems.map(si => ({
        stockItemId: si.stockItemId as any,
        quantity: si.quantity,
      }));
      if (editing) {
        await updateService({
          id: editing._id,
          name: name.trim(),
          description: description || undefined,
          fixedPrice: Number(fixedPrice),
          duration: duration ? Number(duration) : undefined,
          stockItems: stockPayload,
          treatmentTemplate: treatmentTemplate || undefined,
          updatedBy: account?.email || 'admin',
        });
      } else {
        await createService({
          name: name.trim(),
          description: description || undefined,
          fixedPrice: Number(fixedPrice),
          duration: duration ? Number(duration) : undefined,
          stockItems: stockPayload,
          treatmentTemplate: treatmentTemplate || undefined,
          createdBy: account?.email || 'admin',
        });
      }
      setShowModal(false);
      resetForm();
    } finally { setSaving(false); }
  };

  const handleArchive = async (svc: any) => {
    if (!confirm(`Archive "${svc.name}"? It will no longer be available for new appointments.`)) return;
    await archiveService({ id: svc._id, archivedBy: account?.email || 'admin' });
  };

  // Calculate stock cost for a service type
  const stockCost = (svc: any) => {
    if (!svc.stockItems?.length || !stockItems) return 0;
    return svc.stockItems.reduce((sum: number, si: any) => {
      const item = stockItems.find((s: any) => s._id === si.stockItemId);
      return sum + (item ? item.costPrice * si.quantity : 0);
    }, 0);
  };

  const stockName = (id: string) => {
    const item = (stockItems || []).find((s: any) => s._id === id);
    return item?.name || 'Unknown';
  };

  const templateOptions = [
    { value: '', label: 'None' },
    { value: 'General Consultation', label: 'General Consultation' },
    { value: 'Dialysis Session', label: 'Dialysis Session' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Custom', label: 'Custom' },
  ];

  return (
    <div className="p-6 space-y-4 max-w-5xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Service Types</h2>
          {serviceTypes && <span className="text-sm text-gray-400">{filtered.length} active</span>}
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} className="w-56" />
          {isAdmin && <Button icon={<Plus size={15} />} onClick={openCreate}>Add Service Type</Button>}
        </div>
      </div>

      {!serviceTypes ? <div className="flex justify-center py-10"><Spinner /></div>
        : filtered.length === 0 ? <EmptyState icon={<Layers size={32} />} title="No service types" description="Add service types to pre-populate appointments and invoices." />
          : (
            <div className="grid gap-3">
              {filtered.map((svc: any) => {
                const cost = stockCost(svc);
                const profit = svc.fixedPrice - cost;
                return (
                  <div key={svc._id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                          <Badge label={svc.isActive ? 'Active' : 'Inactive'} color={svc.isActive ? 'navy' : 'gray'} />
                          {svc.duration && <span className="text-xs text-gray-400">{svc.duration} min</span>}
                        </div>
                        {svc.description && <p className="text-sm text-gray-500 mb-2">{svc.description}</p>}

                        <div className="flex items-center gap-6 text-sm">
                          <div>
                            <span className="text-xs text-gray-400">Service Price</span>
                            <p className="font-semibold text-gray-900">K{svc.fixedPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Stock Cost</span>
                            <p className="font-medium text-gray-600">K{cost.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Profit/Loss</span>
                            <p className={`font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {profit >= 0 ? '+' : ''}K{profit.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {svc.stockItems?.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 flex-wrap">
                            <Package size={12} className="text-gray-400" />
                            {svc.stockItems.map((si: any) => (
                              <span key={si.stockItemId} className="text-xs bg-gray-50 border border-gray-100 rounded px-1.5 py-0.5">
                                {stockName(si.stockItemId)} ×{si.quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openEdit(svc)}>Edit</Button>
                            <Button size="sm" variant="danger" icon={<Archive size={13} />} onClick={() => handleArchive(svc)}>Archive</Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editing ? 'Edit Service Type' : 'Create Service Type'} width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button><Button loading={saving} onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button></>}>
        <div className="space-y-4">
          <Input label="Service Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. General Consultation" autoFocus />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the service" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fixed Price (K) *" type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} placeholder="0" />
            <Input label="Default Duration (min)" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="30" />
          </div>
          <Select label="Treatment Note Template" options={templateOptions} value={treatmentTemplate} onChange={e => setTreatmentTemplate(e.target.value)} />

          {/* Stock Items Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Stock Items Used</label>
            <p className="text-xs text-gray-400">Select items consumed when performing this service. Their cost is calculated separately to show profit/loss.</p>

            {selectedStockItems.length > 0 && (
              <div className="space-y-1 bg-gray-50 border border-gray-100 rounded-lg p-2 max-h-48 overflow-y-auto scrollbar-thin">
                <span className="text-xs font-semibold text-gray-500 block mb-1">Selected Stock Items</span>
                {selectedStockItems.map(si => (
                  <div key={si.stockItemId} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-1.5 shadow-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Package size={13} className="text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-800 truncate">{stockName(si.stockItemId)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">Qty:</span>
                        <input
                          type="number"
                          value={si.quantity}
                          min={1}
                          onChange={e => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            setSelectedStockItems(prev => prev.map(item => item.stockItemId === si.stockItemId ? { ...item, quantity: val } : item));
                          }}
                          className="w-14 text-center border border-gray-200 rounded-md py-0.5 px-1 text-sm focus:ring-1 focus:ring-navy focus:border-navy"
                        />
                      </div>
                      <button type="button" onClick={() => removeStockItem(si.stockItemId)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-gray-50 transition">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search and select multiple stock items..."
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  className="w-full bg-transparent border-none p-0 text-sm focus:outline-none focus:ring-0 placeholder-gray-400 text-gray-900"
                />
              </div>
              <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5 scrollbar-thin">
                {filteredActiveStock.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No matching stock items</p>
                ) : (
                  filteredActiveStock.map((s: any) => {
                    const isSelected = selectedStockItems.some(si => si.stockItemId === s._id);
                    return (
                      <label
                        key={s._id}
                        className={cn(
                          "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm cursor-pointer transition-colors select-none",
                          isSelected ? "bg-navy-50/50 text-navy font-medium" : "hover:bg-gray-50 text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setSelectedStockItems(prev => prev.filter(si => si.stockItemId !== s._id));
                              } else {
                                setSelectedStockItems(prev => [...prev, { stockItemId: s._id, quantity: 1 }]);
                              }
                            }}
                            className="rounded border-gray-300 text-navy focus:ring-navy h-4 w-4"
                          />
                          <span>{s.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          K{s.costPrice} • {s.stockLevel} in stock
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
