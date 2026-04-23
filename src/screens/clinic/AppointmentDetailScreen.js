import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { getAppointmentById, APPOINTMENT_STATUSES } from '../../data/mockAppointments';
import { getPatientById } from '../../data/mockPatients';
import { getUserById } from '../../data/mockUsers';
import { formatTime, formatDate } from '../../utils/dateHelpers';

const statusColors = {
  confirmed: colors.success,
  pending: colors.warning,
  cancelled: colors.error,
  completed: colors.mediumGrey,
  noShow: colors.error,
  open: colors.navyBlue,
};

export default function AppointmentDetailScreen({ route, navigation }) {
  const alert = useAlert();
  const { appointmentId } = route.params;
  const appointment = getAppointmentById(appointmentId);
  const patient = appointment?.patientId ? getPatientById(appointment.patientId) : null;
  const provider = appointment?.providerId ? getUserById(appointment.providerId) : null;
  const statusInfo = APPOINTMENT_STATUSES[appointment?.status] || {};
  const dotColor = statusColors[appointment?.status] || colors.mediumGrey;

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={24} color={colors.black} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Appointment</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Appointment not found</AppText>
      </SafeAreaView>
    );
  }

  const isUpcoming = appointment.startTime > Date.now() && appointment.status !== 'completed' && appointment.status !== 'cancelled';

  const handleCancel = () => {
    alert({
      type: 'warning',
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel this appointment?',
      buttons: [
        { label: 'No', style: 'cancel' },
        { label: 'Yes, Cancel', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Appointment</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: dotColor + '14' }]}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <AppText variant="bodyBold" color={dotColor}>{statusInfo.label}</AppText>
        </View>

        {/* Patient Card */}
        {patient && (
          <Pressable
            style={styles.patientCard}
            onPress={() => navigation.navigate('PatientProfile', { patientId: patient.id })}
          >
            <Avatar name={patient.displayName} size={48} />
            <View style={styles.patientInfo}>
              <AppText variant="h3">{patient.displayName}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{patient.patientId}</AppText>
            </View>
            <Pressable style={styles.actionIcon} onPress={() => {}}>
              <Feather name="phone" size={18} color={colors.navyBlue} />
            </Pressable>
            <Pressable style={styles.actionIcon} onPress={() => {}}>
              <Feather name="message-circle" size={18} color={colors.navyBlue} />
            </Pressable>
          </Pressable>
        )}

        {/* Details */}
        <View style={styles.detailsSection}>
          <DetailRow icon="clock" label="Date & Time" value={`${formatDate(appointment.startTime)}, ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`} />
          <Divider type="full" />
          {appointment.type && (
            <>
              <DetailRow icon="activity" label="Type" value={appointment.type} />
              <Divider type="full" />
            </>
          )}
          {provider && (
            <>
              <DetailRow icon="user" label="Provider" value={provider.displayName} />
              <Divider type="full" />
            </>
          )}
          {appointment.location && (
            <>
              <DetailRow icon="map-pin" label="Location" value={appointment.location} />
              <Divider type="full" />
            </>
          )}
          {appointment.notes && (
            <DetailRow icon="file-text" label="Notes" value={appointment.notes} />
          )}
        </View>

        {/* Duration & Recurring */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color={colors.mediumGrey} />
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginLeft: spacing.xs }}>
              {appointment.duration} minutes
            </AppText>
          </View>
          {appointment.isRecurring && (
            <View style={styles.metaItem}>
              <Feather name="repeat" size={14} color={colors.navyBlue} />
              <AppText variant="caption" color={colors.navyBlue} style={{ marginLeft: spacing.xs }}>
                Recurring
              </AppText>
            </View>
          )}
          {appointment.reminderSent && (
            <View style={styles.metaItem}>
              <Feather name="bell" size={14} color={colors.success} />
              <AppText variant="caption" color={colors.success} style={{ marginLeft: spacing.xs }}>
                Reminder sent
              </AppText>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isUpcoming && (
            <>
              <Button
                label={appointment.type === 'Telehealth' ? 'Start Telehealth' : 'Start Consultation'}
                onPress={() => {
                  if (appointment.type === 'Telehealth') {
                    navigation.navigate('TelehealthCall', { appointmentId: appointment.id });
                  } else {
                    navigation.navigate('TreatmentNote', { patientId: appointment.patientId, appointmentId: appointment.id });
                  }
                }}
              />
              <Button label="Reschedule" variant="secondary" onPress={() => navigation.navigate('BookAppointment', { appointmentId: appointment.id })} />
              <Button label="Cancel Appointment" variant="destructive" onPress={handleCancel} />
            </>
          )}
          {appointment.status === 'completed' && (
            <Button
              label="View Treatment Notes"
              onPress={() => navigation.navigate('TreatmentNote', { patientId: appointment.patientId })}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Feather name={icon} size={18} color={colors.navyBlue} style={styles.detailIcon} />
      <View style={styles.detailText}>
        <AppText variant="small" color={colors.mediumGrey}>{label}</AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginHorizontal: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.base,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginBottom: spacing.base,
  },
  patientInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  detailsSection: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    overflow: 'hidden',
    marginBottom: spacing.base,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  detailIcon: {
    marginRight: spacing.md,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.base,
    marginBottom: spacing.xl,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
});
