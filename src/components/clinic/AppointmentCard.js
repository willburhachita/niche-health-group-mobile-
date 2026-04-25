import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../common/AppText';
import { Avatar } from '../common/Avatar';
import { formatTime } from '../../utils/dateHelpers';

const statusColors = {
  confirmed: colors.success,
  pending: colors.warning,
  cancelled: colors.error,
  completed: colors.mediumGrey,
  noShow: colors.error,
  open: colors.navyBlue,
};

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
  completed: 'Completed',
  noShow: 'No Show',
  open: 'Open',
};

export const AppointmentCard = ({ appointment, patient, onPress, compact = false }) => {
  const dotColor = statusColors[appointment.status] || colors.mediumGrey;
  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;
  const timeStr = formatTime(appointment.startTime);

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compact, pressed && styles.pressed]}
        onPress={onPress}
      >
        <AppText variant="caption" color={colors.navyBlue} style={styles.compactTime}>{timeStr}</AppText>
        <View style={styles.compactBody}>
          <AppText variant="bodyBold" numberOfLines={1}>
            {patient ? patient.displayName : 'Available Slot'}
          </AppText>
          {appointment.type && (
            <AppText variant="caption" color={colors.darkGrey} numberOfLines={1}>{appointment.type}</AppText>
          )}
        </View>
        <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.timeColumn}>
        <AppText variant="bodyBold" color={colors.navyBlue}>{timeStr}</AppText>
        <AppText variant="small" color={colors.mediumGrey}>
          {appointment.duration ? `${appointment.duration}m` : ''}
        </AppText>
      </View>
      <View style={[styles.bar, { backgroundColor: dotColor }]} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          {patient ? (
            <Avatar name={patient.displayName} size={28} />
          ) : (
            <View style={styles.openDot}>
              <Feather name="plus" size={14} color={colors.navyBlue} />
            </View>
          )}
          <View style={styles.nameText}>
            <AppText variant="bodyBold" numberOfLines={1}>
              {patient ? patient.displayName : 'Available Slot'}
            </AppText>
            {appointment.type && (
              <AppText variant="caption" color={colors.darkGrey} numberOfLines={1}>{appointment.type}</AppText>
            )}
          </View>
        </View>
        {appointment.location && (
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={12} color={colors.mediumGrey} />
            <AppText variant="small" color={colors.mediumGrey} style={styles.metaText}>{appointment.location}</AppText>
          </View>
        )}
      </View>
      <View style={styles.statusBadge}>
        <View style={[styles.statusDotSmall, { backgroundColor: dotColor }]} />
        <AppText variant="small" color={dotColor}>{statusLabel}</AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    ...shadows.subtle,
  },
  pressed: {
    backgroundColor: colors.offWhite,
    transform: [{ scale: 0.98 }],
  },
  timeColumn: {
    width: 52,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  bar: {
    width: 3,
    height: 44,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    marginLeft: 36,
  },
  metaText: {
    marginLeft: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.sm,
  },
  openDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  compactTime: {
    width: 52,
    fontWeight: '600',
  },
  compactBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
});
