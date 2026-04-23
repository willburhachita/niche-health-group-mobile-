import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';

const FILTERS = ['Active', 'Archived', 'All'];

export default function StaffDirectoryScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const alert = useAlert();
  const currentUserId = currentAccount?.userId;
  const staffAccounts = useQuery(api.auth.getAllStaffAccounts) || [];
  const allUsers = useQuery(api.users.listUsers);
  const deactivate = useMutation(api.auth.deactivateStaffAccount);
  const reactivate = useMutation(api.auth.reactivateStaffAccount);
  const deleteAccount = useMutation(api.auth.deleteStaffAccount);
  const [filter, setFilter] = useState('Active');
  const [search, setSearch] = useState('');

  // Merge accounts with user profiles
  const merged = staffAccounts
    .filter(a => a.userId !== currentUserId)
    .map(account => {
      const profile = (allUsers || []).find(u => u.externalId === account.userId);
      return { ...account, profile };
    });

  let filtered = merged;
  if (filter === 'Active') filtered = merged.filter(a => a.isActive);
  if (filter === 'Archived') filtered = merged.filter(a => !a.isActive);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(a =>
      (a.displayName || '').toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.profile?.displayName || '').toLowerCase().includes(q)
    );
  }

  const handleArchive = (account) => {
    alert({
      type: 'warning',
      title: 'Archive Staff',
      message: `Are you sure you want to archive ${account.displayName || account.email}? They will lose access to the app.`,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivate({ accountId: account._id, adminId: currentAccount?.userId || 'admin' });
              alert({ type: 'success', title: 'Archived', message: `${account.displayName || account.email} has been archived.` });
            } catch (e) {
              alert({ type: 'error', title: 'Error', message: 'Failed to archive staff member.' });
            }
          },
        },
      ],
    });
  };

  const handleReactivate = async (account) => {
    try {
      await reactivate({ accountId: account._id, adminId: currentAccount?.userId || 'admin' });
      alert({ type: 'success', title: 'Reactivated', message: `${account.displayName || account.email} has been reactivated.` });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to reactivate staff member.' });
    }
  };

  const handleDelete = (account) => {
    alert({
      type: 'error',
      title: 'Delete Staff Permanently',
      message: `This will permanently delete ${account.displayName || account.email} and all their data. This cannot be undone.`,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount({ accountId: account._id, adminId: currentAccount?.userId || 'admin' });
              alert({ type: 'success', title: 'Deleted', message: 'Staff account has been permanently deleted.' });
            } catch (e) {
              alert({ type: 'error', title: 'Error', message: 'Failed to delete staff member.' });
            }
          },
        },
      ],
    });
  };

  const renderItem = ({ item }) => {
    const name = item.profile?.displayName || item.displayName || item.email;
    const dept = item.profile?.department || item.role;
    return (
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => item.profile && navigation.navigate('StaffProfile', { userId: item.userId })}
        >
          <Avatar name={name} size={44} showOnline={item.isActive} onlineStatus={item.isActive ? (item.profile?.onlineStatus || 'offline') : 'offline'} />
          <View style={styles.info}>
            <AppText variant="bodyBold" style={{ opacity: item.isActive ? 1 : 0.5 }}>{name}</AppText>
            <AppText variant="caption" color={colors.mediumGrey}>{item.email}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>{dept} • {item.role}</AppText>
          </View>
          {!item.isActive && (
            <View style={styles.archivedBadge}>
              <AppText variant="small" color={colors.warning}>Archived</AppText>
            </View>
          )}
        </Pressable>
        <View style={styles.actions}>
          {item.isActive ? (
            <Pressable style={styles.actionBtn} onPress={() => handleArchive(item)}>
              <Feather name="archive" size={16} color={colors.warning} />
              <AppText variant="small" color={colors.warning} style={{ marginLeft: 4 }}>Archive</AppText>
            </Pressable>
          ) : (
            <Pressable style={styles.actionBtn} onPress={() => handleReactivate(item)}>
              <Feather name="refresh-cw" size={16} color={colors.success} />
              <AppText variant="small" color={colors.success} style={{ marginLeft: 4 }}>Reactivate</AppText>
            </Pressable>
          )}
          <Pressable style={styles.actionBtn} onPress={() => handleDelete(item)}>
            <Feather name="trash-2" size={16} color={colors.error} />
            <AppText variant="small" color={colors.error} style={{ marginLeft: 4 }}>Delete</AppText>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Manage Staff</AppText>
        <Pressable onPress={() => navigation.navigate('AdminAddStaff')} hitSlop={12}><Feather name="user-plus" size={22} color={colors.navyBlue} /></Pressable>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or email..." />

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
            <AppText variant="caption" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
        <AppText variant="caption" color={colors.mediumGrey} style={{ marginLeft: 'auto' }}>
          {filtered.length} staff
        </AppText>
      </View>

      {!allUsers ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={{ padding: spacing.xxxl, alignItems: 'center' }}>
              <Feather name="users" size={40} color={colors.lightGrey} />
              <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>No staff found</AppText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  filters: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2, borderRadius: radius.full, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.navyBlue },
  list: { padding: spacing.base, paddingBottom: 100 },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, marginBottom: spacing.sm, ...shadows.subtle, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.base },
  pressed: { backgroundColor: colors.offWhite },
  info: { flex: 1, marginLeft: spacing.md },
  archivedBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.warning + '14' },
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.lightGrey },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
});
