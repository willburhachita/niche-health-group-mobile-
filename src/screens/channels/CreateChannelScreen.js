import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

const CHANNEL_TYPES = ['Public', 'Private'];

export default function CreateChannelScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const allUsers = useQuery(api.users.listUsers) || [];
  const staff = allUsers.filter(u => u.externalId !== currentUserId);
  const createChannel = useMutation(api.channels.createChannel);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Public');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const toggleMember = (id) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    const members = [currentUserId, ...selectedMembers];
    const channelId = await createChannel({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      displayName: name.trim(),
      description: description.trim() || undefined,
      type: type.toLowerCase(),
      members,
      admins: [currentUserId],
    });
    navigation.replace('ChannelThread', { channelId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
        <AppText variant="h3">Create Channel</AppText>
        <Pressable onPress={handleCreate} disabled={!name.trim()}>
          <AppText variant="bodyBold" color={name.trim() ? colors.navyBlue : colors.mediumGrey}>Create</AppText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Channel Name" value={name} onChangeText={setName} placeholder="e.g. pharmacy-updates" icon="hash" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What is this channel about?" multiline icon="align-left" />

        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Type</AppText>
        <View style={styles.typeRow}>
          {CHANNEL_TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.typeOption, type === t && styles.typeOptionActive]}>
              <Feather name={t === 'Private' ? 'lock' : 'hash'} size={16} color={type === t ? colors.white : colors.navyBlue} />
              <View style={{ marginLeft: spacing.sm }}>
                <AppText variant="bodyBold" color={type === t ? colors.white : colors.black}>{t}</AppText>
                <AppText variant="small" color={type === t ? 'rgba(255,255,255,0.8)' : colors.mediumGrey}>
                  {t === 'Public' ? 'Anyone can find and join' : 'Invite only'}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>

        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Add Members</AppText>
        <View style={styles.membersList}>
          {staff.map(u => {
            const uid = u.externalId;
            const selected = selectedMembers.includes(uid);
            return (
              <Pressable key={uid} onPress={() => toggleMember(uid)} style={styles.memberRow}>
                <Avatar name={u.displayName} size={32} />
                <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{u.displayName}</AppText>
                <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                  {selected && <Feather name="check" size={14} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  label: { marginBottom: spacing.sm, marginTop: spacing.md },
  typeRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  typeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: spacing.base, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.lightGrey,
    backgroundColor: colors.white,
  },
  typeOptionActive: { backgroundColor: colors.navyBlue, borderColor: colors.navyBlue },
  membersList: { marginTop: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lightGrey, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.navyBlue, borderColor: colors.navyBlue },
});
