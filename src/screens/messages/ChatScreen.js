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
import { FloatingChatButtons } from '../../components/chat/FloatingChatButtons';
import { formatDate } from '../../utils/dateHelpers';

export default function ChatScreen({ navigation, route }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const { conversationId } = route.params || {};
  const conversation = useQuery(api.messages.getConversation, conversationId ? { conversationId } : 'skip');
  const messages = useQuery(api.messages.getMessages, conversationId ? { conversationId, viewerId: currentUserId } : 'skip');
  const allUsers = useQuery(api.users.listUsers) || [];
  const sendMessage = useMutation(api.messages.sendMessage);
  const markRead = useMutation(api.messages.markConversationRead);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const editMessage = useMutation(api.messages.editMessage);
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const initialReadAtRef = useRef(null);
  const initialScrollDone = useRef(false);

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

  // Capture the readAt timestamp BEFORE we mark the conversation as read
  useEffect(() => {
    if (conversation && currentUserId && initialReadAtRef.current === null) {
      initialReadAtRef.current = conversation.readAt?.[currentUserId] ?? 0;
    }
  }, [conversation, currentUserId]);

  // Unread mentions: messages mentioning current user that arrived after last read
  const unreadMentions = React.useMemo(() => {
    if (!messages || !currentUserId) return [];
    const lastRead = initialReadAtRef.current ?? 0;
    return messages
      .map((m, i) => ({ ...m, _index: i }))
      .filter(m => m.mentions?.includes(currentUserId) && m.sentAt > lastRead);
  }, [messages, currentUserId]);

  const remainingMentions = Math.max(0, unreadMentions.length - mentionIndex);

  // Safety: stop auto-scrolling after 5s in case content keeps changing (images etc)
  useEffect(() => {
    const t = setTimeout(() => { initialScrollDone.current = true; }, 5000);
    return () => clearTimeout(t);
  }, []);

  // Called on every onContentSizeChange — receives (contentWidth, contentHeight)
  const doInitialScroll = useCallback((contentWidth, contentHeight) => {
    if (initialScrollDone.current) return;
    if (!messages?.length) return;

    const lastRead = initialReadAtRef.current ?? 0;

    // Priority 1: first unread @mention (scroll once, then done)
    const firstMentionIdx = messages.findIndex(
      m => m.mentions?.includes(currentUserId) && m.sentAt > lastRead
    );
    if (firstMentionIdx >= 0) {
      console.log(`[SCROLL] → scrollToIndex(${firstMentionIdx}) for @mention`);
      initialScrollDone.current = true;
      flatListRef.current?.scrollToIndex({ index: firstMentionIdx, animated: false, viewPosition: 0.3 });
      return;
    }

    // Priority 2: first unread message (scroll once, then done)
    if (lastRead > 0) {
      const firstUnreadIdx = messages.findIndex(m => m.sentAt > lastRead);
      if (firstUnreadIdx > 0) {
        console.log(`[SCROLL] → scrollToIndex(${firstUnreadIdx}) for first unread`);
        initialScrollDone.current = true;
        flatListRef.current?.scrollToIndex({ index: firstUnreadIdx, animated: false, viewPosition: 0.1 });
        return;
      }
    }

    // Priority 3: all read — use exact contentHeight to pin to true bottom
    console.log(`[SCROLL] → scrollToOffset(${Math.round(contentHeight)}) msgs=${messages.length}`);
    flatListRef.current?.scrollToOffset({ offset: contentHeight, animated: false });
  }, [messages, currentUserId]);

  // Mark conversation as read when screen mounts
  useEffect(() => {
    if (conversationId && currentUserId) markRead({ conversationId, userId: currentUserId });
  }, []);

  useEffect(() => {
    if (messages?.length) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.senderId !== currentUserId && conversationId && currentUserId) {
        markRead({ conversationId, userId: currentUserId });
      }
      if (isAtBottom) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
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

  const handleSendFile = useCallback(async (localUri, fileName, mimeType, type) => {
    if (!conversationId || !currentUserId) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(localUri);
      const blob = await response.blob();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': mimeType },
        body: blob,
      });
      const { storageId } = await uploadRes.json();
      await sendMessage({
        conversationId,
        senderId: currentUserId,
        content: type === 'image' ? '📷 Photo' : `📎 ${fileName}`,
        type,
        fileUrl: storageId,
        fileName,
      });
      if (currentUserId) markRead({ conversationId, userId: currentUserId });
    } catch (e) {
      console.error('[File] upload error:', e);
    }
  }, [conversationId, currentUserId, generateUploadUrl, sendMessage, markRead]);

  const handleSendLocation = useCallback(async (lat, lng) => {
    if (!conversationId || !currentUserId) return;
    await sendMessage({
      conversationId,
      senderId: currentUserId,
      content: `${lat},${lng}`,
      type: 'location',
    });
    if (currentUserId) markRead({ conversationId, userId: currentUserId });
  }, [conversationId, currentUserId, sendMessage, markRead]);

  const handleMentionPress = useCallback(() => {
    if (mentionIndex < unreadMentions.length) {
      const target = unreadMentions[mentionIndex];
      flatListRef.current?.scrollToIndex({ index: target._index, animated: true, viewPosition: 0.3 });
      setMentionIndex(prev => prev + 1);
    }
  }, [mentionIndex, unreadMentions]);

  const handleScrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleLongPress = useCallback((msg) => {
    Keyboard.dismiss();
    setSelectedMessage(msg);
  }, []);

  const handleDeleteForMe = useCallback(async () => {
    if (!selectedMessage) return;
    await deleteMessage({ messageId: selectedMessage._id, userId: currentUserId, forEveryone: false });
    setSelectedMessage(null);
  }, [selectedMessage, currentUserId, deleteMessage]);

  const handleUnsend = useCallback(async () => {
    if (!selectedMessage) return;
    await deleteMessage({ messageId: selectedMessage._id, userId: currentUserId, forEveryone: true });
    setSelectedMessage(null);
  }, [selectedMessage, currentUserId, deleteMessage]);

  const handleEdit = useCallback(() => {
    if (!selectedMessage) return;
    setEditingMessage(selectedMessage);
    setSelectedMessage(null);
  }, [selectedMessage]);

  const handleSendEdit = useCallback(async (newText) => {
    if (!editingMessage) return;
    await editMessage({ messageId: editingMessage._id, userId: currentUserId, newContent: newText });
    setEditingMessage(null);
  }, [editingMessage, currentUserId, editMessage]);

  const handleScroll = useCallback((e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    // Only show arrow when scrolled meaningfully above bottom
    if (distanceFromBottom > 250) {
      setIsAtBottom(false);
      initialScrollDone.current = true; // user scrolled up, stop pinning
    }
  }, []);

  const renderMessage = ({ item, index }) => {
    const isOwn = item.senderId === currentUserId;
    const msgList = messages || [];
    const prev = msgList[index - 1];
    const showDate = !prev || formatDate(item.sentAt) !== formatDate(prev.sentAt);
    const sender = userMap[item.senderId];
    const lastRead = initialReadAtRef.current ?? 0;
    const showUnreadSep = lastRead > 0 && prev && prev.sentAt <= lastRead && item.sentAt > lastRead;

    return (
      <View>
        {showDate && <DateSeparator label={formatDate(item.sentAt)} />}
        {showUnreadSep && (
          <View style={styles.unreadSeparator}>
            <View style={styles.unreadLine} />
            <AppText style={styles.unreadLabel}>New messages</AppText>
            <View style={styles.unreadLine} />
          </View>
        )}
        <ChatBubble
          message={{ ...item, id: item._id }}
          isOwn={isOwn}
          showSender={isGroup}
          senderName={sender?.displayName}
          currentUserId={currentUserId}
          userMap={userMap}
          onLongPress={() => handleLongPress(item)}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : (keyboardHeight > 0 ? 'height' : undefined)}
    >
      {/* Header — swaps to action bar on long-press */}
      <View style={styles.header}>
        {selectedMessage ? (
          <>
            <Pressable style={styles.actionBtn} onPress={() => setSelectedMessage(null)} hitSlop={10}>
              <Feather name="x" size={22} color={colors.black} />
              <AppText variant="small" color={colors.darkGrey} style={styles.actionLabel}>Cancel</AppText>
            </Pressable>
            <View style={styles.actionGroup}>
              {selectedMessage.senderId === currentUserId && selectedMessage.type === 'text' && (
                <Pressable style={styles.actionBtn} onPress={handleEdit} hitSlop={10}>
                  <Feather name="edit-2" size={20} color={colors.navyBlue} />
                  <AppText variant="small" color={colors.navyBlue} style={styles.actionLabel}>Edit</AppText>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn} onPress={handleDeleteForMe} hitSlop={10}>
                <Feather name="trash" size={20} color={colors.warning} />
                <AppText variant="small" color={colors.warning} style={styles.actionLabel}>Delete</AppText>
              </Pressable>
              {selectedMessage.senderId === currentUserId && (
                <Pressable style={styles.actionBtn} onPress={handleUnsend} hitSlop={10}>
                  <Feather name="trash-2" size={20} color={colors.error} />
                  <AppText variant="small" color={colors.error} style={styles.actionLabel}>Unsend</AppText>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
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
          </>
        )}
      </View>

      {/* Messages */}
      {!messages ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.navyBlue} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            initialNumToRender={messages?.length || 50}
            maxToRenderPerBatch={50}
            onScroll={handleScroll}
            scrollEventThrottle={100}
            onEndReached={() => setIsAtBottom(true)}
            onEndReachedThreshold={0.15}
            onContentSizeChange={doInitialScroll}
            onScrollToIndexFailed={(info) => {
              flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
          <FloatingChatButtons
            unreadMentionCount={remainingMentions}
            onMentionPress={handleMentionPress}
            showScrollToBottom={!isAtBottom}
            onScrollToBottom={handleScrollToBottom}
          />
          {/* Dark overlay + floating bubble when message selected */}
          {selectedMessage && (
            <Pressable style={styles.overlay} onPress={() => setSelectedMessage(null)}>
              <View
                style={[
                  styles.floatingBubble,
                  selectedMessage.senderId === currentUserId ? styles.floatingOwn : styles.floatingOther,
                ]}
              >
                <ChatBubble
                  message={selectedMessage}
                  isOwn={selectedMessage.senderId === currentUserId}
                  showSender={false}
                  currentUserId={currentUserId}
                  userMap={userMap}
                />
              </View>
            </Pressable>
          )}
        </View>
      )}

      {/* Input / Edit mode */}
      <View style={[styles.inputWrapper, { paddingBottom: keyboardHeight > 0 ? 0 : insets.bottom }]}>
        {editingMessage ? (
          <View style={styles.editBanner}>
            <Feather name="edit-2" size={14} color={colors.navyBlue} />
            <AppText variant="small" color={colors.navyBlue} style={{ flex: 1, marginLeft: spacing.xs }}>Editing message</AppText>
            <Pressable onPress={() => setEditingMessage(null)} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </View>
        ) : null}
        <ChatInput
          key={editingMessage?._id || 'normal'}
          initialText={editingMessage?.content}
          onSend={editingMessage ? handleSendEdit : handleSend}
          onSendVoice={editingMessage ? undefined : handleSendVoice}
          onSendFile={editingMessage ? undefined : handleSendFile}
          onSendLocation={editingMessage ? undefined : handleSendLocation}
          mentionTargets={mentionTargets}
          placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
        />
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
  // ── Action header ──
  actionGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  actionBtn: { alignItems: 'center', gap: 3 },
  actionLabel: { fontSize: 10 },
  // ── Message overlay ──
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    zIndex: 20,
  },
  floatingBubble: {
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  floatingOwn: { alignSelf: 'flex-end', marginRight: spacing.base },
  floatingOther: { alignSelf: 'flex-start', marginLeft: spacing.base },
  messageList: { paddingTop: spacing.md, paddingBottom: 20, flexGrow: 1 },
  inputWrapper: { backgroundColor: colors.white },
  editBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.xs, backgroundColor: colors.navyLight, gap: spacing.xs },
  unreadSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  unreadLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.peach,
  },
  unreadLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.peach,
    marginHorizontal: spacing.sm,
  },
});
