import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { View, FlatList, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { DateSeparator } from '../../components/chat/DateSeparator';
import { formatDate } from '../../utils/dateHelpers';

export default function ChatScreen({ navigation, route }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const { conversationId } = route.params || {};
  const conversation = useQuery(api.messages.getConversation, conversationId ? { conversationId } : 'skip');
  const messages = useQuery(api.messages.getMessages, conversationId ? { conversationId } : 'skip');
  const allUsers = useQuery(api.users.listUsers) || [];
  const sendMessage = useMutation(api.messages.sendMessage);
  const markRead = useMutation(api.messages.markConversationRead);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  const isGroup = conversation?.type === 'group';
  const otherMembers = conversation?.members?.filter(m => m !== currentUserId) || [];
  const otherUser = !isGroup ? userMap[otherMembers[0]] : null;
  const title = isGroup ? (conversation?.name || 'Group Chat') : (otherUser?.displayName || 'Chat');

  // Mention targets: group members (excluding self) for @ autocomplete
  const mentionTargets = React.useMemo(() => {
    if (!conversation?.members) return [];
    return conversation.members
      .filter(id => id !== currentUserId)
      .map(id => userMap[id])
      .filter(Boolean);
  }, [conversation?.members, currentUserId, userMap]);

  // Mark conversation as read when screen mounts
  useEffect(() => {
    if (conversationId && currentUserId) markRead({ conversationId, userId: currentUserId });
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  }, []);

  useEffect(() => {
    if (messages?.length) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.senderId !== currentUserId && conversationId && currentUserId) {
        markRead({ conversationId, userId: currentUserId });
      }
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages?.length]);

  const handleSend = useCallback(async (text, mentions) => {
    if (!conversationId || !currentUserId) return;
    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: text,
      mentions: mentions?.length ? mentions : undefined,
    });
    if (currentUserId) markRead({ conversationId, userId: currentUserId });
  }, [conversationId, currentUserId, sendMessage, markRead]);

  const handleSendVoice = useCallback(async (localUri, durationSec) => {
    if (!conversationId || !currentUserId) return;
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
        conversationId,
        senderId: currentUserId,
        content: 'Voice note',
        type: 'voice',
        fileUrl: storageId,
        fileName: `voice_${durationSec}s.m4a`,
      });
      if (currentUserId) markRead({ conversationId, userId: currentUserId });
    } catch (e) {
      console.error('[VoiceNote] upload error:', e);
    }
  }, [conversationId, currentUserId, generateUploadUrl, sendMessage, markRead]);

  const renderMessage = ({ item, index }) => {
    const isOwn = item.senderId === currentUserId;
    const msgList = messages || [];
    const prev = msgList[index - 1];
    const showDate = !prev || formatDate(item.sentAt) !== formatDate(prev.sentAt);
    const sender = userMap[item.senderId];

    return (
      <View>
        {showDate && <DateSeparator label={formatDate(item.sentAt)} />}
        <ChatBubble
          message={{ ...item, id: item._id }}
          isOwn={isOwn}
          showSender={isGroup}
          senderName={sender?.displayName}
          currentUserId={currentUserId}
          userMap={userMap}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : (keyboardHeight > 0 ? 'height' : undefined)}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('ConversationsList')} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <Pressable style={styles.headerCenter} onPress={() => navigation.navigate('ChatInfo', { conversationId })}>
          <Avatar name={title} size={32} showOnline={!isGroup} onlineStatus={otherUser?.onlineStatus} />
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="h3" numberOfLines={1}>{title}</AppText>
            {isGroup && <AppText variant="small" color={colors.mediumGrey}>{conversation?.members?.length} members</AppText>}
          </View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('ChatInfo', { conversationId })} hitSlop={12}>
          <Feather name="info" size={20} color={colors.navyBlue} />
        </Pressable>
      </View>

      {/* Messages */}
      {!messages ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.navyBlue} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />
      )}

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
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.md, marginRight: spacing.md },
  messageList: { paddingVertical: spacing.md, flexGrow: 1 },
  inputWrapper: { backgroundColor: colors.white },
});
