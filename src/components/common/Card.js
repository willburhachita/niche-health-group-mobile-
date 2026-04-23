import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';

export const Card = ({ children, variant = 'standard', onPress, style }) => {
  const variantStyles = {
    standard: styles.standard,
    highlighted: styles.highlighted,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.base, variantStyles[variant], pressed && styles.pressed, style]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  standard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  highlighted: {
    backgroundColor: colors.peachLight,
    borderWidth: 1,
    borderColor: colors.peach,
  },
  pressed: {
    backgroundColor: colors.offWhite,
    transform: [{ scale: 0.98 }],
  },
});
