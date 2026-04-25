import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { SectionHeader } from '../../components/common/SectionHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Badge } from '../../components/common/Badge';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { formatTime } from '../../utils/dateHelpers';

export default function TelehealthScreen({ navigation }) {
  const { currentUserId } = useAuth();
  const now = useMemo(() => Date.now(), []);

  // Fetch telehealth appointments (30 days window)
  const queryRange = useMemo(() => ({
    startFrom: now - 30 * 86400000,
    startTo: now + 30 * 86400000,
  }), [now]);
  const allApts = useQuery(api.appointments.listByDateRange, queryRange) ?? [];
  const patients = useQuery(api.patients.list, {}) ?? [];

  // Active session for current provider
  const activeSession = useQuery(
    api.telehealth.getActiveForProvider,
    currentUserId ? { providerId: currentUserId } : 'skip'
  );

  // Completed sessions
  const completedSessions = useQuery(api.telehealth.listCompleted, { limit: 30 }) ?? [];

  const patientMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p._id] = p; });
    return m;
  }, [patients]);

  const telehealthApts = allApts.filter(a => a.type === 'Telehealth' || a.location === 'Virtual');
  const upcoming = telehealthApts.filter(a => a.startTime > now && a.status !== 'cancelled' && a.status !== 'completed');
  const upcomingSorted = useMemo(() => [...upcoming].sort((a, b) => a.startTime - b.startTime), [upcoming]);

  // Build a set of appointment IDs that have completed sessions
  const completedAptIds = useMemo(() => {
    const s = new Set();
    completedSessions.forEach(cs => s.add(cs.appointmentId));
    return s;
  }, [completedSessions]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const formatDateShort = (ts) => {
    const d = new Date(ts);
    const day = d.getDate();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${day} ${months[d.getMonth()]}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Telehealth</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Active Session Banner */}
        {activeSession && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card>
              <View style={styles.activeBanner}>
                <View style={styles.activeRow}>
                  <View style={styles.liveDot} />
                  <AppText variant="bodyBold" style={{ flex: 1 }}>
                    Call In Progress
                  </AppText>
                  <AppText variant="caption" color={colors.darkGrey}>
                    {activeSession.startedAt ? formatDuration(Math.round((now - activeSession.startedAt) / 1000)) : '--:--'}
                  </AppText>
                </View>
                <View style={styles.activePatientRow}>
                  {patientMap[activeSession.patientId] && (
                    <Avatar name={patientMap[activeSession.patientId].displayName} size={36} />
                  )}
                  <AppText variant="body" style={{ marginLeft: spacing.sm, flex: 1 }}>
                    {patientMap[activeSession.patientId]?.displayName || 'Patient'}
                  </AppText>
                </View>
                <Button
                  label="Rejoin Call"
                  onPress={() => navigation.navigate('TelehealthCall', {
                    appointmentId: activeSession.appointmentId,
                    sessionId: activeSession._id,
                  })}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Feather name="video" size={20} color={colors.navyBlue} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>{upcomingSorted.length}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Upcoming</AppText>
          </View>
          <View style={styles.statBox}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>{completedSessions.length}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Completed</AppText>
          </View>
          <View style={styles.statBox}>
            <Feather name="clock" size={20} color={colors.peach} />
            <AppText variant="h2" style={{ marginTop: spacing.xs }}>
              {completedSessions.reduce((a, s) => a + (s.duration || 0), 0) > 0
                ? `${Math.round(completedSessions.reduce((a, s) => a + (s.duration || 0), 0) / 60)}m`
                : '0m'
              }
            </AppText>
            <AppText variant="small" color={colors.mediumGrey}>Call Time</AppText>
          </View>
        </View>

        {/* Upcoming Virtual Appointments */}
        <SectionHeader title="Upcoming Sessions" />
        {upcomingSorted.length === 0 ? (
          <EmptyState icon="video" title="No telehealth sessions" message="No upcoming virtual appointments scheduled" />
        ) : (
          upcomingSorted.map(apt => {
            const patient = apt.patientId ? patientMap[apt.patientId] : null;
            const minutesUntil = Math.round((apt.startTime - now) / 60000);
            const canStart = minutesUntil < 5;
            const isActive = activeSession?.appointmentId === apt._id;

            return (
              <Pressable
                key={apt._id}
                style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed, isActive && styles.sessionCardActive]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt._id })}
              >
                <View style={styles.sessionLeft}>
                  {patient && <Avatar name={patient.displayName} size={44} />}
                  <View style={styles.sessionInfo}>
                    <AppText variant="bodyBold">{patient?.displayName || 'Unknown Patient'}</AppText>
                    <AppText variant="caption" color={colors.darkGrey}>
                      {formatTime(apt.startTime)} · {apt.duration}min
                    </AppText>
                    {minutesUntil > 0 && minutesUntil <= 60 && (
                      <AppText variant="small" color={canStart ? colors.success : colors.peach}>
                        {canStart ? 'Ready to start' : `Starts in ${minutesUntil}min`}
                      </AppText>
                    )}
                    {apt.notes && (
                      <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{apt.notes}</AppText>
                    )}
                  </View>
                </View>
                <Pressable
                  style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                  onPress={(e) => {
                    e.stopPropagation();
                    if (canStart) {
                      navigation.navigate('TelehealthCall', { appointmentId: apt._id });
                    }
                  }}
                >
                  <Feather name="video" size={16} color={canStart ? colors.white : colors.mediumGrey} />
                  <AppText
                    variant="small"
                    color={canStart ? colors.white : colors.mediumGrey}
                    style={{ marginLeft: spacing.xs }}
                  >
                    {isActive ? 'Rejoin' : canStart ? 'Start' : 'Upcoming'}
                  </AppText>
                </Pressable>
              </Pressable>
            );
          })
        )}

        {/* Past Completed Sessions */}
        {completedSessions.length > 0 && (
          <>
            <SectionHeader title="Completed Sessions" />
            {completedSessions.map(session => {
              const patient = patientMap[session.patientId];
              return (
                <Pressable
                  key={session._id}
                  style={({ pressed }) => [styles.pastCard, pressed && styles.pressed]}
                  onPress={() => navigation.navigate('TelehealthCallSummary', {
                    sessionId: session._id,
                    appointmentId: session.appointmentId,
                  })}
                >
                  {patient && <Avatar name={patient.displayName} size={36} />}
                  <View style={styles.pastInfo}>
                    <AppText variant="body">{patient?.displayName || 'Unknown'}</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <AppText variant="small" color={colors.mediumGrey}>
                        {session.startedAt ? formatDateShort(session.startedAt) : '--'} · {formatDuration(session.duration)}
                      </AppText>
                      {session.treatmentNoteId && (
                        <Badge label="Notes" variant="success" />
                      )}
                      {session.transcription && (
                        <Badge label="Transcribed" variant="role" />
                      )}
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.lightGrey} />
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  activeBanner: {},
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    ...shadows.subtle,
  },
  sessionCardActive: {
    borderColor: colors.navyBlue,
    backgroundColor: colors.navyLight,
  },
  pressed: {
    backgroundColor: colors.offWhite,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sessionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyBlue,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
  startBtnDisabled: {
    backgroundColor: colors.offWhite,
  },
  pastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  pastInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
