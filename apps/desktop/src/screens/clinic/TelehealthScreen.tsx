import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Video, X, CheckCircle, Clock, Users, PhoneOff, ExternalLink, Bell, Calendar } from 'lucide-react';
import { Button, Select, Modal, Badge, EmptyState, Spinner, Card, StatCard, Input } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const statusColor: Record<string, 'blue' | 'green' | 'red' | 'amber' | 'gray'> = {
  active: 'blue', completed: 'green', cancelled: 'red', waiting: 'amber',
};

// ── Video Overlay ──────────────────────────────────────────────────
function VideoOverlay({ roomUrl, platform, onEnd }: { roomUrl: string; platform?: string; onEnd: () => void }) {
  const isExternal = platform && platform !== 'jitsi';
  
  React.useEffect(() => {
    if (isExternal) {
      window.open(roomUrl, '_blank');
    }
  }, [roomUrl, isExternal]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 shrink-0">
        <div className="flex items-center gap-2 text-white">
          <Video size={16} className="text-green-400" />
          <span className="text-sm font-medium">Telehealth Session ({platform === 'zoom' ? 'Zoom' : platform === 'google_meet' ? 'Google Meet' : 'Jitsi Meet'})</span>
          <span className="text-xs text-gray-400 ml-2">{roomUrl}</span>
        </div>
        <div className="flex items-center gap-2">
          <a href={roomUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-300 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition">
            <ExternalLink size={12} /> Open in Browser
          </a>
          <button onClick={onEnd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition">
            <PhoneOff size={13} /> End Session
          </button>
        </div>
      </div>
      {isExternal ? (
        <div className="flex-1 w-full flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center space-y-4">
          <div className="p-4 bg-gray-900 rounded-full border border-gray-800 animate-pulse">
            <Video size={48} className="text-green-400" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-semibold text-gray-100">External Meeting Launched</h3>
            <p className="text-sm text-gray-400">
              The {platform === 'zoom' ? 'Zoom' : 'Google Meet'} call was opened in a new tab. If it did not open automatically, please click the button below to join.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.open(roomUrl, '_blank')} icon={<ExternalLink size={14} />}>
              Open Meeting Link
            </Button>
            <Button variant="danger" onClick={onEnd} icon={<PhoneOff size={14} />}>
              End & Save Session
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-8 max-w-sm">
            Keep this overlay open while the meeting is in progress. Once complete, click "End & Save Session" to finalize clinical records and notes.
          </p>
        </div>
      ) : (
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="flex-1 w-full border-0"
          title="Telehealth Session"
        />
      )}
    </div>
  );
}

export default function TelehealthScreen() {
  const { account, session } = useAuth();
  const userId = useMemo(() => session?.accountId || account?.email || '', [session?.accountId, account?.email]);

  const [showStart, setShowStart] = useState(false);
  const [activeRoomUrl, setActiveRoomUrl] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const [tab, setTab] = useState<'sessions' | 'appointments'>('sessions');

  // Form state for starting a session
  const [formPatientId, setFormPatientId] = useState('');
  const [formApptId, setFormApptId] = useState('');
  const [formInvitees, setFormInvitees] = useState<string[]>([]);
  const [formPlatform, setFormPlatform] = useState<'jitsi' | 'zoom' | 'google_meet'>('jitsi');
  const [formCustomUrl, setFormCustomUrl] = useState('');

  // Convex queries
  const activeSessions = useQuery(api.telehealth.listActive, {});
  const completedSessions = useQuery(api.telehealth.listCompleted, {});
  const telehealthAppts = useQuery(api.appointments.listByDateRange, {
    startFrom: Date.now() - 30 * 86400000,
    startTo: Date.now() + 365 * 86400000,
  });
  const patients = useQuery(api.patients.list, {});
  const allUsers = useQuery(api.auth.getAllUsers);
  const invitedSessions = useQuery(api.telehealth.getInvitedSessions, { userId });

  const startSessionMut = useMutation(api.telehealth.startSession);
  const endSessionMut = useMutation(api.telehealth.endSession);

  const patientOptions = useMemo(() => {
    return (patients || []).map((p: any) => ({ value: p._id, label: p.displayName || 'Unknown' }));
  }, [patients]);

  const thAppts = useMemo(() => {
    return (telehealthAppts || []).filter((a: any) => a.type === 'Telehealth');
  }, [telehealthAppts]);

  const apptOptions = useMemo(() => {
    return [
      { value: '', label: 'No linked appointment (ad-hoc)' },
      ...thAppts.map((a: any) => {
        const pat = patients?.find((p: any) => p._id === a.patientId);
        return { value: a._id, label: `${pat?.displayName || 'Patient'} — ${format(new Date(a.startTime), 'dd MMM HH:mm')}` };
      }),
    ];
  }, [thAppts, patients]);

  const toggleInvitee = (uid: string) => setFormInvitees(prev =>
    prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
  );

  const handleStart = async () => {
    setStartError('');
    if (!formPatientId) { setStartError('Please select a patient.'); return; }
    if (formPlatform !== 'jitsi' && !formCustomUrl.trim()) {
      setStartError(`Please enter a valid ${formPlatform === 'zoom' ? 'Zoom' : 'Google Meet'} meeting link.`);
      return;
    }
    setStarting(true);
    try {
      const result = await startSessionMut({
        appointmentId: formApptId ? formApptId as any : undefined,
        patientId: formPatientId as any,
        providerId: userId,
        invitees: formInvitees,
        createdBy: account?.email || 'admin',
        platform: formPlatform,
        customRoomUrl: formPlatform !== 'jitsi' ? formCustomUrl.trim() : undefined,
      });
      if (result?.roomUrl) {
        setActiveRoomUrl(result.roomUrl);
        setActivePlatform(formPlatform);
        setActiveSessionId(result.sessionId);
      }
      setShowStart(false);
      setFormPatientId(''); setFormApptId(''); setFormInvitees([]); setFormPlatform('jitsi'); setFormCustomUrl('');
    } catch (e: any) {
      setStartError(e?.message || 'Failed to start session.');
    } finally { setStarting(false); }
  };

  const handleEnd = async () => {
    if (activeSessionId) {
      await endSessionMut({ sessionId: activeSessionId as any, createTreatmentNote: false });
    }
    setActiveRoomUrl(null);
    setActivePlatform(null);
    setActiveSessionId(null);
  };

  const handleJoinInvited = (roomUrl: string, platform?: string) => {
    setActiveRoomUrl(roomUrl);
    setActivePlatform(platform || 'jitsi');
  };

  return (
    <>
      {/* Video overlay when session is active */}
      {activeRoomUrl && <VideoOverlay roomUrl={activeRoomUrl} platform={activePlatform || 'jitsi'} onEnd={handleEnd} />}

      <div className="p-6 space-y-5 max-w-5xl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Telehealth</h2>
          <Button icon={<Video size={15} />} onClick={() => setShowStart(true)}>Start Session</Button>
        </div>

        {/* Invitation banner for invited staff */}
        {(invitedSessions || []).map((s: any) => {
          const pat = patients?.find((p: any) => p._id === s.patientId);
          return (
            <div key={s._id} className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Bell size={16} className="text-blue-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">You've been invited to a session</p>
                <p className="text-xs text-blue-600">Patient: {pat?.displayName || 'Unknown'} · Provider: {s.providerId} ({s.platform === 'zoom' ? 'Zoom' : s.platform === 'google_meet' ? 'Google Meet' : 'Jitsi'})</p>
              </div>
              {s.roomUrl && (
                <Button size="sm" onClick={() => handleJoinInvited(s.roomUrl, s.platform)} icon={<Video size={13} />}>
                  Join Now
                </Button>
              )}
            </div>
          );
        })}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Active Now" value={(activeSessions || []).length} icon={<Video size={18} />} color="text-blue-600" />
          <StatCard label="Completed" value={(completedSessions || []).length} icon={<CheckCircle size={18} />} color="text-green-600" />
          <StatCard label="Telehealth Appts" value={thAppts.length} icon={<Clock size={18} />} color="text-navy" />
        </div>

        {/* Active sessions */}
        {(activeSessions || []).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active Sessions
            </h3>
            <div className="space-y-2">
              {(activeSessions || []).map((s: any) => {
                const pat = patients?.find((p: any) => p._id === s.patientId);
                const isOwner = s.providerId === userId;
                return (
                  <Card key={s._id} className="p-4 flex items-center gap-4">
                    <div className="p-2 bg-green-50 rounded-xl shrink-0"><Video size={18} className="text-green-600" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{pat?.displayName || 'Patient'}</p>
                      <p className="text-xs text-gray-400">
                        Started {s.startedAt ? format(new Date(s.startedAt), 'HH:mm') : '—'} · Provider: {s.providerId}
                        {(s.invitees || []).length > 0 && ` · ${s.invitees.length} invited`}
                      </p>
                    </div>
                    <Badge label="live" color="blue" />
                    {s.roomUrl && (
                      <Button size="sm" variant="secondary" icon={<Video size={13} />}
                        onClick={() => { setActiveRoomUrl(s.roomUrl); setActivePlatform(s.platform || 'jitsi'); if (isOwner) setActiveSessionId(s._id); }}>
                        {isOwner ? 'Rejoin' : 'Join'}
                      </Button>
                    )}
                    {isOwner && (
                      <Button size="sm" variant="danger" icon={<PhoneOff size={13} />}
                        onClick={async () => { await endSessionMut({ sessionId: s._id, createTreatmentNote: false }); }}>
                        End
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100">
          {(['sessions', 'appointments'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition border-b-2 -mb-px ${tab === t ? 'border-navy text-navy' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
              {t === 'sessions' ? 'Past Sessions' : 'Telehealth Appointments'}
            </button>
          ))}
        </div>

        {/* Past sessions table */}
        {tab === 'sessions' && (
          !completedSessions ? <div className="flex justify-center py-8"><Spinner /></div>
          : completedSessions.length === 0
            ? <EmptyState icon={<Video size={32} />} title="No past sessions" description="Completed telehealth sessions will appear here" />
            : (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>{['Patient', 'Provider', 'Started', 'Duration', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {completedSessions.map((s: any) => {
                      const pat = patients?.find((p: any) => p._id === s.patientId);
                      return (
                        <tr key={s._id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{pat?.displayName || 'Unknown'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{s.providerId}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{s.startedAt ? format(new Date(s.startedAt), 'dd MMM yyyy HH:mm') : '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{s.duration ? `${Math.round(s.duration / 60)} min` : '—'}</td>
                          <td className="px-4 py-3"><Badge label={s.status} color={statusColor[s.status] || 'gray'} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* Telehealth appointments list */}
        {tab === 'appointments' && (
          !telehealthAppts ? <div className="flex justify-center py-8"><Spinner /></div>
          : thAppts.length === 0
            ? <EmptyState icon={<Calendar size={32} />} title="No telehealth appointments" description="Book an appointment with type 'Telehealth' in the Appointments screen" />
            : (
              <div className="space-y-2">
                {thAppts.map((a: any) => {
                  const pat = patients?.find((p: any) => p._id === a.patientId);
                  const isPast = new Date(a.startTime) < new Date();
                  return (
                    <Card key={a._id} className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-xl shrink-0 ${isPast ? 'bg-gray-50' : 'bg-blue-50'}`}>
                        <Video size={18} className={isPast ? 'text-gray-400' : 'text-blue-500'} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{pat?.displayName || 'Patient'}</p>
                        <p className="text-xs text-gray-400">{format(new Date(a.startTime), 'dd MMM yyyy, HH:mm')} · {a.duration}min</p>
                      </div>
                      <Badge label={isPast ? 'past' : 'upcoming'} color={isPast ? 'gray' : 'blue'} />
                      {!isPast && (
                        <Button size="sm" icon={<Video size={13} />}
                          onClick={() => { setFormApptId(a._id); setFormPatientId(a.patientId || ''); setShowStart(true); }}>
                          Start
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )
        )}
      </div>

      {/* Start Session Modal */}
      <Modal open={showStart} onClose={() => { setShowStart(false); setStartError(''); }} title="Start Telehealth Session" width="max-w-md"
        footer={<><Button variant="outline" onClick={() => { setShowStart(false); setStartError(''); }}>Cancel</Button><Button loading={starting} onClick={handleStart} icon={<Video size={14} />}>Start & Join</Button></>}>
        <div className="space-y-4">
          {startError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{startError}</div>}

          <Select label="Patient *" options={patientOptions} placeholder="Select patient" value={formPatientId}
            onChange={e => setFormPatientId(e.target.value)} />

          <Select label="Link to Appointment (optional)" options={apptOptions} value={formApptId}
            onChange={e => {
              setFormApptId(e.target.value);
              if (e.target.value) {
                const a = thAppts.find((x: any) => x._id === e.target.value);
                if (a?.patientId) setFormPatientId(a.patientId);
              }
            }} />

          <Select label="Telehealth Platform *" options={[
            { value: 'jitsi', label: 'Jitsi Meet (Built-in, Instant)' },
            { value: 'zoom', label: 'Zoom Meeting' },
            { value: 'google_meet', label: 'Google Meet' },
          ]} value={formPlatform} onChange={e => setFormPlatform(e.target.value as any)} />

          {formPlatform !== 'jitsi' && (
            <Input label={`${formPlatform === 'zoom' ? 'Zoom' : 'Google Meet'} Meeting Link *`}
              placeholder={`https://${formPlatform === 'zoom' ? 'zoom.us/j/...' : 'meet.google.com/...'}`}
              value={formCustomUrl} onChange={e => setFormCustomUrl(e.target.value)} />
          )}

          {/* Staff invitees */}
          {allUsers && allUsers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1"><Users size={12} /> Invite Staff to Join</p>
              <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                {(allUsers as any[]).filter(u => (u.externalId || u._id) !== userId).map((u: any) => (
                  <label key={u._id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="rounded"
                      checked={formInvitees.includes(u.externalId || u._id)}
                      onChange={() => toggleInvitee(u.externalId || u._id)} />
                    <span className="text-sm text-gray-800">{u.displayName}</span>
                    <span className="text-xs text-gray-400 ml-auto">{u.role || ''}</span>
                  </label>
                ))}
              </div>
              {formInvitees.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">{formInvitees.length} staff will be notified to join</p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            {formPlatform === 'jitsi' 
              ? 'A secure Jitsi Meet room will open automatically. Invited staff will see a join notification.'
              : `Paste your ${formPlatform === 'zoom' ? 'Zoom' : 'Google Meet'} meeting link. We will open the external call in a new tab and notify invited staff to join.`}
          </div>
        </div>
      </Modal>
    </>
  );
}
