import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { View, FlatList, Pressable, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { DateSeparator } from '../../components/chat/DateSeparator';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { formatDate } from '../../utils/dateHelpers';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function ChannelThreadScreen({ navigation, route }) {
  const { channelId } = route.params || {};
  const channel = useQuery(api.channels.getChannel, channelId ? { channelId } : 'skip');
  const messages = useQuery(api.channels.getChannelMessages, channelId ? { channelId } : 'skip') || [];
  const allUsers = useQuery(api.users.listUsers) || [];
  const sendMessage = useMutation(api.channels.sendChannelMessage);
  const markRead = useMutation(api.channels.markChannelRead);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;

  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync(colors.white);
        NavigationBar.setButtonStyleAsync('dark');
      }
      return () => {
        if (Platform.OS === 'android') {
          NavigationBar.setBackgroundColorAsync('transparent');
        }
      };
    }, [])
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const userMap = React.useMemo(() => {
    const m = {};
    for (const u of allUsers) m[u.externalId] = u;
    return m;
  }, [allUsers]);

  const mentionTargets = React.useMemo(() => {
    if (!channel?.members) return [];
    return channel.members
      .filter(id => id !== currentUserId)
      .map(id => userMap[id])
      .filter(Boolean);
  }, [channel?.members, currentUserId, userMap]);

  useEffect(() => {
    if (channelId) markRead({ channelId });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
  }, []);  // mount only

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.senderId !== currentUserId && channelId && currentUserId) {
      markRead({ channelId });
    }
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [messages.length]);

  const handleSend = useCallback(async (text, mentions) => {
    if (!text.trim()) return;
    await sendMessage({
      channelId,
      senderId: currentUserId,
      content: text,
      type: 'text',
      mentions: mentions?.length ? mentions : undefined,
    });
    if (channelId) markRead({ channelId });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
  }, [channelId, currentUserId, sendMessage, markRead]);

  const handleSendVoice = useCallback(async (localUri, durationSec) => {
    if (!channelId || !currentUserId) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(localUri);
      const blob = await response.blob();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/m4a' },
        body: blob,
      });
      const { storageId } = await uploadRes.json();
      await sendMessage({
        channelId,
        senderId: currentUserId,
        content: 'Voice note',
        type: 'voice',
        fileUrl: storageId,
        fileName: `voice_${durationSec}s.m4a`,
      });
      if (channelId) markRead({ channelId });
    } catch (e) {
      console.error('[VoiceNote] channel upload error:', e);
    }
  }, [channelId, currentUserId, generateUploadUrl, sendMessage, markRead]);

  const renderMessage = ({ item, index }) => {
    const isOwn = item.senderId === currentUserId;
    const prev = messages[index - 1];
    const showDate = !prev || formatDate(item.sentAt) !== formatDate(prev.sentAt);
    const sender = userMap[item.senderId];

    return (
      <View>
        {showDate && <DateSeparator label={formatDate(item.sentAt)} />}
        <ChatBubble
          message={{ ...item, id: item._id }}
          isOwn={isOwn}
          showSender
          senderName={sender?.displayName}
          currentUserId={currentUserId}
          userMap={userMap}
        />
      </View>
    );
  };

  const typingUserName = isTyping && mentionTargets[0]
    ? mentionTargets[0].displayName?.split(' ').pop()
    : null;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : (keyboardHeight > 0 ? 'height' : undefined)}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ChannelsList')} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name={channel?.type === 'private' ? 'lock' : 'hash'} size={18} color={colors.navyBlue} />
          <AppText variant="h3" style={{ marginLeft: spacing.xs }}>{channel?.displayName}</AppText>
          <AppText variant="small" color={colors.mediumGrey} style={{ marginLeft: spacing.sm }}>{channel?.memberCount}</AppText>
        </View>
        <Pressable onPress={() => navigation.navigate('ChannelInfo', { channelId })} hitSlop={12}>
          <Feather name="info" size={20} color={colors.navyBlue} />
        </Pressable>
      </View>

      {channel?.description && (
        <View style={styles.topicBar}>
          <AppText variant="caption" color={colors.darkGrey} numberOfLines={1}>{channel.description}</AppText>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => {
          if (messages.length > 0) flatListRef.current?.scrollToEnd({ animated: false });
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        ListFooterComponent={isTyping ? <TypingIndicator name={typingUserName} /> : null}
      />

      {/* Input */}
      <View style={[styles.inputWrapper, { paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom }]}>
        <ChatInput onSend={handleSend} onSendVoice={handleSendVoice} mentionTargets={mentionTargets} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.lightGrey,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md },
  topicBar: { 
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm, 
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.lightGrey 
  },
  messageList: { paddingVertical: spacing.md, flexGrow: 1 },
  inputWrapper: { backgroundColor: colors.white },
});
