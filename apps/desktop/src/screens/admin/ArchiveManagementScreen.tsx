import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Archive, Search, RefreshCw, Trash2, ShieldAlert, Calendar, User, Package, CreditCard, Truck } from 'lucide-react';
import { Button, Input, Modal, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

type Tab = 'patients' | 'invoices' | 'expenses' | 'stock' | 'suppliers';

export default function ArchiveManagementScreen() {
  const { account } = useAuth();
  const isAdmin = account?.role === 'admin';

  const [activeTab, setActiveTab] = useState<Tab>('patients');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Queries
  const archivedData = useQuery(api.archive.listArchived, {});

  // Mutations
  const restorePatient = useMutation(api.patients.restore);
  const restoreInvoice = useMutation(api.invoices.restore);
  const restoreExpense = useMutation(api.expenses.restore);
  const restoreStock   = useMutation(api.stock.restore);
  const restoreSupplier = useMutation(api.suppliers.restore);

  const handleRestore = async (type: Tab, id: any) => {
    if (!confirm('Are you sure you want to restore this item back to active files?')) return;
    setProcessingId(id);
    try {
      if (type === 'patients') {
        await restorePatient({ id });
      } else if (type === 'invoices') {
        await restoreInvoice({ id, restoredBy: account?.email || 'admin' });
      } else if (type === 'expenses') {
        await restoreExpense({ id });
      } else if (type === 'stock') {
        await restoreStock({ id });
      } else if (type === 'suppliers') {
        await restoreSupplier({ id });
      }
      alert('Item restored successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to restore item.');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-6 text-center space-y-4">
        <ShieldAlert size={64} className="text-red-500 animate-pulse" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-sm text-gray-500 max-w-md">
          The Archive Management Center is restricted to administrator accounts only. Please contact system support for permissions override.
        </p>
      </div>
    );
  }

  const isLoading = !archivedData;
  const data = archivedData || { patients: [], invoices: [], expenses: [], stock: [], suppliers: [] };

  // Filter based on search query
  const getFilteredList = () => {
    const q = searchQuery.toLowerCase().trim();
    if (activeTab === 'patients') {
      return data.patients.filter((p: any) => 
        p.displayName?.toLowerCase().includes(q) || 
        p.patientCode?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      );
    }
    if (activeTab === 'invoices') {
      return data.invoices.filter((i: any) => 
        i.invoiceNumber?.toLowerCase().includes(q) || 
        i.status?.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'expenses') {
      return data.expenses.filter((e: any) => 
        e.description?.toLowerCase().includes(q) || 
        e.category?.toLowerCase().includes(q) || 
        e.vendorName?.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'stock') {
      return data.stock.filter((s: any) => 
        s.name?.toLowerCase().includes(q) || 
        s.itemCode?.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'suppliers') {
      return data.suppliers.filter((s: any) => 
        s.name?.toLowerCase().includes(q) || 
        s.email?.toLowerCase().includes(q) || 
        s.phone?.includes(q)
      );
    }
    return [];
  };

  const filteredItems = getFilteredList();

  const fmtK = (n: number) => `K${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (ts?: number) => ts ? format(new Date(ts), 'dd MMM yyyy, HH:mm') : '—';

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Archive size={22} className="text-navy" />
            Archive Management Control Center
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Reconcile, audit, and dynamically restore soft-deleted patients, stock items, suppliers, invoices, or expense records.
          </p>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
          {(['patients', 'invoices', 'expenses', 'stock', 'suppliers'] as Tab[]).map((t) => {
            const count = data[t]?.length || 0;
            return (
              <button
                key={t}
                onClick={() => { setActiveTab(t); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold capitalize transition ${
                  activeTab === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t === 'patients' && <User size={13} />}
                {t === 'invoices' && <Trash2 size={13} />}
                {t === 'expenses' && <CreditCard size={13} />}
                {t === 'stock' && <Package size={13} />}
                {t === 'suppliers' && <Truck size={13} />}
                {t.replace('_', ' ')}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === t ? 'bg-navy/10 text-navy' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
            <Search size={15} />
          </span>
          <Input 
            placeholder={`Search archived ${activeTab}...`} 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <Archive size={40} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm font-semibold text-gray-700">No Archived Items Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                {searchQuery ? `No archived ${activeTab} match your search filter "${searchQuery}".` : `There are currently no soft-deleted ${activeTab} in the clinic database.`}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50/75 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Archived Date</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Archived By</th>
                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Reason / Metadata</th>
                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition">
                    {/* Details Column */}
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {activeTab === 'patients' && (
                        <div>
                          <p className="font-bold text-gray-900">{item.displayName}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.patientCode} · {item.phone}</p>
                        </div>
                      )}
                      {activeTab === 'invoices' && (
                        <div>
                          <p className="font-bold text-navy">{item.invoiceNumber}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Amount: {fmtK(item.total)} · Status: <Badge label={item.status} color={item.status === 'paid' ? 'green' : 'amber'} /></p>
                        </div>
                      )}
                      {activeTab === 'expenses' && (
                        <div>
                          <p className="font-bold text-gray-900">{item.description}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Amount: {fmtK(item.amount)} · Category: {item.category}</p>
                        </div>
                      )}
                      {activeTab === 'stock' && (
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Code: {item.itemCode} · Price: {fmtK(item.pricePerItem)} · Level: {item.stockLevel} left</p>
                        </div>
                      )}
                      {activeTab === 'suppliers' && (
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{item.email || 'No Email'} · {item.phone || 'No Phone'}</p>
                        </div>
                      )}
                    </td>

                    {/* Date Column */}
                    <td className="px-5 py-4 text-xs text-gray-500 font-medium">
                      {fmtDate(item.archivedAt)}
                    </td>

                    {/* Archived By Column */}
                    <td className="px-5 py-4 text-xs text-gray-600 font-semibold flex items-center gap-1.5 mt-2">
                      <User size={12} className="text-gray-400" />
                      <span>{item.archivedBy || 'Unknown User'}</span>
                    </td>

                    {/* Reason Column */}
                    <td className="px-5 py-4 text-xs text-gray-500 italic max-w-xs truncate">
                      {item.archiveReason || item.notes || 'No archiving notes provided.'}
                    </td>

                    {/* Action Column */}
                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        loading={processingId === item._id}
                        icon={<RefreshCw size={12} />}
                        onClick={() => handleRestore(activeTab, item._id)}
                        className="text-navy hover:bg-navy-50 font-bold"
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
