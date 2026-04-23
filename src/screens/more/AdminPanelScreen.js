import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Badge } from '../../components/common/Badge';
import { Divider } from '../../components/common/Divider';
import { useAlert } from '../../components/common/CustomAlert';

export default function AdminPanelScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const deviceRequests = useQuery(api.auth.listDeviceRequests) || [];
  const staffAccounts = useQuery(api.auth.getAllStaffAccounts) || [];
  const channels = useQuery(api.channels.listChannels) || [];
  const approveRequest = useMutation(api.auth.approveDeviceRequest);
  const rejectRequest = useMutation(api.auth.rejectDeviceRequest);

  const alert = useAlert();
  const announcements = useQuery(api.announcements.listAnnouncements) || [];
  const pendingDevices = deviceRequests.filter(d => d.status === 'pending');
  const activeStaff = staffAccounts.filter(a => a.isActive).length;

  const STATS = [
    { label: 'Active Staff', count: activeStaff, icon: 'users', color: colors.success },
    { label: 'Pending Devices', count: pendingDevices.length, icon: 'smartphone', color: colors.warning },
    { label: 'Channels', count: channels.length, icon: 'hash', color: colors.navyBlue },
    { label: 'Announcements', count: announcements.length, icon: 'bell', color: colors.peach },
  ];

  const MANAGE = [
    { icon: 'user-plus', label: 'Add Staff', sub: 'Create new staff account', screen: 'AdminAddStaff' },
    { icon: 'lock', label: 'Staff Credentials', sub: 'View login details for all staff', screen: 'AdminStaffCredentials' },
    { icon: 'users', label: 'Manage Staff', sub: `${activeStaff} active`, screen: 'StaffDirectory' },
    { icon: 'smartphone', label: 'Device Approvals', sub: `${pendingDevices.length} pending`, screen: 'AdminDeviceApprovals' },
    { icon: 'hash', label: 'Manage Channels', sub: `${channels.length} channels`, screen: 'AdminManageChannels' },
    { icon: 'bell', label: 'Announcements', sub: `${announcements.length} sent`, screen: 'AdminSendAnnouncement' },
    { icon: 'clipboard', label: 'Activity Logs', sub: 'View admin audit trail', screen: 'AdminActivityLogs' },
    { icon: 'database', label: 'System Analytics', sub: 'All services operational', screen: 'AdminSystemAnalytics' },
  ];

  const handleQuickApprove = async (requestId) => {
    try {
      await approveRequest({ requestId, adminId: currentAccount?.userId || 'admin' });
      alert({ type: 'success', title: 'Device Approved', message: 'Device has been approved.' });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to approve device.' });
    }
  };

  const handleQuickReject = async (requestId) => {
    try {
      await rejectRequest({ requestId, adminId: currentAccount?.userId || 'admin' });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to reject device.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Admin Panel</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Feather name={s.icon} size={22} color={s.color} />
              <AppText variant="h1" style={styles.statCount}>{s.count}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{s.label}</AppText>
            </View>
          ))}
        </ScrollView>

        {/* Pending Approval — show only if there are pending requests */}
        {pendingDevices.length > 0 && (
          <Pressable 
            style={{ paddingHorizontal: spacing.base }} 
            onPress={() => navigation.navigate('AdminDeviceApprovals')}
          >
            <Card variant="highlighted">
              <View style={styles.pendingRow}>
                <View style={styles.pendingIcon}>
                  <Feather name="alert-circle" size={22} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{pendingDevices.length} Device{pendingDevices.length > 1 ? 's' : ''} Pending Approval</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>
                    {pendingDevices[0]?.deviceName || 'New Device'} ({pendingDevices[0]?.staffName})
                  </AppText>
                </View>
              </View>
              <View style={styles.actionBtns}>
                <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleQuickApprove(pendingDevices[0]._id)}>
                  <Feather name="check" size={16} color={colors.white} />
                  <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.xs }}>Approve</AppText>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleQuickReject(pendingDevices[0]._id)}>
                  <Feather name="x" size={16} color={colors.error} />
                  <AppText variant="bodyBold" color={colors.error} style={{ marginLeft: spacing.xs }}>Reject</AppText>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Manage */}
        <SectionHeader title="Management" />
        {MANAGE.map((item, i) => (
          <View key={item.label}>
            <Pressable style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]} onPress={() => item.screen && navigation.navigate(item.screen)}>
              <View style={styles.menuIcon}><Feather name={item.icon} size={20} color={colors.navyBlue} /></View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{item.label}</AppText>
                <AppText variant="caption" color={colors.mediumGrey}>{item.sub}</AppText>
              </View>
              <Feather name="chevron-right" size={16} color={colors.lightGrey} />
            </Pressable>
            {i < MANAGE.length - 1 && <Divider type="inset" />}
          </View>
        ))}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  statsRow: { paddingHorizontal: spacing.base, paddingVertical: spacing.base, gap: spacing.md },
  statCard: {
    width: 110, padding: spacing.base, borderRadius: radius.lg,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGrey,
    alignItems: 'center', ...shadows.subtle,
  },
  statCount: { marginVertical: spacing.xs },
  pendingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  pendingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warning + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actionBtns: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: radius.full },
  approveBtn: { backgroundColor: colors.navyBlue },
  rejectBtn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.error },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  pressed: { backgroundColor: colors.offWhite },
  menuIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
});
