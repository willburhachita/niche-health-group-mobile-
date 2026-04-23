import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';
import { MentionText } from './MentionText';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { formatTime } from '../../utils/dateHelpers';

export const ChatBubble = ({ message, isOwn, showSender, senderName, currentUserId, userMap }) => {
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.systemText}>{message.content}</AppText>
      </View>
    );
  }

  const mentionsMe = !isOwn && currentUserId && message.mentions?.includes(currentUserId);

  return (
    <View style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      {showSender && !isOwn && (
        <AppText variant="caption" color={colors.navyBlue} style={styles.sender}>{senderName}</AppText>
      )}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
          mentionsMe && styles.mentionedBubble,
        ]}
      >
        {message.type === 'voice' ? (
          <VoiceMessagePlayer
            fileUrl={message.fileUrl}
            durationSec={parseInt((message.fileName || '').replace(/^voice_(\d+)s.*/, '$1')) || 0}
            isOwn={isOwn}
          />
        ) : (
          <MentionText
            content={message.content}
            userMap={userMap || {}}
            mentions={message.mentions}
            currentUserId={currentUserId}
            isOwn={isOwn}
          />
        )}
        <AppText variant="small" color={isOwn ? 'rgba(255,255,255,0.7)' : colors.mediumGrey} style={styles.time}>
          {formatTime(message.sentAt)}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: spacing.base,
    maxWidth: '75%',
  },
  ownContainer: { alignSelf: 'flex-end' },
  otherContainer: { alignSelf: 'flex-start' },
  bubble: {
    padding: spacing.md,
    paddingHorizontal: spacing.base,
  },
  ownBubble: {
    backgroundColor: colors.navyBlue,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: colors.offWhite,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  mentionedBubble: {
    backgroundColor: colors.peachLight,
    borderLeftWidth: 3,
    borderLeftColor: colors.peach,
  },
  sender: { marginBottom: 2, marginLeft: 4 },
  time: { alignSelf: 'flex-end', marginTop: spacing.xs },
  systemContainer: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xxl },
  systemText: { textAlign: 'center' },
});
