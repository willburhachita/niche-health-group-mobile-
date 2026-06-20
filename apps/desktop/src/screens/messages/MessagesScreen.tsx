import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Send, MessageSquare, Search, Paperclip, X, FileText, Download, MapPin, ExternalLink, Plus } from 'lucide-react';
import { Input, Avatar, EmptyState, Spinner, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';

function parseCoords(content: string): { lat: number; lng: number } | null {
  const m = content.trim().match(/^(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]), lng = parseFloat(m[2]);
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function AttachmentPreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);
  return (
    <div className="relative inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 mr-2">
      {isImage && preview
        ? <img src={preview} className="w-8 h-8 rounded object-cover" alt={file.name} />
        : <FileText size={18} className="text-gray-500" />}
      <span className="text-xs text-gray-700 max-w-[120px] truncate">{file.name}</span>
      <button onClick={onRemove} className="ml-1 text-gray-400 hover:text-red-500"><X size={12} /></button>
    </div>
  );
}

function MessageBubble({ msg, isMe, isGroup }: { msg: any; isMe: boolean; isGroup?: boolean }) {
  const bubbleBase = isMe
    ? 'bg-navy text-white rounded-br-sm'
    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm shadow-sm';
  const timeClass = isMe ? 'text-white/60' : 'text-gray-400';
  const time = msg.sentAt ? format(new Date(msg.sentAt), 'HH:mm') : '';
  const senderLabel = isMe
    ? (isGroup ? 'You' : null)
    : (msg.senderName || msg.senderId || null);

  // Image — show image only, no redundant caption
  if (msg.type === 'image' && msg.fileUrl) {
    return (
      <div className={`max-w-xs rounded-2xl overflow-hidden ${bubbleBase}`}>
        {!isMe && senderLabel && <p className="text-xs font-semibold px-3 pt-2 text-navy opacity-70">{senderLabel}</p>}
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={msg.fileUrl}
            alt={msg.fileName || 'Image'}
            className="w-full max-h-56 object-cover cursor-pointer hover:opacity-90 transition"
          />
        </a>
        <p className={`text-xs px-3 pb-2 pt-1 ${timeClass}`}>{time}</p>
      </div>
    );
  }

  // File / voice
  if ((msg.type === 'file' || msg.type === 'voice') && msg.fileUrl) {
    return (
      <div className={`max-w-xs rounded-2xl px-4 py-3 ${bubbleBase}`}>
        {!isMe && senderLabel && <p className="text-xs font-semibold mb-1 text-navy opacity-70">{senderLabel}</p>}
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" download={msg.fileName}
          className={`flex items-center gap-3 rounded-lg p-2 transition ${isMe ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-50 hover:bg-gray-100'}`}>
          <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20' : 'bg-navy/10'}`}>
            <FileText size={18} className={isMe ? 'text-white' : 'text-navy'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{msg.fileName || 'File'}</p>
            <p className={`text-xs ${timeClass}`}>Tap to download</p>
          </div>
          <Download size={14} className={isMe ? 'text-white/70' : 'text-gray-400'} />
        </a>
        <p className={`text-xs mt-1 ${timeClass}`}>{time}</p>
      </div>
    );
  }

  // Location — detect lat,lng coordinate content
  const coords = parseCoords(msg.content || '');
  if (coords) {
    const mapsUrl = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;
    const osmThumb = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lng}&zoom=15&size=280x140&markers=${coords.lat},${coords.lng},red`;
    return (
      <div className={`max-w-xs rounded-2xl overflow-hidden ${bubbleBase}`}>
        {!isMe && senderLabel && <p className="text-xs font-semibold px-3 pt-2 text-navy opacity-70">{senderLabel}</p>}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="block">
          <img src={osmThumb} alt="Location map" className="w-full max-h-36 object-cover hover:opacity-90 transition"
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
    <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 ${bubbleBase}`}>
      {!isMe && senderLabel && <p className="text-xs font-semibold mb-1 text-navy opacity-70">{senderLabel}</p>}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      <p className={`text-xs mt-1 ${timeClass}`}>{time}</p>
    </div>
  );
}

export default function MessagesScreen() {
  const { account, session } = useAuth();
  const [selected, setSelected] = useState<any>(null);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [creatingChatId, setCreatingChatId] = useState<string | null>(null);

  const conversations = useQuery(api.messages.listConversations);
  const allUsers = useQuery(api.users.listUsers);
  const messages = useQuery(
    api.messages.getMessages,
    selected ? { conversationId: selected._id, viewerId: account?.userId } : 'skip'
  );
  const sendMessage = useMutation(api.messages.sendMessage);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const createConversation = useMutation(api.messages.createConversation);
  const markRead = useMutation(api.messages.markConversationRead);

  // Mark selected conversation read when opening
  useEffect(() => {
    if (selected?._id && account?.userId) {
      markRead({ conversationId: selected._id, userId: account.userId }).catch(err => {
        console.error('Failed to mark conversation read:', err);
      });
    }
  }, [selected?._id, account?.userId, markRead]);

  // Mark conversation read when new messages arrive
  useEffect(() => {
    if (selected?._id && account?.userId && messages && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== account.userId) {
        markRead({ conversationId: selected._id, userId: account.userId }).catch(err => {
          console.error('Failed to mark conversation read on incoming message:', err);
        });
      }
    }
  }, [messages?.length, selected?._id, account?.userId, markRead]);

  const handleStartChat = async (user: any) => {
    const currentUserId = account?.userId;
    if (!currentUserId) return;
    try {
      setCreatingChatId(user.externalId);
      // Check if conversation already exists in active list
      const existing = (conversations || []).find((c: any) =>
        c.type === 'direct' &&
        c.members.includes(currentUserId) &&
        c.members.includes(user.externalId)
      );

      if (existing) {
        setSelected(existing);
        setIsNewChatOpen(false);
        setUserSearch('');
        return;
      }

      // If not exists, create it
      const newId = await createConversation({
        type: 'direct',
        members: [currentUserId, user.externalId],
      });

      // Construct temp selection so we don't wait for listConversations query to refresh
      setSelected({
        _id: newId,
        type: 'direct',
        members: [currentUserId, user.externalId],
        memberDetails: [
          { id: currentUserId, displayName: account?.displayName || 'You' },
          { id: user.externalId, displayName: user.displayName }
        ]
      });

      setIsNewChatOpen(false);
      setUserSearch('');
    } catch (err) {
      console.error('Failed to create direct conversation:', err);
    } finally {
      setCreatingChatId(null);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filtered = (conversations || []).filter((c: any) => {
    if (!search) return true;
    const names = c.memberDetails?.map((m: any) => m.displayName || '').join(' ').toLowerCase();
    return names.includes(search.toLowerCase());
  });

  const getConvoName = (c: any) => {
    if (c.type === 'group') return c.name || 'Group';
    const currentUserId = account?.userId;
    const other = c.memberDetails?.find((m: any) => m.id !== currentUserId);
    return other?.displayName || c.name || 'Conversation';
  };

  const uploadFile = async (file: File): Promise<{ storageId: string; type: string }> => {
    const uploadUrl = await generateUploadUrl({});
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!res.ok) throw new Error('Upload failed');
    const { storageId } = await res.json();
    const type = file.type.startsWith('image/') ? 'image' : 'file';
    return { storageId, type };
  };

  const handleSend = async () => {
    if ((!text.trim() && attachments.length === 0) || !selected) return;
    setUploading(true);
    try {
      const senderId = account?.userId || '';
      if (attachments.length > 0) {
        for (const file of attachments) {
          const { storageId, type } = await uploadFile(file);
          await sendMessage({
            conversationId: selected._id,
            senderId,
            content: text.trim() || file.name,
            type,
            fileUrl: storageId,
            fileName: file.name,
          });
        }
        setAttachments([]);
        if (text.trim()) setText('');
      } else {
        const msg = text.trim();
        setText('');
        await sendMessage({
          conversationId: selected._id,
          senderId,
          content: msg,
          type: 'text',
        });
      }
    } catch (e: any) {
      console.error('Send failed:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const canSend = (text.trim() || attachments.length > 0) && !uploading;

  return (
    <div className="flex h-full">
      {/* Conversation list */}
      <div className="w-72 flex flex-col border-r border-gray-100 bg-white shrink-0">
        <div className="p-3 border-b border-gray-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">Chats</h2>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="p-1.5 text-navy hover:bg-navy/5 rounded-lg transition"
              title="New Conversation"
            >
              <Plus size={18} />
            </button>
          </div>
          <Input placeholder="Search conversations..." value={search} onChange={e => setSearch(e.target.value)} icon={<Search size={14} />} />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {!conversations
            ? <div className="flex justify-center py-10"><Spinner /></div>
            : filtered.length === 0
              ? <EmptyState icon={<MessageSquare size={28} />} title="No conversations" />
              : filtered.map((c: any) => {
                  const name = getConvoName(c);
                  const isFile = c.lastMessageType === 'file' || c.lastMessageType === 'image';
                  const preview = isFile ? '📎 Attachment' : (c.lastMessage || 'No messages yet');
                  const currentUserId = account?.userId;
                  const hasUnread = currentUserId ? c.unreadBy?.[currentUserId] === true : false;

                  return (
                    <button
                      key={c._id}
                      onClick={() => setSelected(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/80 active:bg-gray-100/50 transition text-left ${
                        selected?._id === c._id ? 'bg-navy/5 border-l-2 border-l-navy' : ''
                      }`}
                    >
                      <Avatar name={name} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={`text-sm ${hasUnread ? 'font-bold text-gray-950' : 'font-medium text-gray-900'} truncate`}>
                            {name}
                          </p>
                          {c.lastMessageAt && (
                            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                              {format(new Date(c.lastMessageAt), 'HH:mm')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs ${hasUnread ? 'font-semibold text-navy/90' : 'text-gray-400'} truncate flex-1`}>
                            {preview}
                          </p>
                          {hasUnread && (
                            <span className="w-2 h-2 bg-peach rounded-full shrink-0 animate-pulse" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
          }
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex-1 flex flex-col bg-white">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">Select a conversation to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
              <Avatar name={getConvoName(selected)} size="sm" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{getConvoName(selected)}</p>
                {selected.type === 'group' && (
                  <p className="text-xs text-gray-400">{selected.members?.length || 0} members</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-surface">
              {!messages
                ? <div className="flex justify-center py-10"><Spinner /></div>
                : messages.length === 0
                  ? <EmptyState icon={<MessageSquare size={28} />} title="No messages yet" description="Send the first message below" />
                  : messages.map((msg: any) => {
                      const isMe =
                        (!!account?.userId && msg.senderId === account.userId) ||
                        (!!account?.email && msg.senderId === account.email) ||
                        (!!account?._id && msg.senderId === account._id);
                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                          {!isMe && <Avatar name={msg.senderName || msg.senderId || '?'} size="sm" />}
                          <MessageBubble msg={msg} isMe={isMe} isGroup={selected?.type === 'group'} />
                        </div>
                      );
                    })
              }
              <div ref={bottomRef} />
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-1 bg-gray-50">
                {attachments.map((f, i) => (
                  <AttachmentPreview key={i} file={f} onRemove={() => setAttachments(prev => prev.filter((_, j) => j !== i))} />
                ))}
              </div>
            )}

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-xl transition"
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), canSend && handleSend())}
                placeholder={attachments.length > 0 ? 'Add a caption (optional)...' : 'Type a message...'}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition"
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="p-2.5 bg-navy text-white rounded-xl hover:bg-navy/90 transition disabled:opacity-40 flex items-center justify-center min-w-[38px]"
              >
                {uploading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send size={16} />
                }
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={isNewChatOpen}
        onClose={() => {
          setIsNewChatOpen(false);
          setUserSearch('');
        }}
        title="New Conversation"
        width="max-w-md"
      >
        <div className="space-y-4">
          <Input
            placeholder="Search staff members..."
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            icon={<Search size={14} />}
            autoFocus
          />
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {!allUsers ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : (
              (() => {
                const filteredUsers = allUsers.filter((u: any) => {
                  if (u.externalId === account?.userId) return false;
                  const name = (u.displayName || `${u.firstName} ${u.lastName}` || '').toLowerCase();
                  const email = (u.email || '').toLowerCase();
                  const query = userSearch.toLowerCase();
                  return name.includes(query) || email.includes(query);
                });

                if (filteredUsers.length === 0) {
                  return <p className="text-sm text-gray-400 text-center py-6">No staff members found</p>;
                }

                return filteredUsers.map((user: any) => {
                  const name = user.displayName || `${user.firstName} ${user.lastName}`;
                  const isOnline = user.onlineStatus === 'online';
                  const initials = name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                  return (
                    <button
                      key={user._id}
                      onClick={() => handleStartChat(user)}
                      disabled={creatingChatId !== null}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-navy/5 active:bg-navy/10 transition text-left disabled:opacity-50"
                    >
                      <div className="relative shrink-0">
                        <div className="flex items-center justify-center rounded-full font-semibold text-white bg-navy h-9 w-9 text-sm">
                          {initials}
                        </div>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.staffRole || user.department || user.email}</p>
                      </div>
                    </button>
                  );
                });
              })()
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
