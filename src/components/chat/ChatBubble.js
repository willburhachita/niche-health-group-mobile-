import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Linking, Modal, Dimensions, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';
import { MentionText } from './MentionText';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { formatTime } from '../../utils/dateHelpers';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const ImageViewer = ({ uri, visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
    <Pressable style={imgViewerStyles.backdrop} onPress={onClose}>
      <Image source={{ uri }} style={imgViewerStyles.image} resizeMode="contain" />
      <Pressable style={imgViewerStyles.closeBtn} onPress={onClose}>
        <Feather name="x" size={24} color={colors.white} />
      </Pressable>
    </Pressable>
  </Modal>
);

const imgViewerStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  image: { width: SCREEN_W, height: SCREEN_H * 0.75 },
  closeBtn: { position: 'absolute', top: 50, right: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});

// Parse "lat,lng" from location message content
const parseLocation = (content) => {
  const match = (content || '').match(/([-\d.]+),([-\d.]+)/);
  if (!match) return null;
  return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
};

const staticMapUrl = (lat, lng) =>
  `https://maps.geoapify.com/v1/staticmap?style=osm-bright-smooth&width=400&height=250&center=lonlat:${lng},${lat}&zoom=15&marker=lonlat:${lng},${lat};color:%233B4B8A;size:medium&apiKey=0ddb714e7a8942cdbe2b4f52c4ebb21d`;

export const ChatBubble = ({ message, isOwn, showSender, senderName, currentUserId, userMap, onLongPress, isSelected }) => {
  const [viewerVisible, setViewerVisible] = useState(false);

  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.systemText}>{message.content}</AppText>
      </View>
    );
  }

  const mentionsMe = !isOwn && currentUserId && message.mentions?.includes(currentUserId);

  // ── Image message: standalone, no bubble wrapper ──
  if (message.type === 'image' && message.fileUrl) {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer, isSelected && styles.selected]}
      >
        {showSender && !isOwn && (
          <AppText variant="caption" color={colors.navyBlue} style={styles.sender}>{senderName}</AppText>
        )}
        <Pressable onPress={() => setViewerVisible(true)}>
          <Image
            source={{ uri: message.fileUrl }}
            style={[styles.imageMsg, isOwn ? styles.imageOwnRadius : styles.imageOtherRadius]}
            resizeMode="cover"
          />
          <View style={styles.imageTimeOverlay}>
            <AppText style={styles.imageTime}>{formatTime(message.sentAt)}</AppText>
          </View>
        </Pressable>
        <ImageViewer uri={message.fileUrl} visible={viewerVisible} onClose={() => setViewerVisible(false)} />
      </Pressable>
    );
  }

  // ── Location message ──
  if (message.type === 'location') {
    const loc = parseLocation(message.content);
    const mapsUrl = loc ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}` : null;
    return (
      <Pressable
        onLongPress={onLongPress}
        style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer, isSelected && styles.selected]}
      >
        {showSender && !isOwn && (
          <AppText variant="caption" color={colors.navyBlue} style={styles.sender}>{senderName}</AppText>
        )}
        <Pressable onPress={() => mapsUrl && Linking.openURL(mapsUrl)} style={styles.locationCard}>
          <View style={styles.locationMapPlaceholder}>
            <View style={styles.locationPin}>
              <Feather name="map-pin" size={28} color={colors.white} />
            </View>
            <AppText variant="small" color={colors.white} style={styles.locationCoords}>
              {loc ? `${parseFloat(loc.lat).toFixed(4)}, ${parseFloat(loc.lng).toFixed(4)}` : ''}
            </AppText>
          </View>
          <View style={styles.locationLabel}>
            <Feather name="map-pin" size={14} color={colors.navyBlue} />
            <AppText variant="small" color={colors.navyBlue} style={{ marginLeft: 4, flex: 1 }}>Shared location · Tap to open</AppText>
            <AppText style={styles.locationTime}>{formatTime(message.sentAt)}</AppText>
          </View>
        </Pressable>
      </Pressable>
    );
  }

  // ── Default bubble (text, voice, file) ──
  return (
    <Pressable
      onLongPress={onLongPress}
      style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer, isSelected && styles.selected]}
    >
      {showSender && !isOwn && (
        <AppText variant="caption" color={colors.navyBlue} style={styles.sender}>{senderName}</AppText>
      )}
      <View
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble,
          mentionsMe && styles.mentionedBubble,
          message.type === 'deleted' && styles.deletedBubble,
        ]}
      >
        {message.type === 'voice' ? (
          <VoiceMessagePlayer
            fileUrl={message.fileUrl}
            durationSec={parseInt((message.fileName || '').replace(/^voice_(\d+)s.*/, '$1')) || 0}
            isOwn={isOwn}
          />
        ) : message.type === 'file' && message.fileUrl ? (
          <Pressable style={styles.fileAttachment} onPress={() => Linking.openURL(message.fileUrl)}>
            <View style={[styles.fileIcon, { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.navyLight }]}>
              <Feather name="file-text" size={20} color={isOwn ? colors.white : colors.navyBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" color={isOwn ? colors.white : colors.black} numberOfLines={1}>{message.fileName || 'Document'}</AppText>
              <AppText variant="small" color={isOwn ? 'rgba(255,255,255,0.7)' : colors.mediumGrey}>Tap to open</AppText>
            </View>
          </Pressable>
        ) : (
          <MentionText
            content={message.content}
            userMap={userMap || {}}
            mentions={message.mentions}
            currentUserId={currentUserId}
            isOwn={message.type === 'deleted' ? false : isOwn}
          />
        )}
        <View style={styles.timeRow}>
          {message.editedAt && message.type !== 'deleted' && (
            <AppText variant="small" color={isOwn ? 'rgba(255,255,255,0.55)' : colors.lightGrey} style={{ marginRight: 4 }}>edited</AppText>
          )}
          <AppText variant="small" color={isOwn ? 'rgba(255,255,255,0.7)' : colors.mediumGrey}>
            {formatTime(message.sentAt)}
          </AppText>
        </View>
      </View>
    </Pressable>
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
  selected: { backgroundColor: 'rgba(59,75,138,0.07)', borderRadius: 8 },
  deletedBubble: { backgroundColor: colors.offWhite, borderWidth: 1, borderColor: colors.lightGrey },
  sender: { marginBottom: 2, marginLeft: 4 },
  timeRow: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: spacing.xs },
  time: { alignSelf: 'flex-end', marginTop: spacing.xs },
  systemContainer: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xxl },
  systemText: { textAlign: 'center' },

  // ── Image ──
  imageMsg: {
    width: 220,
    height: 220,
    borderRadius: 16,
  },
  imageOwnRadius: {
    borderBottomRightRadius: 4,
  },
  imageOtherRadius: {
    borderTopLeftRadius: 4,
  },
  imageTimeOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageTime: {
    fontSize: 11,
    color: colors.white,
  },

  // ── Location ──
  locationCard: {
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  locationMapPlaceholder: {
    width: 240,
    height: 130,
    backgroundColor: '#C8D8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationPin: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  locationCoords: {
    fontSize: 10,
    opacity: 0.7,
  },
  locationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  locationTime: {
    fontSize: 11,
    color: colors.mediumGrey,
  },

  // ── File ──
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 180,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
