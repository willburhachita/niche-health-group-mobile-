import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
import { Input } from '../../components/common/Input';

const TYPE_OPTIONS = [
  { key: 'public', icon: 'globe', label: 'Public', desc: 'Anyone can join' },
  { key: 'private', icon: 'lock', label: 'Private', desc: 'Invite only' },
];

export default function AdminManageChannelsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const alert = useAlert();
  const channels = useQuery(api.channels.listChannels) || [];
  const createChannel = useMutation(api.channels.createChannel);
  const updateChannel = useMutation(api.channels.updateChannel);
  const deleteChannelMut = useMutation(api.channels.deleteChannel);
  const allUsers = useQuery(api.users.listUsers) || [];

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('public');

  const resetForm = () => { setName(''); setDescription(''); setType('public'); };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Channel name is required.' });
      return;
    }
    try {
      await createChannel({
        name: name.trim().toLowerCase().replace(/\s+/g, '-'),
        displayName: name.trim(),
        description: description.trim() || undefined,
        type,
        members: allUsers.map(u => u.externalId),
        admins: [currentAccount?.userId || 'admin'],
        createdBy: currentAccount?.userId || 'admin',
      });
      setShowCreate(false);
      resetForm();
      alert({ type: 'success', title: 'Channel Created', message: `#${name.trim()} has been created.` });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to create channel.' });
    }
  };

  const openEdit = (channel) => {
    setName(channel.displayName);
    setDescription(channel.description || '');
    setType(channel.type);
    setShowEdit(channel);
  };

  const handleUpdate = async () => {
    if (!showEdit) return;
    try {
      await updateChannel({
        channelId: showEdit._id,
        displayName: name.trim(),
        description: description.trim() || undefined,
        type,
        updatedBy: currentAccount?.userId || 'admin',
      });
      setShowEdit(null);
      resetForm();
      alert({ type: 'success', title: 'Updated', message: `Channel has been updated.` });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to update channel.' });
    }
  };

  const handleDelete = (channel) => {
    alert({
      type: 'error',
      title: 'Delete Channel',
      message: `Permanently delete #${channel.displayName} and all its messages? This cannot be undone.`,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChannelMut({ channelId: channel._id, deletedBy: currentAccount?.userId || 'admin' });
              alert({ type: 'success', title: 'Deleted', message: `#${channel.displayName} has been deleted.` });
            } catch (e) {
              alert({ type: 'error', title: 'Error', message: 'Failed to delete channel.' });
            }
          },
        },
      ],
    });
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: item.type === 'private' ? colors.warning + '20' : colors.navyLight }]}>
          <Feather name={item.type === 'private' ? 'lock' : 'hash'} size={20} color={item.type === 'private' ? colors.warning : colors.navyBlue} />
        </View>
        <View style={styles.info}>
          <AppText variant="bodyBold">#{item.displayName}</AppText>
          <AppText variant="caption" color={colors.mediumGrey}>{item.memberCount} members • {item.type}</AppText>
          {item.description ? <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{item.description}</AppText> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Feather name="edit-2" size={15} color={colors.navyBlue} />
          <AppText variant="small" color={colors.navyBlue} style={{ marginLeft: 4 }}>Edit</AppText>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
          <Feather name="trash-2" size={15} color={colors.error} />
          <AppText variant="small" color={colors.error} style={{ marginLeft: 4 }}>Delete</AppText>
        </Pressable>
      </View>
    </View>
  );

  const renderModal = (visible, onClose, onSave, title) => (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2">{title}</AppText>
            <Pressable onPress={() => { onClose(); resetForm(); }} hitSlop={8}><Feather name="x" size={24} color={colors.black} /></Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Input label="Channel Name" value={name} onChangeText={setName} placeholder="e.g. dialysis-team" />

            <Input label="Description (optional)" value={description} onChangeText={setDescription} placeholder="What is this channel about?" />

            <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.md, marginBottom: spacing.sm, letterSpacing: 1 }}>VISIBILITY</AppText>
            {TYPE_OPTIONS.map(opt => (
              <Pressable key={opt.key} style={[styles.typeOption, type === opt.key && styles.typeOptionActive]} onPress={() => setType(opt.key)}>
                <View style={[styles.typeIcon, { backgroundColor: type === opt.key ? colors.navyBlue : colors.offWhite }]}>
                  <Feather name={opt.icon} size={18} color={type === opt.key ? colors.white : colors.darkGrey} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{opt.label}</AppText>
                  <AppText variant="caption" color={colors.mediumGrey}>{opt.desc}</AppText>
                </View>
                <View style={[styles.radio, type === opt.key && styles.radioActive]}>
                  {type === opt.key && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}

            <View style={{ marginTop: spacing.xl }}>
              <Button label={title === 'New Channel' ? 'Create Channel' : 'Save Changes'} onPress={onSave} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Manage Channels</AppText>
        <Pressable onPress={() => setShowCreate(true)} hitSlop={12}><Feather name="plus" size={24} color={colors.navyBlue} /></Pressable>
      </View>

      <FlatList
        data={channels}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.md }}>{channels.length} channels</AppText>
        }
        ListEmptyComponent={
          <View style={{ padding: spacing.xxxl, alignItems: 'center' }}>
            <Feather name="hash" size={40} color={colors.lightGrey} />
            <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>No channels yet</AppText>
          </View>
        }
      />

      {renderModal(showCreate, () => setShowCreate(false), handleCreate, 'New Channel')}
      {renderModal(!!showEdit, () => setShowEdit(null), handleUpdate, 'Edit Channel')}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  list: { padding: spacing.base, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.sm, ...shadows.subtle, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  info: { flex: 1 },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.lightGrey },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  typeOption: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.lightGrey, marginBottom: spacing.sm },
  typeOptionActive: { borderColor: colors.navyBlue, backgroundColor: colors.navyLight },
  typeIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.lightGrey, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.navyBlue },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.navyBlue },
});
