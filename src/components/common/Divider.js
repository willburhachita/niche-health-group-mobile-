import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

export const Divider = ({ type = 'full', style }) => {
  const typeStyles = {
    full: {},
    inset: { marginLeft: spacing.base },
    avatarInset: { marginLeft: 72 },
    section: { height: 8, backgroundColor: colors.offWhite, borderBottomWidth: 0 },
  };

  return <View style={[styles.base, typeStyles[type], style]} />;
};

const styles = StyleSheet.create({
  base: {
    height: 1,
    backgroundColor: colors.lightGrey,
  },
});
