import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';

export default function AdminSystemAnalyticsScreen({ navigation }) {
  const staffAccounts = useQuery(api.auth.getAllStaffAccounts) || [];
  const channels = useQuery(api.channels.listChannels) || [];
  const conversations = useQuery(api.messages.listConversations) || [];
  const announcements = useQuery(api.announcements.listAnnouncements) || [];
  const activityStats = useQuery(api.activityLogs.getActivityStats);
  const deviceRequests = useQuery(api.auth.listDeviceRequests) || [];

  const activeStaff = staffAccounts.filter(a => a.isActive).length;
  const archivedStaff = staffAccounts.filter(a => !a.isActive).length;
  const totalStaff = staffAccounts.length;
  const pendingDevices = deviceRequests.filter(d => d.status === 'pending').length;
  const approvedDevices = deviceRequests.filter(d => d.status === 'approved').length;
  const publicChannels = channels.filter(c => c.type === 'public').length;
  const privateChannels = channels.filter(c => c.type === 'private').length;
  const directConversations = conversations.filter(c => c.type === 'direct').length;
  const groupConversations = conversations.filter(c => c.type === 'group').length;

  const isLoading = !activityStats;

  const USAGE_STATS = [
    { icon: 'users', color: colors.success, value: activeStaff, label: 'Active Staff' },
    { icon: 'user-x', color: colors.warning, value: archivedStaff, label: 'Archived Staff' },
    { icon: 'hash', color: colors.navyBlue, value: channels.length, label: 'Channels' },
    { icon: 'message-square', color: colors.peach, value: conversations.length, label: 'Conversations' },
    { icon: 'bell', color: colors.navyBlue, value: announcements.length, label: 'Announcements' },
    { icon: 'smartphone', color: colors.warning, value: pendingDevices, label: 'Pending Devices' },
  ];

  const categoryEntries = activityStats?.categories ? Object.entries(activityStats.categories) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">System Analytics</AppText>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroBox}>
            <AppText variant="caption" color={colors.white} style={{ letterSpacing: 2, marginBottom: spacing.sm }}>PLATFORM OVERVIEW</AppText>
            <AppText variant="h1" color={colors.white}>{totalStaff} Staff</AppText>
            <AppText variant="body" color={colors.offWhite} style={{ marginTop: spacing.xs }}>
              {activeStaff} active • {channels.length} channels • {conversations.length} conversations
            </AppText>
          </View>

          {/* Usage Grid */}
          <SectionHeader title="Platform Usage" style={{ paddingHorizontal: 0, marginTop: spacing.lg }} />
          <View style={styles.grid}>
            {USAGE_STATS.map((s, i) => (
              <Card key={i} style={styles.gridCard}>
                <Feather name={s.icon} size={20} color={s.color} />
                <AppText variant="h2" style={styles.gridValue}>{s.value}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{s.label}</AppText>
              </Card>
            ))}
          </View>

          {/* Activity Summary */}
          <SectionHeader title="Activity Summary" style={{ paddingHorizontal: 0, marginTop: spacing.xl }} />
          <Card style={styles.activityCard}>
            <View style={styles.activityRow}>
              <View style={styles.activityStat}>
                <AppText variant="h2" color={colors.navyBlue}>{activityStats?.last24h || 0}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>Last 24h</AppText>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityStat}>
                <AppText variant="h2" color={colors.navyBlue}>{activityStats?.lastWeek || 0}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>Last 7 days</AppText>
              </View>
              <View style={styles.activityDivider} />
              <View style={styles.activityStat}>
                <AppText variant="h2" color={colors.navyBlue}>{activityStats?.total || 0}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>All time</AppText>
              </View>
            </View>
          </Card>

          {/* Category Breakdown */}
          {categoryEntries.length > 0 && (
            <>
              <SectionHeader title="Activity by Category (7 days)" style={{ paddingHorizontal: 0, marginTop: spacing.xl }} />
              {categoryEntries
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const total = activityStats?.lastWeek || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <View key={cat} style={styles.catRow}>
                      <AppText variant="body" style={{ width: 100, textTransform: 'capitalize' }}>{cat}</AppText>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                      <AppText variant="bodyBold" style={{ width: 40, textAlign: 'right' }}>{count}</AppText>
                    </View>
                  );
                })}
            </>
          )}

          {/* Channels Breakdown */}
          <SectionHeader title="Channels Breakdown" style={{ paddingHorizontal: 0, marginTop: spacing.xl }} />
          <Card style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Feather name="globe" size={18} color={colors.navyBlue} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Public Channels</AppText>
              <AppText variant="bodyBold">{publicChannels}</AppText>
            </View>
            <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.lightGrey }]}>
              <Feather name="lock" size={18} color={colors.warning} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Private Channels</AppText>
              <AppText variant="bodyBold">{privateChannels}</AppText>
            </View>
          </Card>

          {/* Messaging Breakdown */}
          <SectionHeader title="Messaging" style={{ paddingHorizontal: 0, marginTop: spacing.xl }} />
          <Card style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Feather name="message-circle" size={18} color={colors.navyBlue} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Direct Messages</AppText>
              <AppText variant="bodyBold">{directConversations}</AppText>
            </View>
            <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.lightGrey }]}>
              <Feather name="users" size={18} color={colors.peach} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Group Chats</AppText>
              <AppText variant="bodyBold">{groupConversations}</AppText>
            </View>
          </Card>

          {/* Device Security */}
          <SectionHeader title="Device Security" style={{ paddingHorizontal: 0, marginTop: spacing.xl }} />
          <Card style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Feather name="check-circle" size={18} color={colors.success} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Approved Devices</AppText>
              <AppText variant="bodyBold">{approvedDevices}</AppText>
            </View>
            <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.lightGrey }]}>
              <Feather name="clock" size={18} color={colors.warning} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Pending Requests</AppText>
              <AppText variant="bodyBold">{pendingDevices}</AppText>
            </View>
            <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.lightGrey }]}>
              <Feather name="shield" size={18} color={colors.navyBlue} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Total Requests</AppText>
              <AppText variant="bodyBold">{deviceRequests.length}</AppText>
            </View>
          </Card>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl, paddingBottom: 100 },
  heroBox: { padding: spacing.xl, backgroundColor: colors.navyBlue, borderRadius: radius.xl, ...shadows.medium, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridCard: { width: '47%', padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, ...shadows.subtle, alignItems: 'center' },
  gridValue: { marginVertical: spacing.sm },
  activityCard: { padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, ...shadows.subtle },
  activityRow: { flexDirection: 'row', alignItems: 'center' },
  activityStat: { flex: 1, alignItems: 'center' },
  activityDivider: { width: 1, height: 40, backgroundColor: colors.lightGrey },
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: colors.lightGrey, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.navyBlue, borderRadius: 4 },
  breakdownCard: { backgroundColor: colors.white, borderRadius: radius.xl, ...shadows.subtle, overflow: 'hidden' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base },
});
