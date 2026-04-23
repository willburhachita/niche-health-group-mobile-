import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { useAuth } from '../../hooks/useAuth';
import { mockSchedule } from '../../data/mockSchedule';
import { formatTimestamp, formatTime } from '../../utils/dateHelpers';
import { getTodaysAppointments, getPendingAppointmentsCount } from '../../data/mockAppointments';
import { getPatientById } from '../../data/mockPatients';

export default function HomeScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const conversations = useQuery(api.messages.listConversations) || [];
  const channels = useQuery(api.channels.listChannels) || [];
  const announcements = useQuery(api.announcements.listAnnouncements) || [];
  const deviceRequests = useQuery(api.auth.listDeviceRequests) || [];

  const displayName = currentAccount?.displayName || currentAccount?.email || 'User';
  const currentUserId = currentAccount?.userId;
  const isAdmin = currentAccount?.role === 'admin';

  const clinicAppointments = getTodaysAppointments().filter(a => a.status !== 'open');
  const pendingApts = getPendingAppointmentsCount();
  const nextAppointment = clinicAppointments.find(a => a.startTime > Date.now() && a.status !== 'completed');
  const nextPatient = nextAppointment?.patientId ? getPatientById(nextAppointment.patientId) : null;

  const todayEvents = mockSchedule.filter(e => {
    const d = new Date(e.startTime);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  });

  const recentConvos = [...conversations]
    .filter(c => c.lastMessageAt)
    .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0))
    .slice(0, 3);

  const urgentAnnouncements = announcements.filter(a => a.priority === 'urgent' || a.priority === 'critical');
  const pendingDevices = deviceRequests.filter(d => d.status === 'pending').length;

  const STATS = [
    { label: 'Unread', count: conversations.filter(c => c.unreadBy?.[currentUserId] === true).length, icon: 'message-circle', color: colors.navyBlue, nav: () => navigation.navigate('MessagesTab') },
    { label: 'Channels', count: channels.length, icon: 'hash', color: colors.peach, nav: () => navigation.navigate('ChannelsTab') },
    { label: 'Events Today', count: todayEvents.length, icon: 'calendar', color: colors.success, nav: () => navigation.navigate('ScheduleTab') },
    { label: isAdmin ? 'Pending' : 'Notices', count: isAdmin ? pendingDevices : announcements.length, icon: isAdmin ? 'clock' : 'bell', color: colors.warning, nav: () => isAdmin ? navigation.navigate('MoreTab', { screen: 'AdminDeviceApprovals' }) : navigation.navigate('MoreTab', { screen: 'AdminSendAnnouncement' }) },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="caption" color={colors.mediumGrey}>Welcome back,</AppText>
            <AppText variant="display">{displayName}</AppText>
          </View>
          <Pressable onPress={() => navigation.navigate('MoreTab', { screen: 'Profile', params: { originTab: 'HomeTab' } })}>
            <Avatar name={displayName} size={44} showOnline onlineStatus="online" />
          </Pressable>
        </View>

        {/* Urgent — only shown when real urgent announcements exist */}
        {urgentAnnouncements.length > 0 && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
            <Card variant="highlighted" onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: urgentAnnouncements[0]._id })}>
              <View style={styles.alertRow}>
                <Feather name="alert-triangle" size={20} color={colors.warning} />
                <AppText variant="bodyBold" style={{ flex: 1, marginLeft: spacing.md }}>
                  {urgentAnnouncements.length} Urgent Announcement{urgentAnnouncements.length > 1 ? 's' : ''}
                </AppText>
                <Feather name="chevron-right" size={16} color={colors.mediumGrey} />
              </View>
            </Card>
          </View>
        )}

        {/* Clinic Quick Access */}
        <Pressable
          style={styles.clinicCard}
          onPress={() => navigation.navigate('MoreTab', { screen: 'ClinicHub' })}
        >
          <View style={styles.clinicLeft}>
            <View style={styles.clinicIconBox}>
              <Feather name="activity" size={18} color={colors.navyBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold">Clinic</AppText>
              <AppText variant="caption" color={colors.darkGrey}>
                {clinicAppointments.length} appointments today{pendingApts > 0 ? ` · ${pendingApts} pending` : ''}
              </AppText>
            </View>
          </View>
          <Feather name="chevron-right" size={16} color={colors.mediumGrey} />
        </Pressable>

        {/* Next Appointment */}
        {nextAppointment && nextPatient && (
          <View style={{ paddingHorizontal: spacing.base }}>
            <Card onPress={() => navigation.navigate('MoreTab', { screen: 'AppointmentDetail', params: { appointmentId: nextAppointment.id } })}>
              <AppText variant="small" color={colors.mediumGrey} style={{ marginBottom: spacing.xs }}>NEXT APPOINTMENT</AppText>
              <View style={styles.nextAptRow}>
                <View style={[styles.nextAptBar, { backgroundColor: colors.navyBlue }]} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{nextPatient.displayName}</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>{nextAppointment.type}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>
                    {formatTime(nextAppointment.startTime)}{nextAppointment.location ? ` · ${nextAppointment.location}` : ''}
                  </AppText>
                </View>
                <View style={styles.nextAptStatus}>
                  <View style={[styles.nextAptDot, { backgroundColor: colors.success }]} />
                  <AppText variant="small" color={colors.success}>Confirmed</AppText>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Stats — real data, each tappable */}
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <Pressable key={i} style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.7 }]} onPress={s.nav}>
              <View style={[styles.statIconBox, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={16} color={s.color} />
              </View>
              <AppText variant="h3" style={styles.statCount}>{s.count}</AppText>
              <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{s.label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Recent Messages — real data only, empty state if none */}
        <SectionHeader
          title="Recent Messages"
          action={recentConvos.length > 0 ? 'See All' : undefined}
          onAction={() => navigation.navigate('MessagesTab')}
        />
        {recentConvos.length > 0 ? recentConvos.map(c => (
          <ConversationItem
            key={c._id}
            conversation={{ ...c, id: c._id }}
            currentUserId={currentUserId}
            onPress={() => navigation.navigate('MessagesTab', { screen: 'Chat', params: { conversationId: c._id } })}
          />
        )) : (
          <Pressable
            style={styles.emptyActivity}
            onPress={() => navigation.navigate('MessagesTab')}
          >
            <Feather name="message-circle" size={22} color={colors.mediumGrey} />
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginLeft: spacing.sm }}>No recent messages — tap to start a conversation</AppText>
          </Pressable>
        )}

        {/* Channels */}
        <SectionHeader title="Your Channels" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
          {channels.slice(0, 5).map(ch => (
            <Pressable key={ch._id} style={styles.pill} onPress={() => navigation.navigate('ChannelsTab', { screen: 'ChannelThread', params: { channelId: ch._id } })}>
              <AppText variant="caption" color={colors.navyBlue}>#{ch.name}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        {/* Schedule */}
        <SectionHeader title="Today's Schedule" action="View All" onAction={() => navigation.navigate('ScheduleTab')} />
        <View style={{ paddingHorizontal: spacing.base }}>
          {todayEvents.length > 0 ? todayEvents.slice(0, 2).map(e => (
            <Card key={e.id} onPress={() => navigation.navigate('ScheduleTab', { screen: 'EventDetail', params: { eventId: e.id } })}>
              <View style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: e.type === 'training' ? colors.peach : colors.navyBlue }]} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{e.title}</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>{formatTime(e.startTime)} - {e.location || 'TBC'}</AppText>
                </View>
              </View>
            </Card>
          )) : (
            <AppText variant="body" color={colors.mediumGrey} style={{ paddingVertical: spacing.base }}>No events today</AppText>
          )}
        </View>

        {/* Announcements — real data from Convex, hidden if none */}
        {announcements.length > 0 && (
          <>
            <SectionHeader title="Announcements" />
            <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxl }}>
              {announcements.slice(0, 2).map(a => (
                <Card key={a._id} onPress={() => navigation.navigate('AnnouncementDetail', { announcementId: a._id })} style={{ marginBottom: spacing.sm }}>
                  <AppText variant="bodyBold" numberOfLines={1}>{a.title}</AppText>
                  <AppText variant="caption" color={colors.darkGrey} numberOfLines={2} style={{ marginTop: spacing.xs }}>{a.body}</AppText>
                  <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.sm }}>
                    {a.authorName || 'Admin'} · {formatTimestamp(a.createdAt)}
                  </AppText>
                </Card>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, paddingBottom: spacing.base },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm, gap: spacing.sm,
  },
  statCard: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: radius.md, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.lightGrey,
    alignItems: 'center', ...shadows.subtle,
  },
  statIconBox: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs,
  },
  statCount: { lineHeight: 20 },
  emptyActivity: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  pillRow: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: colors.navyLight,
  },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventDot: { width: 4, height: 40, borderRadius: 2, marginRight: spacing.md },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderLeftWidth: 4,
    borderLeftColor: colors.navyBlue,
    ...shadows.subtle,
  },
  clinicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clinicIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  nextAptRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextAptBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  nextAptStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  nextAptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
});
