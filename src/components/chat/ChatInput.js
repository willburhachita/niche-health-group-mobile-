import React, { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import { View, TextInput, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../common/AppText';
import { Avatar } from '../common/Avatar';
import { useAlert } from '../common/CustomAlert';

const ATTACHMENT_OPTIONS = [
  { icon: 'image', label: 'Photo', color: colors.navyBlue },
  { icon: 'file', label: 'Document', color: colors.peach },
  { icon: 'camera', label: 'Camera', color: colors.success },
  { icon: 'map-pin', label: 'Location', color: colors.warning },
];

/**
 * Build a handle string for a user (e.g. "Mbewe" or "James"). Used for @mention tokens.
 * Avoids spaces so the handle is selectable as a single token.
 */
const getUserHandle = (user) => {
  if (!user) return '';
  if (user.firstName && user.firstName.length > 1) return user.firstName;
  if (user.lastName) return user.lastName;
  const parts = (user.displayName || '').split(/[\s.]+/).filter(Boolean);
  return parts[parts.length - 1] || '';
};

const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const ChatInput = ({ onSend, onSendVoice, placeholder = 'Type a message...', mentionTargets = [] }) => {
  const [text, setText] = useState('');
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [attachOpen, setAttachOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [usedMentions, setUsedMentions] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordAnim = useRef(new Animated.Value(0)).current;
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const alert = useAlert();

  const handleChange = (val, sel) => {
    setText(val);
    // Detect @mention query — find the @ before cursor that's not followed by a space
    const cursor = sel?.start ?? val.length;
    const upToCursor = val.slice(0, cursor);
    const atIdx = upToCursor.lastIndexOf('@');
    if (atIdx >= 0) {
      const before = atIdx === 0 ? ' ' : upToCursor[atIdx - 1];
      const between = upToCursor.slice(atIdx + 1);
      if (/^\s$|^$/.test(before) && !/\s/.test(between)) {
        setMentionQuery({ query: between.toLowerCase(), start: atIdx, end: cursor });
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Re-validate mentions: only include ones still in the text
    const finalMentions = usedMentions.filter((id) => {
      const u = mentionTargets.find((x) => x.externalId === id);
      const handle = getUserHandle(u);
      return handle && new RegExp(`@${handle}\\b`, 'i').test(trimmed);
    });
    onSend && onSend(trimmed, finalMentions);
    setText('');
    setUsedMentions([]);
    setMentionQuery(null);
    setAttachOpen(false);
  };

  const pickMention = (user) => {
    if (!mentionQuery) return;
    const handle = getUserHandle(user);
    if (!handle) return;
    const before = text.slice(0, mentionQuery.start);
    const after = text.slice(mentionQuery.end);
    const insert = `@${handle} `;
    const newText = `${before}${insert}${after}`;
    setText(newText);
    setUsedMentions((prev) => (prev.includes(user.externalId) ? prev : [...prev, user.externalId]));
    setMentionQuery(null);
    const newCursor = before.length + insert.length;
    setSelection({ start: newCursor, end: newCursor });
  };

  const filteredMentionTargets = mentionQuery
    ? mentionTargets.filter((u) => {
        if (!mentionQuery.query) return true;
        const q = mentionQuery.query;
        return (
          (u.firstName || '').toLowerCase().startsWith(q) ||
          (u.lastName || '').toLowerCase().startsWith(q) ||
          (u.displayName || '').toLowerCase().includes(q)
        );
      })
    : [];

  const handleAttachmentOption = (opt) => {
    setAttachOpen(false);
    alert({
      type: 'info',
      title: `${opt.label} attachment`,
      message: `${opt.label} upload is coming soon. File attachments will be stored via Convex storage.`,
    });
  };

  const startRecording = async () => {
    if (isRecording || recordingRef.current) return; // guard against double-start
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert({ type: 'error', title: 'Microphone access denied', message: 'Please enable microphone access in your device settings.' });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordAnim, { toValue: 1, duration: 600, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(recordAnim, { toValue: 0, duration: 600, easing: Easing.ease, useNativeDriver: true }),
        ])
      ).start();
    } catch (e) {
      console.error('[VoiceNote] start error:', e);
      recordingRef.current = null;
      alert({ type: 'error', title: 'Recording failed', message: 'Could not start recording. Please try again.' });
    }
  };

  const stopRecording = async (cancelled) => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    recordAnim.stopAnimation();
    recordAnim.setValue(0);
    const recording = recordingRef.current;
    const duration = recordingDuration;
    recordingRef.current = null;
    setIsRecording(false);
    setRecordingDuration(0);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      if (!cancelled && duration > 0) {
        const uri = recording.getURI();
        if (uri && onSendVoice) onSendVoice(uri, duration);
      }
    } catch (e) {
      console.error('[VoiceNote] stop error:', e);
    }
  };

  const hasText = text.trim().length > 0;
  const recordScale = recordAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <View>
      {/* Mention autocomplete */}
      {mentionQuery && filteredMentionTargets.length > 0 && (
        <View style={styles.mentionList}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.mentionHeader}>
            MENTION STAFF
          </AppText>
          {filteredMentionTargets.slice(0, 5).map((u) => (
            <Pressable key={u.externalId} style={styles.mentionRow} onPress={() => pickMention(u)}>
              <Avatar name={u.displayName} size={28} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <AppText variant="bodyBold">{u.displayName}</AppText>
                <AppText variant="small" color={colors.mediumGrey}>
                  @{getUserHandle(u)} · {u.department || u.staffRole}
                </AppText>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Attachment options */}
      {attachOpen && (
        <View style={styles.attachSheet}>
          {ATTACHMENT_OPTIONS.map((opt) => (
            <Pressable key={opt.label} style={styles.attachOption} onPress={() => handleAttachmentOption(opt)}>
              <View style={[styles.attachIcon, { backgroundColor: `${opt.color}20` }]}>
                <Feather name={opt.icon} size={20} color={opt.color} />
              </View>
              <AppText variant="small" color={colors.darkGrey} style={{ marginTop: 4 }}>
                {opt.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.container}>
        {/* Plus / attachment toggle */}
        <Pressable
          style={styles.iconBtn}
          hitSlop={8}
          onPress={() => setAttachOpen((v) => !v)}
        >
          <Feather
            name={attachOpen ? 'x' : 'plus'}
            size={30}
            color={attachOpen ? colors.peach : colors.navyBlue}
          />
        </Pressable>

        <View style={styles.inputWrapper}>
          {isRecording ? (
            <View style={styles.recordingBar}>
              <Animated.View style={[styles.recordDot, { transform: [{ scale: recordScale }] }]} />
              <AppText variant="body" color={colors.error} style={{ marginLeft: spacing.sm }}>
                {fmtDuration(recordingDuration)}
              </AppText>
              <AppText variant="caption" color={colors.mediumGrey} style={{ marginLeft: spacing.sm }}>
                Release to send
              </AppText>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={(v) => handleChange(v, selection)}
              selection={selection}
              onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
              placeholder={placeholder}
              placeholderTextColor={colors.mediumGrey}
              multiline
              maxLength={2000}
            />
          )}
        </View>

        {/* Send or Voice note */}
        {hasText ? (
          <Pressable onPress={handleSend} style={styles.sendBtn} hitSlop={8}>
            <Feather name="send" size={26} color={colors.white} />
          </Pressable>
        ) : (
          <Pressable
            onPressIn={startRecording}
            onPressOut={() => stopRecording(false)}
            style={[styles.iconBtn, isRecording && styles.iconBtnRecording]}
            hitSlop={8}
          >
            <Feather name="mic" size={28} color={isRecording ? colors.white : colors.navyBlue} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
  },
  iconBtn: {
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 54,
    minHeight: 54,
  },
  iconBtnRecording: {
    backgroundColor: colors.error,
    borderRadius: radius.full,
  },
  sendBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navyBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: radius.full,
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.base,
    maxHeight: 120,
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.black,
    paddingVertical: spacing.sm,
  },
  recordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  recordDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  mentionList: {
    maxHeight: 220,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    paddingVertical: spacing.sm,
  },
  mentionHeader: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    letterSpacing: 1,
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  attachSheet: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGrey,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  attachOption: { alignItems: 'center' },
  attachIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
