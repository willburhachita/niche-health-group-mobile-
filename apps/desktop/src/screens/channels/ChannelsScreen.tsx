import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Send, Hash, Users, Pin, Paperclip, X, FileText, Download, MapPin, ExternalLink } from 'lucide-react';
import { Avatar, EmptyState, Spinner } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

function parseCoords(content: string): { lat: number; lng: number } | null {
  const m = content.trim().match(/^(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function ChannelBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
  const bubbleBase = isMe
    ? 'bg-navy text-white rounded-br-sm'
    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm';
  const timeClass = isMe ? 'text-white/60' : 'text-gray-400';
  const time = msg.sentAt ? format(new Date(msg.sentAt), 'HH:mm') : '';

  // Image — no redundant caption
  if (msg.type === 'image' && msg.fileUrl) {
    return (
      <div className={`max-w-xs rounded-2xl overflow-hidden ${bubbleBase}`}>
        {msg.isPinned && <div className="flex items-center gap-1 text-xs px-3 pt-2 text-amber-400"><Pin size={10} /> Pinned</div>}
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
          <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="w-full max-h-52 object-cover hover:opacity-90 transition cursor-pointer" />
        </a>
        <p className={`text-xs px-3 pb-2 pt-1 ${timeClass}`}>{time}</p>
      </div>
    );
  }

  // File / voice
  if ((msg.type === 'file' || msg.type === 'voice') && msg.fileUrl) {
    return (
      <div className={`max-w-xs rounded-2xl px-4 py-3 ${bubbleBase}`}>
        {msg.isPinned && <div className="flex items-center gap-1 text-xs mb-1 text-amber-400"><Pin size={10} /> Pinned</div>}
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName}
          className={`flex items-center gap-3 rounded-lg p-2 transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'}`}>
          <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-navy/10'}`}>
            <FileText size={16} className={isMe ? 'text-white' : 'text-navy'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
            <p className={`text-xs ${timeClass}`}>Download</p>
          </div>
          <Download size={13} className={isMe ? 'text-white/70' : 'text-gray-400'} />
        </a>
        <p className={`text-xs mt-1 ${timeClass}`}>{time}</p>
      </div>
    );
  }

  // Location map card
  const coords = parseCoords(msg.content || '');
  if (coords) {
    const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const osmThumb = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=280x140&markers=${coords.lat},${coords.lng},red`;
    return (
      <div className={`max-w-xs rounded-2xl overflow-hidden ${bubbleBase}`}>
        {msg.isPinned && <div className="flex items-center gap-1 text-xs px-3 pt-2 text-amber-400"><Pin size={10} /> Pinned</div>}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img src={osmThumb} alt="Location" className="w-full max-h-36 object-cover hover:opacity-90 transition"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </a>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2 transition ${isMe ? 'hover:bg-white/10' : 'hover:bg-gray-50'}`}>
          <MapPin size={14} className={isMe ? 'text-white/80' : 'text-navy'} />
          <span className="text-sm font-medium flex-1">View Location</span>
          <ExternalLink size={12} className={isMe ? 'text-white/50' : 'text-gray-400'} />
        </a>
        <p className={`text-xs px-3 pb-2 ${timeClass}`}>{time}</p>
      </div>
    );
  }

  // Plain text
  return (
    <div className={`max-w-md rounded-2xl px-4 py-2.5 ${bubbleBase}`}>
      {msg.isPinned && <div className="flex items-center gap-1 text-xs mb-1 text-amber-400"><Pin size={10} /> Pinned</div>}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      <p className={`text-xs mt-1 ${timeClass}`}>{time}</p>
    </div>
  );
}

export default function ChannelsScreen() {
  const { account, session } = useAuth();
  const [selected, setSelected] = useState<any>(null);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const channels = useQuery(api.channels.listChannels);
  const messages = useQuery(
    api.channels.getChannelMessages,
    selected ? { channelId: selected._id } : 'skip'
  );
  const sendMsg = useMutation(api.channels.sendChannelMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const uploadFile = async (file: File) => {
    const uploadUrl = await generateUploadUrl({});
    const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
    if (!res.ok) throw new Error('Upload failed');
    const { storageId } = await res.json();
    return { storageId, type: file.type.startsWith('image/') ? 'image' : 'file' };
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || !selected) return;
    setUploading(true);
    try {
      const senderId = account?.userId || '';
      if (attachments.length > 0) {
        for (const file of attachments) {
          const { storageId, type } = await uploadFile(file);
          await sendMsg({ channelId: selected._id, senderId, content: text.trim() || file.name, type, fileUrl: storageId, fileName: file.name });
        }
        setAttachments([]);
        if (text.trim()) setText('');
      } else {
        const msg = text.trim(); setText('');
        await sendMsg({ channelId: selected._id, senderId, content: msg, type: 'text' });
      }
    } catch (e) { console.error('Send failed:', e); }
    finally { setUploading(false); }
  };

  const canSend = (text.trim() || attachments.length > 0) && !uploading;

  return (
    <div className="flex h-full">
      {/* Channel list */}
      <div className="w-64 flex flex-col border-r border-gray-100 bg-white shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Channels</p>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
          {!channels ? <div className="flex justify-center py-10"><Spinner /></div>
            : channels.length === 0 ? <EmptyState icon={<Hash size={28} />} title="No channels yet" />
              : channels.map((ch: any) => (
                <button key={ch._id} onClick={() => setSelected(ch)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition text-left ${selected?._id === ch._id ? 'bg-navy/5 border-l-2 border-l-navy' : ''}`}>
                  <Hash size={15} className={selected?._id === ch._id ? 'text-navy' : 'text-gray-400'} />
                  <span className={`text-sm truncate ${selected?._id === ch._id ? 'font-semibold text-navy' : 'text-gray-700'}`}>{ch.displayName}</span>
                  {ch.memberCount && (
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-0.5"><Users size={10} />{ch.memberCount}</span>
                  )}
                </button>
              ))}
        </div>
      </div>

      {/* Thread pane */}
      <div className="flex-1 flex flex-col bg-white">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center"><Hash size={40} className="mx-auto mb-2 text-gray-200" /><p className="text-sm text-gray-400">Select a channel</p></div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <Hash size={16} className="text-navy" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.displayName}</p>
                {selected.description && <p className="text-xs text-gray-400">{selected.description}</p>}
              </div>
              {selected.memberCount && (
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <Users size={12} /> {selected.memberCount} members
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-surface">
              {!messages ? <div className="flex justify-center py-10"><Spinner /></div>
                : messages.length === 0 ? <EmptyState icon={<Hash size={28} />} title="No messages yet" description="Be the first to post" />
                  : messages.map((msg: any) => {
                      const isMe =
                        (!!account?.userId && msg.senderId === account.userId) ||
                        (!!account?.email && msg.senderId === account.email) ||
                        (!!account?._id && msg.senderId === account._id);
                      return (
                        <div key={msg._id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Avatar name={msg.senderName || msg.senderId || '?'} size="sm" />
                          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            {!isMe && <p className="text-xs font-semibold text-gray-500 mb-1">{msg.senderName || msg.senderId}</p>}
                            <ChannelBubble msg={msg} isMe={isMe} />
                          </div>
                        </div>
                      );
                    })}
              <div ref={bottomRef} />
            </div>

            {/* Attachment preview strip */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-2 bg-gray-50">
                {attachments.map((f, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-700 max-w-[120px] truncate">{f.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={e => { setAttachments(p => [...p, ...Array.from(e.target.files || [])]); e.target.value = ''; }}
                className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-xl transition" title="Attach file">
                <Paperclip size={18} />
              </button>
              <input
                value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), canSend && handleSend())}
                placeholder={attachments.length > 0 ? 'Add a caption...' : `Message #${selected.displayName}`}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition"
              />
              <button onClick={handleSend} disabled={!canSend}
                className="p-2.5 bg-navy text-white rounded-xl hover:bg-navy/90 transition disabled:opacity-40 flex items-center justify-center min-w-[38px]">
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send size={16} />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
