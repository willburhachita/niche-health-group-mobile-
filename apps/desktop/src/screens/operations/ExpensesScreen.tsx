import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Receipt, Plus, Archive, RefreshCw, Paperclip, Trash2, FileText, Download } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner, StatCard } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const categoryOptions = ['Supplies', 'Utilities', 'Salaries', 'Rent', 'Equipment', 'Marketing', 'Travel', 'Maintenance', 'Other'].map(v => ({ value: v, label: v }));
const methodOptions = ['Cash', 'Mobile Money', 'Bank Transfer', 'Card', 'Cheque'].map(v => ({ value: v, label: v }));

export default function ExpensesScreen() {
  const { account, hasPermission } = useAuth();
  const archiveExpense = useMutation(api.expenses.archive);
  const restoreExpense = useMutation(api.expenses.restore);
  const handleArchive = async (id: string) => {
    if (!hasPermission('archiveExpense')) { alert('Only admins can archive expenses.'); return; }
    if (!confirm('Archive this expense record? Archived records are hidden but kept for audit.')) return;
    await archiveExpense({ id: id as any, archivedBy: account?.email || 'admin' });
  };
  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure you want to restore this expense record?')) return;
    try {
      await restoreExpense({ id: id as any });
      alert('Expense record restored successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to restore expense.');
    }
  };
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Supplies');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vendor, setVendor] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [refNum, setRefNum] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  // Attachment states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selected, setSelected] = useState<any>(null);

  const activeExpenses = useQuery(api.expenses.list, category ? { category } : {});
  const archivedExpenses = useQuery(api.archive.listArchivedExpenses, {});
  const expenses = showArchived
    ? (archivedExpenses || []).filter((e: any) => !category || e.category === category)
    : activeExpenses;
  const summary = useQuery(api.expenses.summary);
  const createExpense = useMutation(api.expenses.create);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const expenseDetail = useQuery(api.expenses.get, selected ? { id: selected._id } : 'skip');

  const handleCreate = async () => {
    if (!description || !amount) return;
    setSaving(true);
    try {
      const attachments = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadUrl = await generateUploadUrl({});
          const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
          if (!res.ok) throw new Error('Upload failed');
          const { storageId } = await res.json();
          attachments.push({
            name: file.name,
            fileType: file.type,
            size: file.size,
            storageId
          });
        }
      }

      await createExpense({
        description, amount: parseFloat(amount), category: expCategory,
        date: new Date(date).getTime(),
        vendorName: vendor || undefined,
        paymentMethod: payMethod || undefined,
        referenceNumber: refNum || undefined,
        notes: notes || undefined,
        createdBy: account?.email || 'admin',
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setShowModal(false);
      setDescription(''); setAmount(''); setVendor(''); setRefNum(''); setNotes('');
      setSelectedFiles([]);
    } catch (err: any) {
      alert(err.message || 'Failed to create expense');
    } finally { setSaving(false); }
  };

  const catColor: Record<string, 'navy' | 'peach' | 'blue' | 'amber' | 'green' | 'gray'> = {
    Supplies: 'navy', Utilities: 'blue', Salaries: 'peach', Equipment: 'amber', Other: 'gray',
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Expenses" value={`K ${(summary.total || 0).toLocaleString()}`} icon={<Receipt size={18} />} color="text-red-500" />
          <StatCard label="Categories" value={Object.keys(summary.byCategory || {}).length} icon={<Receipt size={18} />} color="text-navy" />
          <StatCard label="Records" value={summary.count} icon={<Receipt size={18} />} color="text-gray-600" />
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Expenses</h3>
          <Select options={[{ value: '', label: 'All Categories' }, ...categoryOptions]} value={category} onChange={e => setCategory(e.target.value)} className="w-44" />
          
          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 ml-2">
            <button
              onClick={() => setShowArchived(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${!showArchived ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Active
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${showArchived ? 'bg-white text-navy shadow-sm font-bold' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Archived ({archivedExpenses?.length || 0})
            </button>
          </div>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>Add Expense</Button>
      </div>

      {!expenses ? <div className="flex justify-center py-10"><Spinner /></div>
        : expenses.length === 0 ? <EmptyState icon={<Receipt size={32} />} title={showArchived ? "No archived expenses" : "No expenses"} action={showArchived ? undefined : <Button onClick={() => setShowModal(true)} icon={<Plus size={15} />}>Add Expense</Button>} />
          : (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Date', 'Description', 'Category', 'Vendor', 'Method', 'Amount', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e: any) => (
                    <tr key={e._id} onClick={() => setSelected(e)} className="border-t border-gray-50 hover:bg-gray-50 transition cursor-pointer">
                      <td className="px-4 py-3 text-gray-500 text-xs">{e.date ? format(new Date(e.date), 'dd MMM yyyy') : '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{e.description}</td>
                      <td className="px-4 py-3"><Badge label={e.category} color={catColor[e.category] || 'gray'} /></td>
                      <td className="px-4 py-3 text-gray-600">{e.vendorName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{e.paymentMethod || '—'}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">K {(e.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right" onClick={evt => evt.stopPropagation()}>
                        {showArchived ? (
                          <button onClick={() => handleRestore(e._id)} title="Restore"
                            className="text-gray-400 hover:text-green-600 transition p-1 rounded">
                            <RefreshCw size={14} />
                          </button>
                        ) : (
                          hasPermission('archiveExpense') && (
                            <button onClick={() => handleArchive(e._id)} title="Archive"
                              className="text-gray-300 hover:text-red-500 transition p-1 rounded">
                              <Archive size={14} />
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Expense"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Save</Button></>}>
        <div className="space-y-4">
          <Input label="Description *" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (K) *" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" options={categoryOptions} value={expCategory} onChange={e => setExpCategory(e.target.value)} />
            <Select label="Payment Method" options={methodOptions} value={payMethod} onChange={e => setPayMethod(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vendor / Payee" value={vendor} onChange={e => setVendor(e.target.value)} />
            <Input label="Reference #" value={refNum} onChange={e => setRefNum(e.target.value)} />
          </div>
          <Textarea label="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />

          {/* File attachments */}
          <div className="space-y-2 border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            <label className="block text-sm font-medium text-gray-700">Attachments</label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                multiple
                id="expense-files"
                className="hidden"
                onChange={e => {
                  if (e.target.files) {
                    setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Paperclip size={14} />}
                onClick={() => document.getElementById('expense-files')?.click()}
              >
                Choose Files
              </Button>
              <span className="text-xs text-gray-400">Attach receipts, bills, images, etc.</span>
            </div>
            {selectedFiles.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-100 max-h-32 overflow-y-auto pr-1">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{file.name}</span>
                    <span className="text-gray-400 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="text-gray-300 hover:text-red-500 transition p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Expense Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Expense Record Info"
        width="max-w-md"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            {selected && (
              selected.isArchived ? (
                <Button
                  variant="primary"
                  icon={<RefreshCw size={14} />}
                  onClick={async () => {
                    await handleRestore(selected._id);
                    setSelected(null);
                  }}
                >
                  Restore
                </Button>
              ) : (
                hasPermission('archiveExpense') && (
                  <Button
                    variant="danger"
                    icon={<Archive size={14} />}
                    onClick={async () => {
                      await handleArchive(selected._id);
                      setSelected(null);
                    }}
                  >
                    Archive
                  </Button>
                )
              )
            )}
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
                <h3 className="text-base font-bold text-gray-900">{selected.description}</h3>
              </div>
              <Badge label={selected.category} color={catColor[selected.category] || 'gray'} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="text-base font-bold text-red-600 mt-0.5">K {(selected.amount || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {selected.date ? format(new Date(selected.date), 'dd MMM yyyy') : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Vendor / Payee:</span>
                <span className="font-semibold text-gray-800">{selected.vendorName || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Payment Method:</span>
                <span className="font-semibold text-gray-800">{selected.paymentMethod || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-400">Reference #:</span>
                <span className="font-mono font-semibold text-gray-800">{selected.referenceNumber || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Created By:</span>
                <span className="text-xs text-gray-500">{selected.createdBy || '—'}</span>
              </div>
            </div>

            {selected.notes && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Notes</p>
                <p className="text-sm text-gray-600 mt-0.5 italic">"{selected.notes}"</p>
              </div>
            )}

            {/* Attachments display */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip size={12} />
                Attachments
              </p>
              {!expenseDetail ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                  <Spinner /> Loading attachments...
                </div>
              ) : !expenseDetail.attachments || expenseDetail.attachments.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1">No attachments uploaded for this expense.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {expenseDetail.attachments.map((att: any, idx: number) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition shadow-sm text-xs group"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[280px]">
                        <FileText size={14} className="text-gray-400 group-hover:text-navy" />
                        <span className="font-medium text-gray-700 truncate">{att.name}</span>
                        <span className="text-gray-400 font-mono text-[10px]">({(att.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Download size={13} className="text-gray-400 group-hover:text-navy shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
