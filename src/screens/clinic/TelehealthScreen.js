import React from 'react';
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
import { getPatientById } from '../../data/mockPatients';
import { mockAppointments } from '../../data/mockAppointments';
import { formatTime } from '../../utils/dateHelpers';

export default function TelehealthScreen({ navigation }) {
  const now = Date.now();
  const telehealthApts = mockAppointments.filter(a => a.type === 'Telehealth' || a.location === 'Virtual');
  const upcoming = telehealthApts.filter(a => a.startTime > now && a.status !== 'cancelled');
  const past = telehealthApts.filter(a => a.startTime <= now || a.status === 'completed');

  // Mock active session
  const activeSession = null;

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
        {/* Active Session */}
        {activeSession && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card variant="highlighted">
              <View style={styles.activeRow}>
                <View style={styles.liveDot} />
                <AppText variant="bodyBold" style={{ flex: 1 }}>In Progress: Patient Name</AppText>
                <AppText variant="caption" color={colors.darkGrey}>12:34</AppText>
              </View>
              <Button label="Rejoin" onPress={() => {}} style={{ marginTop: spacing.sm }} />
            </Card>
          </View>
        )}

        {/* Upcoming Virtual Appointments */}
        <SectionHeader title="Upcoming Virtual Appointments" />
        {upcoming.length === 0 ? (
          <EmptyState icon="video" title="No telehealth sessions" message="No upcoming virtual appointments scheduled" />
        ) : (
          upcoming.map(apt => {
            const patient = apt.patientId ? getPatientById(apt.patientId) : null;
            const canStart = apt.startTime - now < 5 * 60 * 1000; // 5 min before

            return (
              <Pressable
                key={apt.id}
                style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}
                onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
              >
                <View style={styles.sessionLeft}>
                  {patient && <Avatar name={patient.displayName} size={44} />}
                  <View style={styles.sessionInfo}>
                    <AppText variant="bodyBold">{patient?.displayName || 'Unknown'}</AppText>
                    <AppText variant="caption" color={colors.darkGrey}>
                      {formatTime(apt.startTime)} · {apt.duration}min
                    </AppText>
                    {apt.notes && (
                      <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{apt.notes}</AppText>
                    )}
                  </View>
                </View>
                <Pressable
                  style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
                  onPress={() => {
                    if (canStart) {
                      navigation.navigate('TelehealthCall', { appointmentId: apt.id });
                    }
                  }}
                >
                  <Feather name="video" size={16} color={canStart ? colors.white : colors.mediumGrey} />
                  <AppText
                    variant="small"
                    color={canStart ? colors.white : colors.mediumGrey}
                    style={{ marginLeft: spacing.xs }}
                  >
                    {canStart ? 'Start' : 'Upcoming'}
                  </AppText>
                </Pressable>
              </Pressable>
            );
          })
        )}

        {/* Past Sessions */}
        {past.length > 0 && (
          <>
            <SectionHeader title="Past Sessions" />
            {past.map(apt => {
              const patient = apt.patientId ? getPatientById(apt.patientId) : null;
              return (
                <Pressable
                  key={apt.id}
                  style={({ pressed }) => [styles.pastCard, pressed && styles.pressed]}
                  onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
                >
                  {patient && <Avatar name={patient.displayName} size={36} />}
                  <View style={styles.pastInfo}>
                    <AppText variant="body">{patient?.displayName || 'Unknown'}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>
                      {formatTime(apt.startTime)} · {apt.duration}min
                    </AppText>
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
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
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
