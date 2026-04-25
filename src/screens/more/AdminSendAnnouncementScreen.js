import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../components/common/CustomAlert';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { formatTimestamp } from '../../utils/dateHelpers';

const PRIORITIES = [
  { key: 'normal', label: 'Normal', icon: 'bell', color: colors.navyBlue },
  { key: 'urgent', label: 'Urgent', icon: 'alert-circle', color: colors.warning },
  { key: 'critical', label: 'Critical', icon: 'alert-triangle', color: colors.error },
];

const AUDIENCES = [
  { key: 'all', label: 'All Staff' },
  { key: 'admin', label: 'Admins Only' },
  { key: 'moderator', label: 'Moderators & Admins' },
  { key: 'member', label: 'Members Only' },
];

const EXPIRY_OPTIONS = [
  { key: null, label: 'Never expires' },
  { key: 1, label: '1 day' },
  { key: 3, label: '3 days' },
  { key: 7, label: '1 week' },
  { key: 14, label: '2 weeks' },
  { key: 30, label: '1 month' },
];

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const PRIORITY_CONFIG = {
  normal: { color: colors.navyBlue, icon: 'bell' },
  urgent: { color: colors.warning, icon: 'alert-circle' },
  critical: { color: colors.error, icon: 'alert-triangle' },
};

export default function AdminSendAnnouncementScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const alert = useAlert();
  const announcements = useQuery(api.announcements.listAnnouncements) || [];
  const createAnnouncement = useMutation(api.announcements.createAnnouncement);
  const deleteAnnouncement = useMutation(api.announcements.deleteAnnouncement);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [audience, setAudience] = useState('all');
  const [expiryDays, setExpiryDays] = useState(null);
  const [isPinned, setIsPinned] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const resetForm = () => {
    setTitle(''); setBody(''); setPriority('normal');
    setAudience('all'); setExpiryDays(null); setIsPinned(false); setAttachments([]);
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'text/csv', 'application/zip'],
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const newFiles = result.assets.map(a => ({
          name: a.name,
          fileType: a.name.split('.').pop()?.toLowerCase() || 'file',
          size: a.size || 0,
          uri: a.uri,
        }));
        setAttachments([...attachments, ...newFiles]);
      }
    } catch {
      alert({ type: 'error', title: 'Error', message: 'Could not pick document.' });
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Please fill in both title and message.' });
      return;
    }
    setIsSending(true);
    try {
      const expiresAt = expiryDays ? Date.now() + expiryDays * 24 * 60 * 60 * 1000 : undefined;
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        author: currentAccount?.userId || 'admin',
        authorName: currentAccount?.displayName || currentAccount?.email || 'Admin',
        priority,
        audience,
        expiresAt,
        isPinned,
        attachments: attachments.map(a => ({ name: a.name, fileType: a.fileType, size: a.size })),
      });
      alert({ type: 'success', title: 'Announcement Sent', message: `"${title.trim()}" sent to ${AUDIENCES.find(a => a.key === audience)?.label || 'all staff'}.` });
      resetForm();
      setShowCreate(false);
    } catch {
      alert({ type: 'error', title: 'Error', message: 'Failed to send announcement.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = (ann) => {
    alert({
      type: 'warning',
      title: 'Delete Announcement',
      message: `Delete "${ann.title}"? This cannot be undone.`,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteAnnouncement({ announcementId: ann._id });
          } catch {
            alert({ type: 'error', title: 'Error', message: 'Could not delete announcement.' });
          }
        }},
      ],
    });
  };

  const isValid = title.trim() && body.trim();

  const renderAnnouncement = ({ item }) => {
    const cfg = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
    return (
      <View style={styles.annCard}>
        <View style={styles.annHeader}>
          <View style={[styles.priorityDot, { backgroundColor: cfg.color }]} />
          <AppText variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>{item.title}</AppText>
          <Pressable onPress={() => handleDelete(item)} hitSlop={8} style={styles.deleteBtn}>
            <Feather name="trash-2" size={16} color={colors.error} />
          </Pressable>
        </View>
        <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>{item.body}</AppText>
        <View style={styles.annMeta}>
          <View style={[styles.priorityBadge, { backgroundColor: cfg.color + '18' }]}>
            <Feather name={cfg.icon} size={11} color={cfg.color} />
            <AppText variant="small" color={cfg.color} style={{ marginLeft: 3, textTransform: 'capitalize' }}>{item.priority}</AppText>
          </View>
          {item.isPinned && (
            <View style={styles.pinnedBadge}>
              <Feather name="bookmark" size={11} color={colors.navyBlue} />
              <AppText variant="small" color={colors.navyBlue} style={{ marginLeft: 3 }}>Pinned</AppText>
            </View>
          )}
          <AppText variant="small" color={colors.mediumGrey} style={{ marginLeft: 'auto' }}>
            {formatTimestamp(item.createdAt)}
          </AppText>
        </View>
        {item.attachments?.length > 0 && (
          <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
            <Feather name="paperclip" size={11} /> {item.attachments.length} attachment{item.attachments.length > 1 ? 's' : ''}
          </AppText>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Announcements</AppText>
        <Pressable onPress={() => setShowCreate(true)} style={styles.newBtn}>
          <Feather name="plus" size={18} color={colors.white} />
          <AppText variant="caption" color={colors.white} style={{ marginLeft: 4 }}>New</AppText>
        </Pressable>
      </View>

      {announcements === undefined ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={[...announcements].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          renderItem={renderAnnouncement}
          ListHeaderComponent={
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.md }}>
              {announcements.length} announcement{announcements.length !== 1 ? 's' : ''} sent
            </AppText>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="bell-off" size={44} color={colors.lightGrey} />
              <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>No announcements yet</AppText>
              <AppText variant="caption" color={colors.mediumGrey}>Tap New to send your first announcement</AppText>
            </View>
          }
        />
      )}

      {/* Create Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.header}>
            <Pressable onPress={() => { setShowCreate(false); resetForm(); }} hitSlop={12}>
              <AppText variant="body" color={colors.navyBlue}>Cancel</AppText>
            </Pressable>
            <AppText variant="h3">New Announcement</AppText>
            <View style={{ width: 60 }} />
          </View>

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <AppText variant="caption" color={colors.darkGrey} style={styles.label}>TITLE</AppText>
              <TextInput style={styles.input} placeholder="e.g. New Safety Protocols" placeholderTextColor={colors.lightGrey} value={title} onChangeText={setTitle} />
            </View>

            {/* Body */}
            <View style={styles.inputGroup}>
              <AppText variant="caption" color={colors.darkGrey} style={styles.label}>MESSAGE BODY</AppText>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Type your announcement here..." placeholderTextColor={colors.lightGrey} multiline textAlignVertical="top" value={body} onChangeText={setBody} />
            </View>

            {/* Priority */}
            <AppText variant="caption" color={colors.darkGrey} style={styles.label}>PRIORITY</AppText>
            <View style={styles.optionRow}>
              {PRIORITIES.map(p => (
                <Pressable key={p.key} style={[styles.chip, priority === p.key && { borderColor: p.color, backgroundColor: p.color + '14' }]} onPress={() => setPriority(p.key)}>
                  <Feather name={p.icon} size={14} color={priority === p.key ? p.color : colors.mediumGrey} />
                  <AppText variant="small" color={priority === p.key ? p.color : colors.darkGrey} style={{ marginLeft: 4 }}>{p.label}</AppText>
                </Pressable>
              ))}
            </View>

            {/* Audience */}
            <AppText variant="caption" color={colors.darkGrey} style={[styles.label, { marginTop: spacing.lg }]}>AUDIENCE</AppText>
            <View style={styles.optionRow}>
              {AUDIENCES.map(a => (
                <Pressable key={a.key} style={[styles.chip, audience === a.key && styles.chipActive]} onPress={() => setAudience(a.key)}>
                  <AppText variant="small" color={audience === a.key ? colors.navyBlue : colors.darkGrey}>{a.label}</AppText>
                </Pressable>
              ))}
            </View>

            {/* Expiry */}
            <AppText variant="caption" color={colors.darkGrey} style={[styles.label, { marginTop: spacing.lg }]}>EXPIRES AFTER</AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              <View style={styles.optionRow}>
                {EXPIRY_OPTIONS.map(e => (
                  <Pressable key={String(e.key)} style={[styles.chip, expiryDays === e.key && styles.chipActive]} onPress={() => setExpiryDays(e.key)}>
                    <AppText variant="small" color={expiryDays === e.key ? colors.navyBlue : colors.darkGrey}>{e.label}</AppText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Pin */}
            <Pressable style={[styles.pinRow, isPinned && styles.pinRowActive]} onPress={() => setIsPinned(!isPinned)}>
              <Feather name="bookmark" size={18} color={isPinned ? colors.navyBlue : colors.mediumGrey} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <AppText variant="bodyBold" color={isPinned ? colors.navyBlue : colors.black}>Pin to Dashboard</AppText>
                <AppText variant="caption" color={colors.mediumGrey}>Keep visible at the top of the home screen</AppText>
              </View>
              <View style={[styles.toggle, isPinned && styles.toggleOn]}>
                <View style={[styles.toggleDot, isPinned && styles.toggleDotOn]} />
              </View>
            </Pressable>

            {/* Attachments */}
            <AppText variant="caption" color={colors.darkGrey} style={[styles.label, { marginTop: spacing.lg }]}>ATTACHMENTS</AppText>
            {attachments.map((file, i) => (
              <View key={i} style={styles.fileRow}>
                <Feather name="file" size={18} color={colors.navyBlue} />
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <AppText variant="body" numberOfLines={1}>{file.name}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>{formatFileSize(file.size)}</AppText>
                </View>
                <Pressable onPress={() => removeAttachment(i)} hitSlop={8}><Feather name="x" size={18} color={colors.error} /></Pressable>
              </View>
            ))}
            <Pressable style={styles.attachmentBox} onPress={handlePickDocument}>
              <Feather name="paperclip" size={20} color={colors.navyBlue} />
              <AppText variant="body" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Attach Document</AppText>
            </Pressable>
            <AppText variant="small" color={colors.mediumGrey} style={{ textAlign: 'center', marginTop: spacing.xs }}>PDF, Word, Excel, Images, CSV, ZIP</AppText>

            <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxxl }}>
              <Button label={isSending ? 'Sending...' : 'Send Announcement'} onPress={handleSend} disabled={!isValid || isSending} />
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  newBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navyBlue, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  list: { padding: spacing.base, paddingBottom: 100 },
  annCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, ...shadows.subtle },
  annHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  deleteBtn: { padding: spacing.xs },
  annMeta: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm, flexWrap: 'wrap' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navyLight, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  empty: { alignItems: 'center', paddingTop: 80 },
  content: { padding: spacing.xl },
  inputGroup: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.sm, marginLeft: spacing.xs, letterSpacing: 1 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGrey, borderRadius: radius.lg, padding: spacing.base, fontSize: 16, color: colors.black },
  textArea: { height: 140, minHeight: 140 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.lightGrey, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center' },
  chipActive: { borderColor: colors.navyBlue, backgroundColor: colors.navyLight },
  pinRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGrey },
  pinRowActive: { borderColor: colors.navyBlue, backgroundColor: colors.navyLight },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.lightGrey, justifyContent: 'center', padding: 2 },
  toggleOn: { backgroundColor: colors.navyBlue },
  toggleDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white },
  toggleDotOn: { alignSelf: 'flex-end' },
  fileRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lightGrey, marginBottom: spacing.sm },
  attachmentBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.navyBlue, borderStyle: 'dashed', borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xs },
});
