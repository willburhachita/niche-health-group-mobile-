import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../common/AppText';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { formatTimestamp } from '../../utils/dateHelpers';

const statusMap = {
  active: { label: 'Active', variant: 'success' },
  discharged: { label: 'Discharged', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'role' },
};

export const PatientCard = ({ patient, onPress, showLastVisit = true }) => {
  const statusInfo = statusMap[patient.status] || statusMap.active;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Avatar name={patient.displayName} size={40} />
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>{patient.displayName}</AppText>
          <Badge label={statusInfo.label} variant={statusInfo.variant} />
        </View>
        <AppText variant="caption" color={colors.darkGrey}>{patient.patientCode || patient.patientId}</AppText>
        {showLastVisit && patient.lastVisit && (
          <AppText variant="small" color={colors.mediumGrey}>
            Last visit: {formatTimestamp(patient.lastVisit)}
          </AppText>
        )}
      </View>
      <Feather name="chevron-right" size={16} color={colors.lightGrey} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  pressed: {
    backgroundColor: colors.offWhite,
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
  },
});
