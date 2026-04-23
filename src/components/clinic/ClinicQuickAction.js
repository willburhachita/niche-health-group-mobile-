import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../common/AppText';

export const ClinicQuickAction = ({ icon, label, onPress, color = colors.navyBlue }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: color + '14' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <AppText variant="caption" color={colors.darkGrey} numberOfLines={1} style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  pressed: {
    backgroundColor: colors.offWhite,
    transform: [{ scale: 0.96 }],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
});
