import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { UserCog, Plus, Search, Shield, CheckCircle, XCircle, X, Mail, Phone, Calendar, Clock, Monitor, Edit2, Key, Info } from 'lucide-react';
import { Button, Input, Select, Modal, Badge, Avatar, EmptyState, Spinner, Card, PhoneInput, splitPhone, joinPhone } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { getPermissionsForRole, PERMISSION_KEYS, PERMISSION_GROUPS, PRESETS, type Role, type Permission } from '../../utils/permissions';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'moderator_plus', label: 'Moderator+' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'bookkeeper', label: 'Bookkeeper' },
  { value: 'member', label: 'Member' },
];
const roleColor: Record<string, 'navy' | 'peach' | 'gray'> = {
  admin: 'navy', moderator_plus: 'peach', moderator: 'peach', bookkeeper: 'peach', member: 'gray',
};

export default function StaffScreen() {
  const { account, hasPermission } = useAuth();
  const isAdmin = account?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [editRole, setEditRole] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [createdCreds, setCreatedCreds] = useState<{ email: string; pw: string; role: string } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  const staff = useQuery(api.auth.getAllStaffAccounts);
  const createStaff = useMutation(api.auth.createStaffAccount);
  const deactivateStaff = useMutation(api.auth.deactivateStaffAccount);
  const reactivateStaff = useMutation(api.auth.reactivateStaffAccount);
  const updatePermissions = useMutation(api.auth.updateStaffRoleAndPermissions);

  const liveSelected = staff?.find((s: any) => s._id === selected?._id);
  const activeRecord = liveSelected || selected;

  const [customPerms, setCustomPerms] = useState<Permission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);

  const [syncedKey, setSyncedKey] = useState('');

  useEffect(() => {
    if (activeRecord) {
      const currentBackendPerms = activeRecord.permissions || Object.keys(getPermissionsForRole(activeRecord.role)).filter(k => getPermissionsForRole(activeRecord.role)[k as Permission]) as Permission[];
      const backendKey = `${activeRecord._id}_${activeRecord.role}_${currentBackendPerms.join(',')}`;
      
      if (backendKey !== syncedKey) {
        setCustomPerms(currentBackendPerms);
        setSyncedKey(backendKey);
      }
    } else {
      if (syncedKey !== '') {
        setSyncedKey('');
      }
    }
  }, [activeRecord, syncedKey]);

  const handleTogglePermission = (key: Permission) => {
    setCustomPerms(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const filtered = (staff || []).filter((s: any) =>
    !search || s.email.toLowerCase().includes(search.toLowerCase())
      || (s.fullName || '').toLowerCase().includes(search.toLowerCase())
      || (s.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!email.trim()) return;
    setSaving(true);
    try {
      const pw = Math.random().toString(36).slice(-10) + 'A1!';
      await createStaff({ email: email.trim().toLowerCase(), role, password: pw, createdBy: account?.email || 'admin' });
      setCreatedCreds({ email: email.trim().toLowerCase(), pw, role });
    } catch (e: any) {
      alert(e?.message || 'Failed to create account');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (s: any) => {
    if (!confirm(`Deactivate ${s.fullName || s.email}?`)) return;
    await deactivateStaff({ accountId: s._id as any, adminId: account?.email || 'admin' });
    setSelected(null);
  };

  const handleReactivate = async (s: any) => {
    if (!confirm(`Reactivate ${s.fullName || s.email}?`)) return;
    await reactivateStaff({ accountId: s._id as any, adminId: account?.email || 'admin' });
  };

  const permissionsForRole = (r: string) => {
    try { return getPermissionsForRole(r as Role); } catch { return {}; }
  };

  return (
    <div className="flex h-full">
      {/* ── Left list pane ── */}
      <div className={`${selected ? 'w-[380px] border-r border-gray-100' : 'flex-1 max-w-4xl'} flex flex-col p-6 space-y-4 overflow-y-auto`}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900">Staff Accounts</h2>
            {staff && <span className="text-sm text-gray-400">{staff.filter((s: any) => s.isActive).length} active</span>}
          </div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search staff..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} className="w-48" />
            {isAdmin && <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)} size="sm">Add</Button>}
          </div>
        </div>

        {!staff ? <div className="flex justify-center py-10"><Spinner /></div>
          : filtered.length === 0 ? <EmptyState icon={<UserCog size={32} />} title="No staff found" />
            : (
              <div className="space-y-1">
                {filtered.map((s: any) => {
                  const isActive = selected?._id === s._id;
                  return (
                    <div key={s._id}
                      onClick={() => { setSelected(s); setEditRole(false); }}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${isActive ? 'bg-navy/5 border border-navy/20' : 'hover:bg-gray-50 border border-transparent'}`}>
                      <Avatar name={s.fullName || s.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{s.fullName || s.email}</p>
                        <p className="text-xs text-gray-400 truncate">{s.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge label={s.role === 'moderator_plus' ? 'Mod+' : s.role} color={roleColor[s.role] || 'gray'} />
                        {s.isActive
                          ? <span className="w-2 h-2 rounded-full bg-green-500" title="Active" />
                          : <span className="w-2 h-2 rounded-full bg-red-400" title="Inactive" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
      </div>

      {/* ── Right detail pane ── */}
      {activeRecord && (
        <div className="flex-1 p-6 overflow-y-auto bg-white">
          <div className="max-w-xl space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar name={activeRecord.fullName || activeRecord.email} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activeRecord.fullName || activeRecord.email}</h3>
                  <p className="text-sm text-gray-500">{activeRecord.email}</p>
                  {activeRecord.title && <p className="text-xs text-gray-400 mt-0.5">{activeRecord.title}</p>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>

            {/* Status badges row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge label={activeRecord.role === 'moderator_plus' ? 'Moderator+' : activeRecord.role?.charAt(0).toUpperCase() + activeRecord.role?.slice(1)} color={roleColor[activeRecord.role] || 'gray'} />
              {activeRecord.isActive
                ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={13} /> Active</span>
                : <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={13} /> Inactive</span>}
              {activeRecord.isOnboarded
                ? <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Onboarded</span>
                : <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pending Onboarding</span>}
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-gray-400" />
                  <span>{activeRecord.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  <span>{activeRecord.phone || 'No phone'}</span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Account Details</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Role</p>
                  {editRole ? (
                    <div className="flex items-center gap-2 mt-1">
                      <select value={newRole} onChange={e => setNewRole(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2.5 py-1 text-gray-800 bg-white">
                        {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button onClick={async () => {
                        try {
                          await updatePermissions({
                            accountId: activeRecord._id,
                            role: newRole,
                            permissions: customPerms,
                            adminEmail: account?.email || 'admin'
                          });
                          setSelected({ ...activeRecord, role: newRole });
                          setEditRole(false);
                        } catch (e) {
                          alert('Failed to update role');
                        }
                      }} className="text-xs text-green-600 font-semibold hover:text-green-700">Save</button>
                      <button onClick={() => setEditRole(false)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 flex items-center gap-2 mt-0.5">
                      {activeRecord.role === 'moderator_plus' ? 'Moderator+' : activeRecord.role?.charAt(0).toUpperCase() + activeRecord.role?.slice(1)}
                      {isAdmin && activeRecord.email !== account?.email && (
                        <button onClick={() => { setNewRole(activeRecord.role); setEditRole(true); }} className="text-gray-400 hover:text-navy"><Edit2 size={12} /></button>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="font-mono text-xs text-gray-600 mt-1">{activeRecord.userId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="font-medium text-gray-900 mt-0.5">{new Date(activeRecord.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created By</p>
                  <p className="font-medium text-gray-900 mt-0.5">{activeRecord.createdBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Trusted Devices</p>
                  <p className="font-medium text-gray-900 mt-0.5">{activeRecord.trustedDevices?.length || 0} device(s)</p>
                </div>
              </div>
            </div>

            {/* Security & Credentials */}
            {isAdmin && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 text-navy">
                  <Key size={13} className="text-amber-500" />
                  <span>Security & Credentials</span>
                </h4>
                <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">System Email</p>
                    <p className="font-semibold text-gray-900 mt-0.5">{activeRecord.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Access Password</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs text-gray-700 font-semibold bg-white px-2 py-0.5 border border-gray-200 rounded select-all">
                        {activeRecord.password || '—'}
                      </span>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(activeRecord.password || '');
                          alert('Password copied to clipboard!');
                        }}
                        className="text-[10px] text-navy hover:underline font-semibold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Permissions Visual Editor */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Custom Permissions</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Configure granular override sub-permissions</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      const defaults = getPermissionsForRole(activeRecord.role);
                      const activeKeys = Object.keys(defaults).filter(k => defaults[k as Permission]) as Permission[];
                      setCustomPerms(activeKeys);
                    }}
                    className="text-[11px] font-medium text-navy hover:underline"
                  >
                    Reset Defaults
                  </button>
                )}
              </div>

              {/* Presets Action Bar */}
              {isAdmin && (
                <div className="bg-white border border-gray-100 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase">
                    <Key size={11} className="text-amber-500" />
                    <span>Apply Preset Templates</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setCustomPerms(PRESETS.practitioner)}
                      className="px-2 py-1 rounded bg-navy/5 text-navy hover:bg-navy hover:text-white font-medium text-xs transition"
                    >
                      Practitioner
                    </button>
                    <button
                      onClick={() => setCustomPerms(PRESETS.nurse)}
                      className="px-2 py-1 rounded bg-navy/5 text-navy hover:bg-navy hover:text-white font-medium text-xs transition"
                    >
                      Nurse
                    </button>
                    <button
                      onClick={() => setCustomPerms(PRESETS.accountant)}
                      className="px-2 py-1 rounded bg-navy/5 text-navy hover:bg-navy hover:text-white font-medium text-xs transition"
                    >
                      Accountant
                    </button>
                    <button
                      onClick={() => setCustomPerms(PRESETS.manager)}
                      className="px-2 py-1 rounded bg-navy/5 text-navy hover:bg-navy hover:text-white font-medium text-xs transition"
                    >
                      Manager
                    </button>
                  </div>
                </div>
              )}

              {/* Categorized Permissions Checklist */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                {PERMISSION_GROUPS.map(group => {
                  return (
                    <div key={group.category} className="space-y-1.5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                        {group.category}
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {group.permissions.map(p => {
                          const isChecked = customPerms.includes(p.key);
                          const isDisabled = !isAdmin;
                          return (
                            <div
                              key={p.key}
                              onClick={() => !isDisabled && handleTogglePermission(p.key)}
                              className={`flex items-start gap-2.5 p-2 rounded-lg transition border ${
                                isChecked 
                                  ? 'bg-white border-navy/15 shadow-sm' 
                                  : 'bg-white/50 border-transparent'
                              } ${!isDisabled ? 'cursor-pointer hover:bg-white hover:border-gray-200' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                readOnly
                                disabled={isDisabled}
                                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-navy focus:ring-navy pointer-events-none"
                              />
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-semibold block ${isChecked ? 'text-gray-800' : 'text-gray-500'}`}>
                                  {p.label}
                                </span>
                                <span className="text-[9px] text-gray-400 block mt-0.5 leading-normal">
                                  {p.desc}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Button */}
              {isAdmin && (
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Info size={11} className="text-gray-400" />
                    <span>{customPerms.length} permissions active</span>
                  </div>
                  <Button
                    size="sm"
                    loading={savingPerms}
                    onClick={async () => {
                      setSavingPerms(true);
                      try {
                        await updatePermissions({
                          accountId: activeRecord._id,
                          role: activeRecord.role,
                          permissions: customPerms,
                          adminEmail: account?.email || 'admin'
                        });
                        alert('Custom permissions successfully updated!');
                      } catch (e) {
                        alert('Error updating permissions');
                      } finally {
                        setSavingPerms(false);
                      }
                    }}
                  >
                    Save Permissions
                  </Button>
                </div>
              )}
            </div>

            {/* Actions */}
            {isAdmin && activeRecord.email !== account?.email && (
              <div className="flex gap-3 pt-1">
                {activeRecord.isActive ? (
                  <Button variant="danger" size="sm" onClick={() => handleDeactivate(activeRecord)}>Deactivate Account</Button>
                ) : (
                  <Button size="sm" onClick={() => handleReactivate(activeRecord)}>Reactivate Account</Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ── */}
      <Modal 
        open={showModal} 
        onClose={() => {
          setShowModal(false);
          setCreatedCreds(null);
          setCopiedCreds(false);
          setEmail('');
          setRole('member');
        }} 
        title={createdCreds ? "Account Created" : "Add Staff Account"} 
        width="max-w-md"
        footer={
          createdCreds ? (
            <div className="flex gap-2 w-full justify-between">
              <Button variant="outline" onClick={() => {
                setCreatedCreds(null);
                setCopiedCreds(false);
                setEmail('');
                setRole('member');
              }}>
                Add Another
              </Button>
              <Button onClick={() => {
                setShowModal(false);
                setCreatedCreds(null);
                setCopiedCreds(false);
                setEmail('');
                setRole('member');
              }}>
                Done
              </Button>
            </div>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleCreate}>Create Account</Button>
            </>
          )
        }
      >
        {createdCreds ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Account Successfully Created</h3>
              <p className="text-xs text-gray-500">Share these temporary login credentials securely with the staff member.</p>
            </div>

            <div className="border border-gray-100 rounded-xl bg-gray-50 overflow-hidden divide-y divide-gray-100">
              <div className="p-3 flex justify-between items-center text-sm">
                <span className="text-gray-400 text-xs">Email Address</span>
                <span className="font-semibold text-gray-800 font-mono">{createdCreds.email}</span>
              </div>
              <div className="p-3 flex justify-between items-center text-sm">
                <span className="text-gray-400 text-xs">Temporary Password</span>
                <span className="font-semibold text-gray-800 font-mono select-all bg-white px-2 py-0.5 border border-gray-200 rounded">{createdCreds.pw}</span>
              </div>
              <div className="p-3 flex justify-between items-center text-sm">
                <span className="text-gray-400 text-xs">Access Role</span>
                <Badge label={createdCreds.role === 'moderator_plus' ? 'Moderator+' : createdCreds.role?.charAt(0).toUpperCase() + createdCreds.role?.slice(1)} color={roleColor[createdCreds.role] || 'gray'} />
              </div>
              <div className="p-3 flex justify-between items-center text-xs text-gray-400">
                <span>Verification Code</span>
                <span className="text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">Sent on sign-in</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                className="flex-1 text-xs" 
                onClick={async () => {
                  const text = `Email: ${createdCreds.email}\nPassword: ${createdCreds.pw}\nRole: ${createdCreds.role === 'moderator_plus' ? 'Moderator+' : createdCreds.role.charAt(0).toUpperCase() + createdCreds.role.slice(1)}\n\nA verification code will be sent to this email address each time they sign in.`;
                  await navigator.clipboard.writeText(text);
                  setCopiedCreds(true);
                  setTimeout(() => setCopiedCreds(false), 2000);
                }}
              >
                {copiedCreds ? 'Copied!' : 'Copy Credentials'}
              </Button>
              <Button 
                className="flex-1 text-xs" 
                onClick={() => {
                  const subject = encodeURIComponent('Your NHL Connect Login Credentials');
                  const body = encodeURIComponent(
                    `Welcome to NHL Connect!\n\n` +
                    `Here are your login credentials:\n\n` +
                    `Email: ${createdCreds.email}\n` +
                    `Password: ${createdCreds.pw}\n` +
                    `Role: ${createdCreds.role === 'moderator_plus' ? 'Moderator+' : createdCreds.role.charAt(0).toUpperCase() + createdCreds.role.slice(1)}\n\n` +
                    `When you sign in, a one-time verification code will be sent to this email address automatically.\n\n` +
                    `Please download the app and sign in to complete your profile.\n\n` +
                    `— Niche Healthcare Administration`
                  );
                  window.location.href = `mailto:${createdCreds.email}?subject=${subject}&body=${body}`;
                }}
              >
                Email Credentials
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
              A temporary password will be generated. Staff will receive an OTP via email to sign in and can set their own password.
            </p>
            <Input label="Email Address *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@clinic.com" autoFocus />
            <Select label="Role" options={roleOptions} value={role} onChange={e => setRole(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
