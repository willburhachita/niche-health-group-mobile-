import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../common/AppText';

export const StatBar = ({ label, value, percentage, maxPercentage = 100, color = colors.navyBlue }) => {
  const widthPercent = Math.min((percentage / maxPercentage) * 100, 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="body" style={styles.label}>{label}</AppText>
        <AppText variant="bodyBold">{value}</AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${widthPercent}%`, backgroundColor: color }]} />
      </View>
      <AppText variant="small" color={colors.mediumGrey}>{percentage}%</AppText>
    </View>
  );
};

export const RevenueBar = ({ label, amount, maxAmount, color = colors.navyBlue }) => {
  const heightPercent = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 4) : 4;

  return (
    <View style={styles.revenueContainer}>
      <View style={styles.barWrapper}>
        <View style={[styles.revenueBar, { height: `${heightPercent}%`, backgroundColor: color }]} />
      </View>
      <AppText variant="small" color={colors.mediumGrey} style={styles.revenueLabel}>{label}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    flex: 1,
  },
  track: {
    height: 6,
    backgroundColor: colors.offWhite,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  revenueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: 28,
    height: 100,
    backgroundColor: colors.offWhite,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  revenueBar: {
    width: '100%',
    borderRadius: radius.sm,
  },
  revenueLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
