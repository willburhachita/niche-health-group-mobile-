import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';
import { formatTimestamp } from '../../utils/dateHelpers';

export const NotificationItem = ({ notification, onPress }) => {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.container,
      !notification.isRead && styles.unread,
      pressed && styles.pressed,
    ]}>
      <View style={styles.iconCircle}>
        <Feather name={notification.icon} size={18} color={colors.navyBlue} />
      </View>
      <View style={styles.content}>
        <AppText variant="bodyBold" numberOfLines={1}>{notification.title}</AppText>
        <AppText variant="caption" color={colors.darkGrey} numberOfLines={2}>{notification.body}</AppText>
        <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(notification.createdAt)}</AppText>
      </View>
      {!notification.isRead && <View style={styles.dot} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.base,
    backgroundColor: colors.white,
  },
  unread: { backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.offWhite },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: { flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navyBlue,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
