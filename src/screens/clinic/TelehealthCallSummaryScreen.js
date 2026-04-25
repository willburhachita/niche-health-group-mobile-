import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function TelehealthCallSummaryScreen({ route, navigation }) {
  const { sessionId, appointmentId } = route.params || {};

  const session = useQuery(api.telehealth.get, sessionId ? { id: sessionId } : 'skip');
  const appointment = useQuery(api.appointments.get, appointmentId ? { id: appointmentId } : 'skip');
  const patient = useQuery(api.patients.get, session?.patientId ? { id: session.patientId } : 'skip');
  const treatmentNote = useQuery(api.treatmentNotes.get, session?.treatmentNoteId ? { id: session.treatmentNoteId } : 'skip');

  if (!session) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={24} color={colors.black} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Call Summary</AppText>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="body" color={colors.mediumGrey}>Loading session...</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  const formatDateTime = (ts) => {
    if (!ts) return '--';
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${mins}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Call Summary</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Patient & Call Info */}
        <View style={styles.patientCard}>
          {patient && <Avatar name={patient.displayName} size={56} />}
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <AppText variant="h3">{patient?.displayName || 'Unknown Patient'}</AppText>
            <AppText variant="caption" color={colors.darkGrey}>{patient?.patientCode || ''}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>
              {appointment?.type || 'Telehealth'} Consultation
            </AppText>
          </View>
          <View style={styles.statusBadge}>
            <Feather name="check-circle" size={14} color={colors.success} />
            <AppText variant="small" color={colors.success} style={{ marginLeft: spacing.xs }}>Completed</AppText>
          </View>
        </View>

        {/* Call Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Feather name="clock" size={18} color={colors.navyBlue} />
            <AppText variant="h3" style={{ marginTop: spacing.xs }}>{formatDuration(session.duration)}</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Duration</AppText>
          </View>
          <View style={styles.statItem}>
            <Feather name="calendar" size={18} color={colors.navyBlue} />
            <AppText variant="bodyBold" style={{ marginTop: spacing.xs }}>
              {session.startedAt ? formatDateTime(session.startedAt).split(',')[0] : '--'}
            </AppText>
            <AppText variant="small" color={colors.mediumGrey}>Date</AppText>
          </View>
          <View style={styles.statItem}>
            <Feather name="play-circle" size={18} color={colors.navyBlue} />
            <AppText variant="bodyBold" style={{ marginTop: spacing.xs }}>
              {session.startedAt ? formatDateTime(session.startedAt).split(', ')[1] : '--'}
            </AppText>
            <AppText variant="small" color={colors.mediumGrey}>Started</AppText>
          </View>
        </View>

        {/* Transcription */}
        {session.transcription && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card>
              <View style={styles.sectionTitle}>
                <Feather name="disc" size={16} color={colors.navyBlue} />
                <AppText variant="bodyBold" style={{ marginLeft: spacing.sm }}>Call Transcription</AppText>
              </View>
              <Divider />
              <AppText variant="body" color={colors.darkGrey} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {session.transcription}
              </AppText>
            </Card>
          </View>
        )}

        {/* Call Notes */}
        {session.callNotes && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card>
              <View style={styles.sectionTitle}>
                <Feather name="edit-3" size={16} color={colors.navyBlue} />
                <AppText variant="bodyBold" style={{ marginLeft: spacing.sm }}>Doctor Notes</AppText>
              </View>
              <Divider />
              <AppText variant="body" color={colors.darkGrey} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {session.callNotes}
              </AppText>
            </Card>
          </View>
        )}

        {/* Treatment Note Link */}
        {treatmentNote && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.base }}>
            <Card>
              <View style={styles.sectionTitle}>
                <Feather name="file-text" size={16} color={colors.success} />
                <AppText variant="bodyBold" style={{ marginLeft: spacing.sm }}>Treatment Note Created</AppText>
              </View>
              <Divider />
              <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.sm }}>
                Template: {treatmentNote.template}
              </AppText>
              {treatmentNote.plan && (
                <AppText variant="body" color={colors.darkGrey} style={{ marginTop: spacing.xs }} numberOfLines={3}>
                  {treatmentNote.plan}
                </AppText>
              )}
              <Pressable
                style={styles.viewNoteBtn}
                onPress={() => navigation.navigate('TreatmentNote', {
                  patientId: session.patientId,
                  noteId: session.treatmentNoteId,
                })}
              >
                <AppText variant="bodyBold" color={colors.navyBlue}>View Full Note</AppText>
                <Feather name="arrow-right" size={16} color={colors.navyBlue} />
              </Pressable>
            </Card>
          </View>
        )}

        {/* No content */}
        {!session.transcription && !session.callNotes && !treatmentNote && (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl }}>
            <Feather name="file" size={32} color={colors.lightGrey} />
            <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>
              No notes or transcription for this call
            </AppText>
          </View>
        )}

        {/* Actions */}
        <View style={{ paddingHorizontal: spacing.base, gap: spacing.sm, marginTop: spacing.md }}>
          {!treatmentNote && (
            <Button
              label="Create Treatment Note"
              onPress={() => navigation.navigate('TreatmentNote', {
                patientId: session.patientId,
                appointmentId: session.appointmentId,
              })}
            />
          )}
          <Button
            label="View Patient Profile"
            variant="secondary"
            onPress={() => navigation.navigate('PatientProfile', { patientId: session.patientId })}
          />
          {appointmentId && (
            <Button
              label="View Appointment"
              variant="tertiary"
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId })}
            />
          )}
        </View>
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
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginBottom: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(72,187,120,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
});
