import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

export const Badge = ({ count, label, variant = 'unread', style }) => {
  const text = label || (count > 99 ? '99+' : String(count));

  if (variant === 'unread' && count === 0) return null;

  const variantStyles = {
    unread: { bg: colors.error, text: colors.white },
    role: { bg: colors.navyLight, text: colors.navyBlue },
    department: { bg: colors.peachLight, text: colors.warning },
    success: { bg: colors.success + '20', text: colors.success },
    warning: { bg: colors.warning + '20', text: colors.warning },
  };

  const v = variantStyles[variant] || variantStyles.unread;

  return (
    <View style={[styles.base, variant === 'unread' ? styles.pill : styles.tag, { backgroundColor: v.bg }, style]}>
      <Text style={[styles.text, { color: v.text }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: spacing.sm - 2,
  },
  tag: {
    height: 22,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
  },
  text: {
    ...typography.small,
  },
});
