import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

export const SectionHeader = ({ title, action, onAction, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title.toUpperCase()}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.mediumGrey,
    letterSpacing: 1,
  },
  action: {
    ...typography.caption,
    color: colors.navyBlue,
  },
});
