import React, { useEffect, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { User, Lock, Bell, Monitor, Info, Globe, MapPin, Phone, Mail, Heart, ExternalLink, Building2 } from 'lucide-react';
import { Button, Input, Select, Card, PhoneInput, splitPhone, joinPhone } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

const baseTabs = [
  { id: 'profile', label: 'Profile', icon: <User size={15} /> },
  { id: 'security', label: 'Security', icon: <Lock size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'app', label: 'App', icon: <Monitor size={15} /> },
  { id: 'clinic', label: 'Clinic Identity', icon: <Building2 size={15} />, adminOnly: true },
  { id: 'about', label: 'About', icon: <Info size={15} /> },
];

export default function SettingsScreen() {
  const { account } = useAuth();
  const [tab, setTab] = useState('profile');
  const initialPhone = splitPhone(account?.phone || '');
  const [fullName, setFullName] = useState(account?.fullName || '');
  const [phoneCode, setPhoneCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);
  const [title, setTitle] = useState(account?.title || '');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  const isAdmin = account?.role === 'admin';
  const tabs = baseTabs.filter(t => !('adminOnly' in t) || isAdmin);

  const verifyPassword = useMutation(api.auth.verifyPassword);
  const updateProfile = useMutation(api.auth.updateProfile);
  const clinicConfig = useQuery(api.clinicConfig.getAll);
  const setConfig = useMutation(api.clinicConfig.set);

  // Clinic identity state
  const [clinicName, setClinicName] = useState('');
  const [clinicTagline, setClinicTagline] = useState('');
  const [clinicDesc, setClinicDesc] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicEmail, setClinicEmail] = useState('');
  const [clinicWebsite, setClinicWebsite] = useState('');
  const [clinicMsg, setClinicMsg] = useState('');

  useEffect(() => {
    if (!clinicConfig) return;
    setClinicName(clinicConfig.clinicName || 'Niche Renal Services');
    setClinicTagline(clinicConfig.clinicTagline || 'Renal Care & Medical Supplies');
    setClinicDesc(clinicConfig.clinicDescription || '');
    setClinicAddress(clinicConfig.clinicAddress || 'Lusaka, Zambia');
    setClinicPhone(clinicConfig.clinicPhone || '');
    setClinicEmail(clinicConfig.clinicEmail || 'info@nichehealthcaregroup.com');
    setClinicWebsite(clinicConfig.clinicWebsite || 'www.nichehealthcaregroup.com');
  }, [clinicConfig]);

  const handleSaveClinic = async () => {
    setSaving(true);
    setClinicMsg('');
    try {
      const by = account?.email || 'admin';
      await setConfig({ key: 'clinicName', value: JSON.stringify(clinicName), updatedBy: by });
      await setConfig({ key: 'clinicTagline', value: JSON.stringify(clinicTagline), updatedBy: by });
      await setConfig({ key: 'clinicDescription', value: JSON.stringify(clinicDesc), updatedBy: by });
      await setConfig({ key: 'clinicAddress', value: JSON.stringify(clinicAddress), updatedBy: by });
      await setConfig({ key: 'clinicPhone', value: JSON.stringify(clinicPhone), updatedBy: by });
      await setConfig({ key: 'clinicEmail', value: JSON.stringify(clinicEmail), updatedBy: by });
      await setConfig({ key: 'clinicWebsite', value: JSON.stringify(clinicWebsite), updatedBy: by });
      setClinicMsg('Clinic identity saved successfully');
    } catch (e: any) {
      setClinicMsg(e?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  // Re-sync local state when the underlying account loads/changes
  useEffect(() => {
    if (!account) return;
    setFullName(account.fullName || '');
    setTitle(account.title || '');
    const { code, number } = splitPhone(account.phone || '');
    setPhoneCode(code);
    setPhoneNumber(number);
  }, [account?._id, account?.fullName, account?.title, account?.phone]);

  const handleSaveProfile = async () => {
    if (!account?._id) {
      setProfileMsg('No account loaded');
      return;
    }
    setProfileMsg('');
    setSaving(true);
    try {
      await updateProfile({
        accountId: account._id as any,
        title: title || undefined,
        fullName: fullName || undefined,
        phone: joinPhone(phoneCode, phoneNumber) || undefined,
      });
      setProfileMsg('Profile saved successfully');
    } catch (e: any) {
      setProfileMsg(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return; }
    if (newPw.length < 8) { setPwMsg('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const check = await verifyPassword({ email: account?.email || '', password: currentPw });
      if (!check.success) { setPwMsg('Current password is incorrect'); return; }
      setPwMsg('Please contact your administrator to update your password.');
    } catch {
      setPwMsg('Verification failed — check current password');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-52 border-r border-gray-100 bg-white py-4 shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${tab === t.id ? 'bg-navy-50 text-navy font-semibold border-l-2 border-navy' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className={tab === t.id ? 'text-navy' : 'text-gray-400'}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-surface scrollbar-thin">
        <div className="max-w-lg space-y-5">
          {tab === 'profile' && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Profile Settings</h2>
              <Card className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                  <Select label="Title" options={['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Nurse'].map(v => ({ value: v, label: v }))} value={title} onChange={e => setTitle(e.target.value)} placeholder="Select title" />
                </div>
                <Input label="Email" value={account?.email || ''} disabled />
                <PhoneInput
                  label="Phone"
                  countryCode={phoneCode}
                  value={phoneNumber}
                  onChangeCountry={setPhoneCode}
                  onChangeNumber={setPhoneNumber}
                />
                {profileMsg && (
                  <p className={`text-xs ${profileMsg.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>
                    {profileMsg}
                  </p>
                )}
                <div className="pt-2">
                  <Button loading={saving} onClick={handleSaveProfile}>Save Profile</Button>
                </div>
              </Card>
            </>
          )}

          {tab === 'security' && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Security</h2>
              <Card className="p-5 space-y-4">
                <p className="text-xs text-gray-500">Change your password. You will need your current password to set a new one.</p>
                <Input label="Current Password" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} />
                <Input label="New Password" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} />
                <Input label="Confirm New Password" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                {pwMsg && <p className={`text-xs ${pwMsg.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
                <Button loading={saving} onClick={handleChangePassword}>Update Password</Button>
              </Card>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Notifications</h2>
              <Card className="p-5 space-y-4">
                {[
                  { label: 'New appointment bookings', desc: 'Get notified when a new appointment is booked' },
                  { label: 'Low stock alerts', desc: 'Alert when stock items fall below reorder level' },
                  { label: 'New messages', desc: 'Notify on new direct messages' },
                  { label: 'Announcements', desc: 'Show all new clinic announcements' },
                ].map(n => (
                  <div key={n.label} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.label}</p>
                      <p className="text-xs text-gray-400">{n.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-navy peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
              </Card>
            </>
          )}

          {tab === 'app' && (
            <>
              <h2 className="text-base font-semibold text-gray-900">App Settings</h2>
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">Compact sidebar</p>
                    <p className="text-xs text-gray-400">Show icons only in the sidebar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-navy peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                  </label>
                </div>
                <Select label="Currency" options={[{ value: 'ZMW', label: 'ZMW (Zambian Kwacha)' }, { value: 'USD', label: 'USD (US Dollar)' }]} value="ZMW" onChange={() => {}} />
                <Select label="Date Format" options={[{ value: 'dd/MM/yyyy', label: 'DD/MM/YYYY' }, { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY' }, { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD' }]} value="dd/MM/yyyy" onChange={() => {}} />
              </Card>
            </>
          )}

          {tab === 'clinic' && isAdmin && (
            <>
              <h2 className="text-base font-semibold text-gray-900">Clinic Identity</h2>
              <Card className="p-5 space-y-4">
                <p className="text-xs text-gray-400">These values are displayed across the application, on invoices, and in clinic branding.</p>
                <Input label="Clinic Name" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="e.g. Niche Renal Services" />
                <Input label="Tagline" value={clinicTagline} onChange={e => setClinicTagline(e.target.value)} placeholder="e.g. Renal Care & Medical Supplies" />
                <Input label="Address" value={clinicAddress} onChange={e => setClinicAddress(e.target.value)} placeholder="e.g. Lusaka, Zambia" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Email" value={clinicEmail} onChange={e => setClinicEmail(e.target.value)} />
                  <Input label="Phone" value={clinicPhone} onChange={e => setClinicPhone(e.target.value)} />
                </div>
                <Input label="Website" value={clinicWebsite} onChange={e => setClinicWebsite(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={clinicDesc} onChange={e => setClinicDesc(e.target.value)} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-navy/20 focus:border-navy" />
                </div>
                {clinicMsg && <p className={`text-xs ${clinicMsg.includes('successfully') ? 'text-green-600' : 'text-red-500'}`}>{clinicMsg}</p>}
                <Button loading={saving} onClick={handleSaveClinic}>Save Clinic Identity</Button>
              </Card>
            </>
          )}

          {tab === 'about' && (
            <div className="space-y-5">
              {/* Clinic identity card */}
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <img src="/logo.png" alt="Niche Healthcare Group" className="w-16 h-16 rounded-2xl object-contain bg-white shadow-sm border border-gray-100" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Niche Renal Services</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Renal Care &amp; Medical Supplies</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Heart size={10} className="fill-emerald-600 text-emerald-600" /> Compassionate Care
                    </span>
                  </div>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-5">
                  Niche Renal Services is a specialist healthcare provider based in Lusaka, Zambia, dedicated to delivering 
                  high-quality renal care and medical supplies. We provide comprehensive dialysis services, nephrology 
                  consultations, and a wide range of medical equipment to support patients and healthcare professionals 
                  across Zambia.
                </p>

                <div className="space-y-3">
                  {[
                    { icon: <MapPin size={14} />, label: 'Lusaka, Zambia' },
                    { icon: <Globe size={14} />, label: 'www.nichehealthcaregroup.com', href: 'https://www.nichehealthcaregroup.com' },
                    { icon: <Mail size={14} />, label: 'info@nichehealthcaregroup.com', href: 'mailto:info@nichehealthcaregroup.com' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 text-sm text-gray-600">
                      <span className="text-navy shrink-0">{item.icon}</span>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer"
                          className="hover:text-navy hover:underline flex items-center gap-1">
                          {item.label} <ExternalLink size={11} className="text-gray-400" />
                        </a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* App info — minimal, no build stack */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">NHL Connect Desktop</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'Version', value: '1.0.0' },
                    { label: 'Purpose', value: 'Clinic management &amp; staff platform' },
                    { label: 'Support', value: 'info@nichehealthcaregroup.com' },
                  ].map(f => (
                    <div key={f.label} className="flex justify-between text-sm">
                      <span className="text-gray-400">{f.label}</span>
                      <span className="font-medium text-gray-700" dangerouslySetInnerHTML={{ __html: f.value }} />
                    </div>
                  ))}
                </div>
              </Card>

              <p className="text-xs text-center text-gray-400">
                &copy; {new Date().getFullYear()} Niche Renal Services. All rights reserved.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
