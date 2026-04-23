import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { radius } from '../../constants/radius';
import { spacing } from '../../constants/spacing';

export const Button = ({ label, variant = 'primary', onPress, disabled, loading, icon, style, textStyle }) => {
  const variantStyles = {
    primary: { bg: colors.navyBlue, text: colors.white, border: 'transparent' },
    secondary: { bg: 'transparent', text: colors.black, border: colors.lightGrey },
    tertiary: { bg: 'transparent', text: colors.navyBlue, border: 'transparent' },
    destructive: { bg: 'transparent', text: colors.error, border: 'transparent' },
  };

  const v = variantStyles[variant] || variantStyles.primary;
  const isOutlined = variant === 'secondary';
  const isText = variant === 'tertiary' || variant === 'destructive';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: v.bg, borderColor: v.border },
        isOutlined && styles.outlined,
        isText && styles.textBtn,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Feather name={icon} size={18} color={v.text} style={styles.icon} />}
          <Text style={[styles.label, { color: v.text }, textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  outlined: {
    borderWidth: 1.5,
  },
  textBtn: {
    height: 'auto',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
