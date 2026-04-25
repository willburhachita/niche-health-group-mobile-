import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Pressable, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function TelehealthCallScreen({ route, navigation }) {
  const { appointmentId, sessionId: existingSessionId } = route.params || {};
  const { currentUserId } = useAuth();

  const appointment = useQuery(api.appointments.get, appointmentId ? { id: appointmentId } : 'skip');
  const patient = useQuery(api.patients.get, appointment?.patientId ? { id: appointment.patientId } : 'skip');
  const existingSession = useQuery(api.telehealth.getByAppointment, appointmentId ? { appointmentId } : 'skip');

  const startSession = useMutation(api.telehealth.startSession);
  const endSessionMut = useMutation(api.telehealth.endSession);
  const updateNotesMut = useMutation(api.telehealth.updateNotes);
  const updateTranscriptionMut = useMutation(api.telehealth.updateTranscription);

  const [sessionId, setSessionId] = useState(existingSessionId || null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [callNotes, setCallNotes] = useState('');
  const [transcription, setTranscription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [createNoteOnEnd, setCreateNoteOnEnd] = useState(true);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef(null);
  const notesDebounceRef = useRef(null);
  const initRef = useRef(false);

  // Stable IDs for deps (avoid object reference changes from Convex queries)
  const patientIdFromApt = appointment?.patientId;
  const queriedSessionId = existingSession?._id;
  const queriedSessionStatus = existingSession?.status;

  // Initialize session on mount
  useEffect(() => {
    if (initRef.current) return;
    if (!patientIdFromApt || !currentUserId) return;
    if (sessionId) { initRef.current = true; return; }

    // Check if there's an existing active session
    if (queriedSessionId && (queriedSessionStatus === 'active' || queriedSessionStatus === 'waiting')) {
      initRef.current = true;
      setSessionId(queriedSessionId);
      if (existingSession?.callNotes) setCallNotes(existingSession.callNotes);
      if (existingSession?.transcription) setTranscription(existingSession.transcription);
      if (existingSession?.startedAt) {
        startTimeRef.current = existingSession.startedAt;
        setElapsed(Math.round((Date.now() - existingSession.startedAt) / 1000));
      }
      return;
    }

    // existingSession query still loading (undefined) — wait
    if (existingSession === undefined) return;

    // No active session found — start a new one
    initRef.current = true;
    startSession({
      appointmentId,
      patientId: patientIdFromApt,
      providerId: currentUserId,
      createdBy: currentUserId,
    }).then(id => {
      setSessionId(id);
      startTimeRef.current = Date.now();
    });
  }, [patientIdFromApt, currentUserId, queriedSessionId, queriedSessionStatus]);

  // Timer
  useEffect(() => {
    if (callEnded) return;
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded]);

  // Pulse animation for recording indicator
  useEffect(() => {
    if (!isRecording) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isRecording]);

  // Auto-save notes to backend (debounced)
  const saveNotes = useCallback((text) => {
    if (!sessionId) return;
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => {
      updateNotesMut({ sessionId, callNotes: text });
    }, 1500);
  }, [sessionId]);

  const handleNotesChange = (text) => {
    setCallNotes(text);
    saveNotes(text);
  };

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // Toggle simulated transcription recording
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Save accumulated transcription
      if (sessionId && transcription) {
        updateTranscriptionMut({ sessionId, transcription });
      }
    } else {
      setIsRecording(true);
    }
  };

  // End call flow
  const handleEndCall = async () => {
    setShowEndConfirm(false);
    setCallEnded(true);

    if (sessionId) {
      await endSessionMut({
        sessionId,
        callNotes: callNotes || undefined,
        transcription: transcription || undefined,
        createTreatmentNote: createNoteOnEnd,
      });
    }

    navigation.goBack();
  };

  // Appointment info
  const aptType = appointment?.type || 'Telehealth';
  const aptTime = appointment?.startTime
    ? new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <View style={styles.container}>
      {/* Top Info Bar */}
      <View style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.callIndicator}>
            <View style={styles.liveDot} />
            <AppText variant="small" color="#4ADE80">{callEnded ? 'Call Ended' : 'In Call'}</AppText>
          </View>
          <AppText variant="bodyBold" color={colors.white}>{formatDuration(elapsed)}</AppText>
        </View>
        <AppText variant="body" color={colors.white} style={{ marginTop: spacing.xs }}>
          {patient?.displayName || 'Connecting...'}
        </AppText>
        <AppText variant="small" color="rgba(255,255,255,0.5)">
          {aptType} · {aptTime}
        </AppText>
      </View>

      {/* Remote Video (patient side - placeholder) */}
      <View style={styles.videoArea}>
        <Avatar name={patient?.displayName || 'P'} size={110} />
        <AppText variant="h2" color={colors.white} style={{ marginTop: spacing.lg }}>
          {patient?.displayName || 'Patient'}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginTop: spacing.xs }}>
          {patient?.patientCode || ''}
        </AppText>

        {/* Connection status */}
        <View style={styles.connectionBadge}>
          <View style={[styles.connDot, { backgroundColor: '#4ADE80' }]} />
          <AppText variant="small" color="rgba(255,255,255,0.6)">Connected</AppText>
        </View>
      </View>

      {/* Self preview (doctor camera) */}
      <View style={styles.selfPreview}>
        <View style={[styles.selfCamera, !isCameraOn && styles.selfCameraOff]}>
          {isCameraOn ? (
            <>
              <Feather name="user" size={20} color="rgba(255,255,255,0.6)" />
              <AppText variant="small" color="rgba(255,255,255,0.5)">You</AppText>
            </>
          ) : (
            <Feather name="video-off" size={20} color={colors.mediumGrey} />
          )}
        </View>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <Animated.View style={[styles.recDot, { opacity: pulseAnim }]} />
          <AppText variant="small" color={colors.white}>Recording & Transcribing</AppText>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={styles.controlsBar}>
        <Pressable style={[styles.controlBtn, isMuted && styles.controlBtnActive]} onPress={() => setIsMuted(!isMuted)}>
          <Feather name={isMuted ? 'mic-off' : 'mic'} size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</AppText>
        </Pressable>

        <Pressable style={[styles.controlBtn, !isCameraOn && styles.controlBtnActive]} onPress={() => setIsCameraOn(!isCameraOn)}>
          <Feather name={isCameraOn ? 'video' : 'video-off'} size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>{isCameraOn ? 'Camera' : 'Off'}</AppText>
        </Pressable>

        <Pressable style={styles.endCallBtn} onPress={() => setShowEndConfirm(true)}>
          <Feather name="phone-off" size={24} color={colors.white} />
        </Pressable>

        <Pressable style={[styles.controlBtn, isRecording && styles.controlBtnRecording]} onPress={toggleRecording}>
          <Feather name={isRecording ? 'pause-circle' : 'disc'} size={22} color={isRecording ? '#F87171' : colors.white} />
          <AppText variant="small" color={isRecording ? '#F87171' : colors.white} style={styles.controlLabel}>
            {isRecording ? 'Stop' : 'Record'}
          </AppText>
        </Pressable>

        <Pressable style={[styles.controlBtn, showNotes && styles.controlBtnActive]} onPress={() => setShowNotes(true)}>
          <Feather name="edit-3" size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>Notes</AppText>
        </Pressable>
      </View>

      {/* ── Notes Panel (slide-up modal) ────────────────────────────── */}
      <Modal visible={showNotes} animationType="slide" transparent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.notesOverlay} onPress={() => setShowNotes(false)}>
            <Pressable style={styles.notesSheet} onPress={e => e.stopPropagation()}>
              {/* Panel Header */}
              <View style={styles.notesHeader}>
                <View>
                  <AppText variant="h3">Call Notes</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>
                    {patient?.displayName || 'Patient'} · {formatDuration(elapsed)}
                  </AppText>
                </View>
                <Pressable onPress={() => setShowNotes(false)} hitSlop={8}>
                  <Feather name="x" size={22} color={colors.black} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {/* Transcription Section */}
                <View style={styles.notesSectionHeader}>
                  <Feather name="disc" size={14} color={isRecording ? colors.error : colors.mediumGrey} />
                  <AppText variant="bodyBold" style={{ marginLeft: spacing.xs }}>Transcription</AppText>
                  {isRecording && (
                    <View style={styles.liveTag}>
                      <AppText variant="small" color={colors.white}>LIVE</AppText>
                    </View>
                  )}
                </View>

                {transcription ? (
                  <View style={styles.transcriptionBox}>
                    <AppText variant="body" color={colors.darkGrey}>{transcription}</AppText>
                  </View>
                ) : (
                  <View style={styles.transcriptionEmpty}>
                    <Feather name="mic" size={24} color={colors.lightGrey} />
                    <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                      {isRecording
                        ? 'Listening... Transcription will appear here'
                        : 'Tap the Record button during the call to start live transcription'
                      }
                    </AppText>
                  </View>
                )}

                {/* Manual input for transcription (simulated) */}
                {isRecording && (
                  <View style={{ marginHorizontal: spacing.base, marginBottom: spacing.md }}>
                    <TextInput
                      style={styles.transcriptionInput}
                      placeholder="Type what is being said..."
                      placeholderTextColor={colors.lightGrey}
                      value=""
                      onChangeText={(text) => {
                        if (text.endsWith('\n')) {
                          const line = text.trim();
                          if (line) {
                            const updated = transcription
                              ? `${transcription}\n[${formatDuration(elapsed)}] ${line}`
                              : `[${formatDuration(elapsed)}] ${line}`;
                            setTranscription(updated);
                          }
                        }
                      }}
                      onSubmitEditing={(e) => {
                        const line = e.nativeEvent.text.trim();
                        if (line) {
                          const updated = transcription
                            ? `${transcription}\n[${formatDuration(elapsed)}] ${line}`
                            : `[${formatDuration(elapsed)}] ${line}`;
                          setTranscription(updated);
                        }
                      }}
                      returnKeyType="send"
                    />
                    <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                      Press enter/send to add a transcription entry with timestamp
                    </AppText>
                  </View>
                )}

                <Divider style={{ marginVertical: spacing.sm }} />

                {/* Call Notes Section */}
                <View style={styles.notesSectionHeader}>
                  <Feather name="edit-3" size={14} color={colors.navyBlue} />
                  <AppText variant="bodyBold" style={{ marginLeft: spacing.xs }}>Doctor Notes</AppText>
                </View>

                <View style={{ paddingHorizontal: spacing.base, paddingBottom: spacing.xxl }}>
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    textAlignVertical="top"
                    placeholder="Type your clinical observations, key findings, follow-up items..."
                    placeholderTextColor={colors.lightGrey}
                    value={callNotes}
                    onChangeText={handleNotesChange}
                  />
                  <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                    Notes auto-save during the call
                  </AppText>

                  {/* Quick note buttons */}
                  <View style={styles.quickNotes}>
                    {['Vitals normal', 'Follow-up needed', 'Prescribe medication', 'Refer to specialist', 'Lab work ordered'].map(tag => (
                      <Pressable
                        key={tag}
                        style={styles.quickNoteChip}
                        onPress={() => {
                          const prefix = callNotes ? `${callNotes}\n` : '';
                          handleNotesChange(`${prefix}• ${tag}`);
                        }}
                      >
                        <AppText variant="small" color={colors.navyBlue}>{tag}</AppText>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── End Call Confirmation ────────────────────────────────────── */}
      <Modal visible={showEndConfirm} transparent animationType="fade">
        <Pressable style={styles.confirmOverlay} onPress={() => setShowEndConfirm(false)}>
          <Pressable style={styles.confirmSheet} onPress={e => e.stopPropagation()}>
            <View style={styles.confirmIconWrap}>
              <View style={styles.confirmIcon}>
                <Feather name="phone-off" size={28} color={colors.error} />
              </View>
            </View>
            <AppText variant="h2" style={{ textAlign: 'center', marginTop: spacing.md }}>End Call?</AppText>
            <AppText variant="body" color={colors.darkGrey} style={{ textAlign: 'center', marginTop: spacing.sm }}>
              This will end the telehealth session with {patient?.displayName || 'the patient'}.
              Duration: {formatDuration(elapsed)}
            </AppText>

            {/* Create treatment note toggle */}
            <Pressable
              style={styles.noteToggle}
              onPress={() => setCreateNoteOnEnd(!createNoteOnEnd)}
            >
              <View style={[styles.checkbox, createNoteOnEnd && styles.checkboxActive]}>
                {createNoteOnEnd && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>
                Auto-create treatment note from call
              </AppText>
            </Pressable>

            {(callNotes || transcription) && (
              <View style={styles.summaryPreview}>
                {callNotes && (
                  <AppText variant="small" color={colors.darkGrey} numberOfLines={2}>
                    Notes: {callNotes.substring(0, 80)}...
                  </AppText>
                )}
                {transcription && (
                  <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>
                    Transcription: {transcription.split('\n').length} entries
                  </AppText>
                )}
              </View>
            )}

            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              <Button label="End Call & Save" onPress={handleEndCall} style={{ backgroundColor: colors.error }} />
              <Pressable style={styles.cancelConfirm} onPress={() => setShowEndConfirm(false)}>
                <AppText variant="bodyBold" color={colors.navyBlue}>Continue Call</AppText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  topBar: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  callIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4ADE80',
    marginRight: spacing.xs,
  },
  videoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  connDot: {
    width: 6, height: 6, borderRadius: 3,
    marginRight: spacing.xs,
  },
  selfPreview: {
    position: 'absolute',
    bottom: 150,
    right: spacing.base,
  },
  selfCamera: {
    width: 90, height: 120,
    borderRadius: radius.lg,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  selfCameraOff: {
    backgroundColor: '#1E1E30',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  recordingBanner: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  recDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: spacing.sm,
  },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 52, height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  controlBtnRecording: { backgroundColor: 'rgba(239, 68, 68, 0.25)' },
  controlLabel: { marginTop: 2, fontSize: 9 },
  endCallBtn: {
    width: 64, height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Notes Panel */
  notesOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  notesSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
    minHeight: '60%',
    paddingBottom: spacing.xxl,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  liveTag: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  transcriptionBox: {
    marginHorizontal: spacing.base,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    maxHeight: 200,
  },
  transcriptionEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  transcriptionInput: {
    ...typography.body,
    color: colors.black,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    height: 44,
  },
  notesInput: {
    ...typography.body,
    color: colors.black,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    minHeight: 120,
  },
  quickNotes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickNoteChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    backgroundColor: colors.navyLight,
  },

  /* End Call Confirmation */
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  confirmSheet: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    maxWidth: 360,
  },
  confirmIconWrap: { alignItems: 'center' },
  confirmIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(239,68,68,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.lightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  summaryPreview: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
  },
  cancelConfirm: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
});
