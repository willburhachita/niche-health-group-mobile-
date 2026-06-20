import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Hash, Plus, Users, Trash2 } from 'lucide-react';
import { Button, Input, Textarea, Modal, EmptyState, Spinner, Card } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export default function ManageChannelsScreen() {
  const { account } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const channels = useQuery(api.channels.listChannels);
  const createChannel = useMutation(api.channels.createChannel);
  const deleteChannel = useMutation(api.channels.deleteChannel);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-');
      await createChannel({
        name: slug,
        displayName: name.trim(),
        description: description || undefined,
        type: 'public',
        members: [],
        admins: [],
        createdBy: account?.email || 'admin',
      });
      setShowModal(false); setName(''); setDescription('');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this channel? All messages will be lost.')) return;
    await deleteChannel({ channelId: id as any, deletedBy: account?.email || 'admin' });
  };

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Manage Channels</h2>
        <Button icon={<Plus size={15} />} onClick={() => setShowModal(true)}>New Channel</Button>
      </div>

      {!channels ? <div className="flex justify-center py-10"><Spinner /></div>
        : channels.length === 0 ? <EmptyState icon={<Hash size={32} />} title="No channels" action={<Button onClick={() => setShowModal(true)} icon={<Plus size={15} />}>Create Channel</Button>} />
          : channels.map((ch: any) => (
            <Card key={ch._id} className="p-4 flex items-center gap-4">
              <div className="p-2 bg-navy/10 rounded-lg shrink-0">
                <Hash size={18} className="text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{ch.displayName}</p>
                {ch.description && <p className="text-xs text-gray-500 truncate">{ch.description}</p>}
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Users size={11} /> {ch.memberCount || 0} members
                </p>
              </div>
              <button onClick={() => handleDelete(ch._id)} className="text-gray-300 hover:text-red-400 transition p-1.5 rounded">
                <Trash2 size={15} />
              </button>
            </Card>
          ))}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Channel" width="max-w-sm"
        footer={<><Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button><Button loading={saving} onClick={handleCreate}>Create</Button></>}>
        <div className="space-y-4">
          <Input label="Channel Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. general, clinical, admin" autoFocus />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="What is this channel for?" />
        </div>
      </Modal>
    </div>
  );
}
