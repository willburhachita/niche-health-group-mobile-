import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';
import { Badge } from '../common/Badge';

export const ChannelItem = ({ channel, onPress }) => {
  const hasUnread = channel.unreadCount > 0;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Feather name={channel.type === 'private' ? 'lock' : 'hash'} size={20} color={colors.navyBlue} style={styles.icon} />
      <View style={styles.content}>
        <AppText variant={hasUnread ? 'bodyBold' : 'body'}>{channel.displayName}</AppText>
        <AppText variant="caption" color={colors.mediumGrey}>{channel.memberCount} members</AppText>
      </View>
      {hasUnread ? <Badge count={channel.unreadCount} /> : <Feather name="chevron-right" size={16} color={colors.lightGrey} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  pressed: { backgroundColor: colors.offWhite },
  icon: { marginRight: spacing.md },
  content: { flex: 1 },
});
