import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Megaphone, Plus, Pin } from 'lucide-react';
import { Button, Input, Select, Textarea, Modal, Badge, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

const priorityColor: Record<string, 'red' | 'amber' | 'gray'> = { urgent: 'red', high: 'amber', normal: 'gray' };

export default function AnnouncementsScreen() {
  const { account } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [audience, setAudience] = useState('all');
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const announcements = useQuery(api.announcements.listAnnouncements);
  const create = useMutation(api.announcements.createAnnouncement);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await create({
        title, body, author: account?.email || 'admin',
        authorName: account?.displayName || account?.fullName || account?.email,
        priority, audience, isPinned,
      });
      setShowModal(false); setTitle(''); setBody(''); setPriority('normal'); setAudience('all'); setIsPinned(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Announcements</h2>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>New Announcement</Button>
      </div>

      {!announcements ? <div className="flex justify-center py-10"><Spinner /></div>
        : announcements.length === 0 ? <EmptyState icon={<Megaphone size={32} />} title="No announcements" action={<Button onClick={() => setShowModal(true)} icon={<Plus size={15} />}>Create</Button>} />
          : announcements.map((ann: any) => (
            <Card key={ann._id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ann.isPinned && <Pin size={13} className="text-peach" />}
                    <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                    <Badge label={ann.priority || 'normal'} color={priorityColor[ann.priority] || 'gray'} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{ann.body}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>By {ann.authorName || ann.author}</span>
                    <span>·</span>
                    <span>{ann.createdAt ? format(new Date(ann.createdAt), 'dd MMM yyyy HH:mm') : ''}</span>
                    <span>·</span>
                    <span>Audience: {ann.audience || 'all'}</span>
                    {ann.acknowledgedBy && <span>· {ann.acknowledgedBy.length}/{ann.totalStaff || 0} acknowledged</span>}
                  </div>
                </div>
              </div>
            </Card>
          ))}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Announcement" width="max-w-lg"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Publish</Button></>}>
        <div className="space-y-4">
          <Input label="Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Important Staff Update" autoFocus />
          <Textarea label="Message *" value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder="Write your announcement..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" options={['normal', 'high', 'urgent'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} value={priority} onChange={e => setPriority(e.target.value)} />
            <Select label="Audience" options={['all', 'admin', 'moderator', 'member'].map(v => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))} value={audience} onChange={e => setAudience(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Pin this announcement</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
