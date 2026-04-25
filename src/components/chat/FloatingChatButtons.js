import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';

/**
 * Floating action buttons for chat screens:
 * 1. @ mention button – jumps through unread mentions, shows badge count
 * 2. Scroll-to-bottom arrow – jumps to most recent message
 *
 * Props:
 *   unreadMentionCount  – number of remaining unread mentions (0 hides the @ button)
 *   onMentionPress      – called when @ button tapped
 *   showScrollToBottom   – whether to show the down-arrow
 *   onScrollToBottom     – called when arrow tapped
 */
export function FloatingChatButtons({
  unreadMentionCount = 0,
  onMentionPress,
  showScrollToBottom = false,
  onScrollToBottom,
}) {
  if (unreadMentionCount === 0 && !showScrollToBottom) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* @ mention jump button */}
      {unreadMentionCount > 0 && (
        <Pressable style={styles.fab} onPress={onMentionPress}>
          <AppText style={styles.atSymbol}>@</AppText>
          {unreadMentionCount > 1 && (
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>{unreadMentionCount}</AppText>
            </View>
          )}
        </Pressable>
      )}

      {/* Scroll to bottom */}
      {showScrollToBottom && (
        <Pressable style={styles.fab} onPress={onScrollToBottom}>
          <Feather name="chevron-down" size={22} color={colors.navyBlue} />
        </Pressable>
      )}
    </View>
  );
}

const FAB_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.base,
    bottom: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  atSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.navyBlue,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.peach,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
});
