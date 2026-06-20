import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Avatar } from '../common/Avatar';
import { AppText } from '../common/AppText';
import { formatTimestamp } from '../../utils/dateHelpers';
import { truncate } from '../../utils/formatters';

const formatPreview = (conversation) => {
  const t = conversation.lastMessageType;
  if (t === 'voice') return '🎤 Voice note';
  if (t === 'image') return '📷 Photo';
  if (t === 'file') return '📎 Document';
  if (t === 'location') return '📍 Location';
  return truncate(conversation.lastMessage, 45);
};

export const ConversationItem = ({ conversation, currentUserId, onPress }) => {
  const isGroup = conversation.type === 'group';
  const otherMemberId = !isGroup ? conversation.members.find(m => m !== currentUserId) : null;
  const convexDetail = conversation.memberDetails?.find(d => d.id === otherMemberId);
  const name = isGroup
    ? (conversation.name || 'Group Chat')
    : (convexDetail?.displayName || 'Staff Member');
  const status = convexDetail?.onlineStatus;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Avatar name={name} size={48} showOnline={!isGroup} onlineStatus={status} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <AppText variant="bodyBold" numberOfLines={1} style={styles.name}>{name}</AppText>
          <AppText variant="caption" color={colors.mediumGrey}>{formatTimestamp(conversation.lastMessageAt)}</AppText>
        </View>
        <View style={styles.bottomRow}>
          <AppText variant="body" color={colors.darkGrey} numberOfLines={1} style={styles.preview}>
            {formatPreview(conversation)}
          </AppText>
          {conversation.unreadBy?.[currentUserId] === true && <View style={styles.unreadDot} />}
        </View>
      </View>
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
  content: { flex: 1, marginLeft: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flex: 1, marginRight: spacing.sm },
  preview: { flex: 1, marginRight: spacing.sm },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.peach, flexShrink: 0,
  },
});
