import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from './AppText';
import { Button } from './Button';

export const EmptyState = ({ icon = 'inbox', title, description, actionLabel, onAction, style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Feather name={icon} size={48} color={colors.lightGrey} />
      </View>
      <AppText variant="h2" style={styles.title}>{title}</AppText>
      {description && <AppText variant="body" color={colors.darkGrey} style={styles.desc}>{description}</AppText>}
      {actionLabel && <Button label={actionLabel} onPress={onAction} style={styles.button} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  iconCircle: { marginBottom: spacing.base },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  desc: { textAlign: 'center', maxWidth: 280, marginBottom: spacing.xl },
  button: { marginTop: spacing.sm },
});
