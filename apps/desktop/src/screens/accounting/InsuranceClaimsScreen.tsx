import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { FileText, ShieldAlert, CheckCircle2, XCircle, Search, Info, PlusCircle, AlertCircle, Calendar, ArrowRight, User } from 'lucide-react';
import { Button, Input, Select, Badge, Avatar, EmptyState, Spinner, Card, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

type ClaimFilter = 'all' | 'pending' | 'submitted' | 'approved' | 'rejected';

export default function InsuranceClaimsScreen() {
  const { account } = useAuth();
  const [filter, setFilter] = useState<ClaimFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Modal actions
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [claimNumber, setClaimNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewingClaim, setReviewingClaim] = useState(false);

  // Convex queries
  const invoices = useQuery(api.invoices.list, {});
  const patients = useQuery(api.patients.list, {});

  // Convex mutations
  const submitClaim = useMutation(api.invoices.submitNhimaClaim);
  const updateClaimStatus = useMutation(api.invoices.updateNhimaClaimStatus);

  const formatK = (n: number) => `K${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Filter invoices that are insurance/NHIMA invoices (i.e. patients having NHIMA Member No or Insurance Provider)
  const insuranceInvoices = useMemo(() => {
    if (!invoices || !patients) return [];

    return invoices.map((inv: any) => {
      const patient = patients.find((p: any) => p._id === inv.patientId);
      return {
        ...inv,
        patient,
      };
    }).filter((inv: any) => {
      // Must be either explicitly a NHIMA patient or have insurance configured
      return inv.patient?.nhimaMemberNo || inv.patient?.insuranceProvider;
    });
  }, [invoices, patients]);

  // Apply search & status filter
  const filteredInvoices = useMemo(() => {
    return insuranceInvoices.filter((inv: any) => {
      // Status filter
      if (filter === 'pending' && inv.nhimaStatus) return false;
      if (filter === 'submitted' && inv.nhimaStatus !== 'submitted') return false;
      if (filter === 'approved' && inv.nhimaStatus !== 'approved') return false;
      if (filter === 'rejected' && inv.nhimaStatus !== 'rejected') return false;

      // Search filter
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(term) ||
        (inv.patient?.displayName || '').toLowerCase().includes(term) ||
        (inv.patient?.nhimaMemberNo || '').toLowerCase().includes(term) ||
        (inv.nhimaClaimNumber || '').toLowerCase().includes(term)
      );
    });
  }, [insuranceInvoices, filter, search]);

  const stats = useMemo(() => {
    const list = insuranceInvoices;
    return {
      total: list.length,
      pending: list.filter((i: any) => !i.nhimaStatus).length,
      submitted: list.filter((i: any) => i.nhimaStatus === 'submitted').length,
      approved: list.filter((i: any) => i.nhimaStatus === 'approved').length,
      rejected: list.filter((i: any) => i.nhimaStatus === 'rejected').length,
    };
  }, [insuranceInvoices]);

  const handleOpenSubmit = () => {
    setClaimNumber(`CLM-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setShowSubmitModal(true);
  };

  const handleSubmitClaim = async () => {
    if (!claimNumber.trim()) {
      alert('Please enter a NHIMA Claim Reference Number');
      return;
    }
    setSubmittingClaim(true);
    try {
      await submitClaim({
        id: selectedInvoice._id,
        claimNumber: claimNumber.trim(),
        adminEmail: account?.email || 'admin',
      });
      setShowSubmitModal(false);
      setSelectedInvoice(null);
      alert('Claim submitted to NHIMA successfully!');
    } catch (e) {
      alert('Error submitting claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleOpenReview = () => {
    setReviewStatus('approved');
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const handleReviewClaim = async () => {
    setReviewingClaim(true);
    try {
      await updateClaimStatus({
        id: selectedInvoice._id,
        status: reviewStatus,
        adminEmail: account?.email || 'admin',
        notes: reviewNotes.trim() || undefined,
      });
      setShowReviewModal(false);
      setSelectedInvoice(null);
      alert(`Claim review successfully marked as ${reviewStatus}!`);
    } catch (e) {
      alert('Error reviewing claim');
    } finally {
      setReviewingClaim(false);
    }
  };

  const getNhimaStatusBadge = (st: string | undefined) => {
    if (!st) return <Badge label="Pending Submission" color="gray" />;
    if (st === 'submitted') return <Badge label="Submitted" color="blue" />;
    if (st === 'approved') return <Badge label="Approved" color="green" />;
    return <Badge label="Rejected" color="red" />;
  };

  const getVisualProgressClass = (step: number, currentStatus: string | undefined) => {
    const activeClass = 'bg-navy border-navy text-white font-bold';
    const inactiveClass = 'bg-gray-100 border-gray-200 text-gray-400';

    if (step === 1) return activeClass;
    if (step === 2) return currentStatus ? activeClass : inactiveClass;
    if (step === 3) return (currentStatus === 'approved' || currentStatus === 'rejected') ? activeClass : inactiveClass;
    return inactiveClass;
  };

  return (
    <div className="flex h-full">
      {/* ── Left main lists split ── */}
      <div className={`${selectedInvoice ? 'w-[420px] border-r border-gray-100' : 'flex-1 max-w-5xl'} flex flex-col p-6 space-y-4 overflow-y-auto`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-900">NHIMA & Insurance Claims</h2>
            <p className="text-xs text-gray-400">Process and track NHIMA medical invoice claims</p>
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} className="w-48" />
          </div>
        </div>

        {/* Mini stats cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <Card className="p-3 text-center bg-white border-gray-50 cursor-pointer" onClick={() => setFilter('all')}>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Total</p>
            <p className="text-lg font-bold text-navy mt-0.5">{stats.total}</p>
          </Card>
          <Card className="p-3 text-center bg-white border-gray-50 cursor-pointer" onClick={() => setFilter('pending')}>
            <p className="text-[10px] text-amber-500 font-semibold uppercase">Pending</p>
            <p className="text-lg font-bold text-amber-600 mt-0.5">{stats.pending}</p>
          </Card>
          <Card className="p-3 text-center bg-white border-gray-50 cursor-pointer" onClick={() => setFilter('submitted')}>
            <p className="text-[10px] text-blue-500 font-semibold uppercase">Submitted</p>
            <p className="text-lg font-bold text-blue-600 mt-0.5">{stats.submitted}</p>
          </Card>
          <Card className="p-3 text-center bg-white border-gray-50 cursor-pointer" onClick={() => setFilter('approved')}>
            <p className="text-[10px] text-green-500 font-semibold uppercase">Approved</p>
            <p className="text-lg font-bold text-green-600 mt-0.5">{stats.approved}</p>
          </Card>
          <Card className="p-3 text-center bg-white border-gray-50 cursor-pointer" onClick={() => setFilter('rejected')}>
            <p className="text-[10px] text-red-500 font-semibold uppercase">Rejected</p>
            <p className="text-lg font-bold text-red-600 mt-0.5">{stats.rejected}</p>
          </Card>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1 bg-gray-50 rounded-xl p-1 shrink-0 text-xs">
          {(['all', 'pending', 'submitted', 'approved', 'rejected'] as ClaimFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg font-medium transition capitalize ${filter === f ? 'bg-white text-navy shadow-sm' : 'text-gray-500'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* List of Claims */}
        {!invoices || !patients ? <div className="flex justify-center py-10"><Spinner /></div>
          : filteredInvoices.length === 0 ? <EmptyState icon={<FileText size={32} />} title="No claims found" description="No invoices matching filters" />
            : (
              <div className="space-y-1.5">
                {filteredInvoices.map((inv: any) => {
                  const isActive = selectedInvoice?._id === inv._id;
                  return (
                    <div key={inv._id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${isActive ? 'bg-navy/5 border-navy/20' : 'bg-white hover:bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-navy">{inv.invoiceNumber}</span>
                          <span className="text-[10px] text-gray-400 font-medium">| {format(new Date(inv.date), 'dd MMM yyyy')}</span>
                        </div>
                        {getNhimaStatusBadge(inv.nhimaStatus)}
                      </div>
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar name={inv.patient?.displayName || 'Patient'} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{inv.patient?.displayName}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{inv.patient?.nhimaMemberNo ? `NHIMA: ${inv.patient.nhimaMemberNo}` : 'Other Ins'}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm text-gray-800 shrink-0">{formatK(inv.total)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </div>

      {/* ── Right side detail panel ── */}
      {selectedInvoice && (
        <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col h-full border-l border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-navy text-sm uppercase leading-tight">Claim folders</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedInvoice.invoiceNumber}</p>
            </div>
            <button onClick={() => setSelectedInvoice(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400"><XCircle size={16} /></button>
          </div>

          {/* Detailed Content scroll */}
          <div className="flex-1 space-y-5 overflow-y-auto pr-1">
            {/* Visual Lifecycle Timeline */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Claims lifecycle status</p>
              
              <div className="flex items-center justify-between px-2 pt-2">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${getVisualProgressClass(1, selectedInvoice.nhimaStatus)}`}>
                    1
                  </div>
                  <span className="text-[9px] font-semibold text-gray-500 mt-1">Draft</span>
                </div>
                <ArrowRight size={12} className="text-gray-300 -mt-3" />

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${getVisualProgressClass(2, selectedInvoice.nhimaStatus)}`}>
                    2
                  </div>
                  <span className="text-[9px] font-semibold text-gray-500 mt-1">Submitted</span>
                </div>
                <ArrowRight size={12} className="text-gray-300 -mt-3" />

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs ${getVisualProgressClass(3, selectedInvoice.nhimaStatus)}`}>
                    3
                  </div>
                  <span className="text-[9px] font-semibold text-gray-500 mt-1">Settled</span>
                </div>
              </div>
            </div>

            {/* Insurance details */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2 text-xs">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User size={12} className="text-navy" /> Patient insurance credentials
              </p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div>
                  <span className="text-gray-400 block">NHIMA Member No</span>
                  <span className="font-semibold text-gray-800 font-mono">{selectedInvoice.patient?.nhimaMemberNo || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">NHIMA Scheme Type</span>
                  <span className="font-semibold text-gray-800">{selectedInvoice.patient?.nhimaScheme || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Employer</span>
                  <span className="font-semibold text-gray-800">{selectedInvoice.patient?.nhimaEmployer || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Claim status</span>
                  <span className="font-bold uppercase text-navy">{selectedInvoice.nhimaStatus || 'Not submitted'}</span>
                </div>
                {selectedInvoice.nhimaClaimNumber && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block">NHIMA Claim Reference</span>
                    <span className="font-mono text-navy font-bold text-sm bg-white border border-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">{selectedInvoice.nhimaClaimNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Invoiced items list */}
            <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
              <p className="bg-gray-50 px-3 py-2 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wide">
                Invoice billed lines
              </p>
              <div className="bg-white p-3 space-y-1.5">
                <div className="flex justify-between font-semibold border-b border-gray-50 pb-1.5">
                  <span>Description</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Standard Consultation Fee</span>
                  <span>{formatK(selectedInvoice.total)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-100 pt-1.5 text-navy text-sm">
                  <span>Invoiced Total</span>
                  <span>{formatK(selectedInvoice.total)}</span>
                </div>
              </div>
            </div>

            {/* Info helper block */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-[10px] leading-normal text-blue-700">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                Please ensure that this patient's NHIMA member card matches ZRA credentials before final submission. Claims once approved are auto-allocated as paid.
              </span>
            </div>
          </div>

          {/* Action buttons footer */}
          {account?.role === 'admin' && (
            <div className="pt-4 border-t border-gray-100 flex gap-2">
              {!selectedInvoice.nhimaStatus && (
                <Button className="w-full" onClick={handleOpenSubmit} icon={<PlusCircle size={14} />}>Submit Claim</Button>
              )}
              {selectedInvoice.nhimaStatus === 'submitted' && (
                <Button className="w-full" onClick={handleOpenReview} icon={<CheckCircle2 size={14} />}>Review Claim</Button>
              )}
              {selectedInvoice.nhimaStatus === 'approved' && (
                <div className="text-center w-full py-2 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700 flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} /> Claim settled and paid
                </div>
              )}
              {selectedInvoice.nhimaStatus === 'rejected' && (
                <div className="w-full">
                  <div className="text-center py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center justify-center gap-1 mb-2">
                    <XCircle size={13} /> Claim Rejected
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleOpenSubmit}>Appeal & Resubmit</Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Submit to NHIMA Modal ── */}
      <Modal open={showSubmitModal} onClose={() => setShowSubmitModal(false)} title="Submit Claims to NHIMA" width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setShowSubmitModal(false)}>Cancel</Button><Button loading={submittingClaim} onClick={handleSubmitClaim}>Confirm Submit</Button></>}>
        <div className="space-y-4">
          <Input label="NHIMA Claim Reference Number *" value={claimNumber} onChange={e => setClaimNumber(e.target.value)} placeholder="CLM-000000" />
          <Input label="Submission Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Approved formal sector scheme" />
        </div>
      </Modal>

      {/* ── Review Claim Status Modal ── */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Review NHIMA Claims Status" width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setShowReviewModal(false)}>Cancel</Button><Button loading={reviewingClaim} onClick={handleReviewClaim}>Submit Review</Button></>}>
        <div className="space-y-4">
          <Select label="Decision status *" value={reviewStatus} onChange={e => setReviewStatus(e.target.value)}
            options={[
              { value: 'approved', label: 'Approved & Settled' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
          <Input label="Reviewers notes" value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} placeholder="e.g. Settled by NHIMA formal sector" />
        </div>
      </Modal>
    </div>
  );
}
