import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '../common/AppText';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export const DateSeparator = ({ label }) => {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>{label}</AppText>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.lightGrey },
  label: { marginHorizontal: spacing.md },
});
