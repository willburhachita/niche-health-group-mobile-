import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Settings2, Plus, Trash2, DollarSign, CreditCard, Tag, Bell } from 'lucide-react';
import { Button, Input, Select, Modal, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

type Tab = 'billable' | 'taxes' | 'payment_types' | 'recall_types';

export default function ConfigurationScreen() {
  const { account } = useAuth();
  const isAdmin = account?.role === 'admin';
  const [tab, setTab] = useState<Tab>('billable');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Billable Items
  const billableItems = useQuery(api.billableItems.list);
  const createBillable = useMutation(api.billableItems.create);
  const removeBillable = useMutation(api.billableItems.remove);
  const [biName, setBiName] = useState('');
  const [biPrice, setBiPrice] = useState('');
  const [biTaxable, setBiTaxable] = useState(true);
  const [biCategory, setBiCategory] = useState('other');

  // Tax Configs
  const taxConfigs = useQuery(api.taxConfigs.list);
  const createTax = useMutation(api.taxConfigs.create);
  const removeTax = useMutation(api.taxConfigs.remove);
  const [txName, setTxName] = useState('');
  const [txRate, setTxRate] = useState('');
  const [txDefault, setTxDefault] = useState(false);

  // Payment Types
  const paymentTypes = useQuery(api.paymentTypes.list);
  const createPt = useMutation(api.paymentTypes.create);
  const removePt = useMutation(api.paymentTypes.remove);
  const [ptName, setPtName] = useState('');
  const [ptRef, setPtRef] = useState(false);

  // Recall Types
  const recallTypes = useQuery(api.recallTypes.list);
  const createRecall = useMutation(api.recallTypes.create);
  const removeRecall = useMutation(api.recallTypes.remove);
  const [rtName, setRtName] = useState('');
  const [rtDays, setRtDays] = useState('');

  const resetForm = () => {
    setBiName(''); setBiPrice(''); setBiTaxable(true); setBiCategory('other');
    setTxName(''); setTxRate(''); setTxDefault(false);
    setPtName(''); setPtRef(false);
    setRtName(''); setRtDays('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const by = account?.email || 'admin';
      if (tab === 'billable' && biName && biPrice) {
        await createBillable({ name: biName, unitPrice: Number(biPrice), taxable: biTaxable, category: biCategory, createdBy: by });
      } else if (tab === 'taxes' && txName && txRate) {
        await createTax({ name: txName, rate: Number(txRate), isDefault: txDefault, createdBy: by });
      } else if (tab === 'payment_types' && ptName) {
        await createPt({ name: ptName, requiresReference: ptRef, createdBy: by });
      } else if (tab === 'recall_types' && rtName && rtDays) {
        await createRecall({ name: rtName, defaultDays: Number(rtDays), createdBy: by });
      }
      setShowModal(false);
      resetForm();
    } finally { setSaving(false); }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'billable', label: 'Billable Items', icon: <Tag size={14} /> },
    { key: 'taxes', label: 'Tax Rates', icon: <DollarSign size={14} /> },
    { key: 'payment_types', label: 'Payment Types', icon: <CreditCard size={14} /> },
    { key: 'recall_types', label: 'Recall Types', icon: <Bell size={14} /> },
  ];

  const categoryOptions = [
    { value: 'lab_test', label: 'Lab Test' },
    { value: 'procedure', label: 'Procedure' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">Clinic Configuration</h2>
        {isAdmin && <Button icon={<Plus size={15} />} onClick={() => { resetForm(); setShowModal(true); }} size="sm">Add {tabs.find(t => t.key === tab)?.label?.slice(0, -1)}</Button>}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Billable Items */}
      {tab === 'billable' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!billableItems ? <div className="p-6 flex justify-center"><Spinner /></div>
            : billableItems.filter((b: any) => b.isActive).length === 0 ? <div className="p-6"><EmptyState icon={<Tag size={28} />} title="No billable items" /></div>
              : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Name', 'Unit Price', 'Taxable', 'Category', ''].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {billableItems.filter((b: any) => b.isActive).map((b: any) => (
                      <tr key={b._id} className="border-t border-gray-50">
                        <td className="px-4 py-2.5 font-medium">{b.name}</td>
                        <td className="px-4 py-2.5">K{b.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-2.5"><Badge label={b.taxable ? 'Yes' : 'No'} color={b.taxable ? 'navy' : 'gray'} /></td>
                        <td className="px-4 py-2.5 text-gray-500">{b.category || '-'}</td>
                        <td className="px-4 py-2.5">{isAdmin && <button onClick={() => removeBillable({ id: b._id })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      )}

      {/* Tax Configs */}
      {tab === 'taxes' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!taxConfigs ? <div className="p-6 flex justify-center"><Spinner /></div>
            : taxConfigs.filter((t: any) => t.isActive).length === 0 ? <div className="p-6"><EmptyState icon={<DollarSign size={28} />} title="No tax rates configured" /></div>
              : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Name', 'Rate', 'Default', ''].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {taxConfigs.filter((t: any) => t.isActive).map((t: any) => (
                      <tr key={t._id} className="border-t border-gray-50">
                        <td className="px-4 py-2.5 font-medium">{t.name}</td>
                        <td className="px-4 py-2.5">{(t.rate * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5">{t.isDefault && <Badge label="Default" color="navy" />}</td>
                        <td className="px-4 py-2.5">{isAdmin && <button onClick={() => removeTax({ id: t._id })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      )}

      {/* Payment Types */}
      {tab === 'payment_types' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!paymentTypes ? <div className="p-6 flex justify-center"><Spinner /></div>
            : paymentTypes.filter((p: any) => p.isActive).length === 0 ? <div className="p-6"><EmptyState icon={<CreditCard size={28} />} title="No payment types" /></div>
              : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Name', 'Requires Reference', ''].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {paymentTypes.filter((p: any) => p.isActive).map((p: any) => (
                      <tr key={p._id} className="border-t border-gray-50">
                        <td className="px-4 py-2.5 font-medium">{p.name}</td>
                        <td className="px-4 py-2.5"><Badge label={p.requiresReference ? 'Yes' : 'No'} color={p.requiresReference ? 'peach' : 'gray'} /></td>
                        <td className="px-4 py-2.5">{isAdmin && <button onClick={() => removePt({ id: p._id })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      )}

      {/* Recall Types */}
      {tab === 'recall_types' && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!recallTypes ? <div className="p-6 flex justify-center"><Spinner /></div>
            : recallTypes.filter((r: any) => r.isActive).length === 0 ? <div className="p-6"><EmptyState icon={<Bell size={28} />} title="No recall types" /></div>
              : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Name', 'Default Days', ''].map(h => <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {recallTypes.filter((r: any) => r.isActive).map((r: any) => (
                      <tr key={r._id} className="border-t border-gray-50">
                        <td className="px-4 py-2.5 font-medium">{r.name}</td>
                        <td className="px-4 py-2.5">{r.defaultDays} days</td>
                        <td className="px-4 py-2.5">{isAdmin && <button onClick={() => removeRecall({ id: r._id })} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={`Add ${tabs.find(t => t.key === tab)?.label?.slice(0, -1) || 'Item'}`} width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save</Button></>}>
        <div className="space-y-4">
          {tab === 'billable' && <>
            <Input label="Name *" value={biName} onChange={e => setBiName(e.target.value)} placeholder="e.g. Blood Test - CBC" autoFocus />
            <Input label="Unit Price (K) *" type="number" value={biPrice} onChange={e => setBiPrice(e.target.value)} />
            <Select label="Category" options={categoryOptions} value={biCategory} onChange={e => setBiCategory(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={biTaxable} onChange={e => setBiTaxable(e.target.checked)} className="rounded" />
              Taxable
            </label>
          </>}

          {tab === 'taxes' && <>
            <Input label="Name *" value={txName} onChange={e => setTxName(e.target.value)} placeholder="e.g. VAT 16%" autoFocus />
            <Input label="Rate (decimal) *" type="number" value={txRate} onChange={e => setTxRate(e.target.value)} placeholder="0.16" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={txDefault} onChange={e => setTxDefault(e.target.checked)} className="rounded" />
              Set as default tax rate
            </label>
          </>}

          {tab === 'payment_types' && <>
            <Input label="Name *" value={ptName} onChange={e => setPtName(e.target.value)} placeholder="e.g. Mobile Money" autoFocus />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={ptRef} onChange={e => setPtRef(e.target.checked)} className="rounded" />
              Requires reference number
            </label>
          </>}

          {tab === 'recall_types' && <>
            <Input label="Name *" value={rtName} onChange={e => setRtName(e.target.value)} placeholder="e.g. 6-Month Check-up" autoFocus />
            <Input label="Default Days *" type="number" value={rtDays} onChange={e => setRtDays(e.target.value)} placeholder="180" />
          </>}
        </div>
      </Modal>
    </div>
  );
}
