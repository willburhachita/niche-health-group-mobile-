import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';
import { getPatientById } from '../../data/mockPatients';
import { formatCurrency } from '../../data/mockInvoices';
import { formatTimestamp } from '../../utils/dateHelpers';

const statusStyles = {
  paid: { color: colors.success, bg: colors.success + '18', label: 'Paid' },
  unpaid: { color: colors.warning, bg: colors.warning + '18', label: 'Unpaid' },
  overdue: { color: colors.error, bg: colors.error + '18', label: 'Overdue' },
};

export const InvoiceItem = ({ invoice, onPress }) => {
  const patient = getPatientById(invoice.patientId);
  const status = statusStyles[invoice.status] || statusStyles.unpaid;

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: status.bg }]}>
        <Feather name="file-text" size={18} color={status.color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>
            {invoice.invoiceNumber}
          </AppText>
          <AppText variant="bodyBold" color={status.color}>
            {formatCurrency(invoice.total)}
          </AppText>
        </View>
        <AppText variant="caption" color={colors.darkGrey} numberOfLines={1}>
          {patient ? patient.displayName : 'Unknown Patient'}
        </AppText>
        <View style={styles.bottomRow}>
          <AppText variant="small" color={colors.mediumGrey}>
            {formatTimestamp(invoice.date)}
          </AppText>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <AppText variant="small" color={status.color}>{status.label}</AppText>
          </View>
        </View>
      </View>
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginRight: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
});
