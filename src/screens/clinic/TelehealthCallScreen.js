import React, { useState, useEffect, useRef } from 'react';
import {
  View, Pressable, StyleSheet, StatusBar,
  Modal, Platform, ActivityIndicator, Linking, TextInput, Switch, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

const MAX_DURATION = 3600; // 1-hour hard cap

export default function TelehealthCallScreen({ route, navigation }) {
  const {
    appointmentId,
    sessionId: routeSessionId,
    patientId: routePatientId,
  } = route.params || {};

  const { currentUserId, currentAccount } = useAuth();

  // ── Convex queries ─────────────────────────────────────────────────────
  const appointment  = useQuery(api.appointments.get, appointmentId ? { id: appointmentId } : 'skip');
  const effectivePid = appointment?.patientId || routePatientId;
  const patient      = useQuery(api.patients.get, effectivePid ? { id: effectivePid } : 'skip');
  const existingSession = useQuery(
    api.telehealth.getByAppointment,
    appointmentId ? { appointmentId } : 'skip'
  );
  // Live session (for participants + roomUrl when session already created)
  const [activeSessionId, setActiveSessionId] = useState(routeSessionId || null);
  const liveSession = useQuery(
    api.telehealth.get,
    activeSessionId ? { id: activeSessionId } : 'skip'
  );

  // ── Mutations ──────────────────────────────────────────────────────────
  const startSessionMut = useMutation(api.telehealth.startSession);
  const endSessionMut   = useMutation(api.telehealth.endSession);
  const joinSessionMut  = useMutation(api.telehealth.joinSession);
  const leaveSessionMut = useMutation(api.telehealth.leaveSession);

  // ── Local state ────────────────────────────────────────────────────────
  const [roomUrl, setRoomUrl]               = useState(null);
  const [elapsed, setElapsed]               = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showEndConfirm, setShowEndConfirm]  = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [callEnded, setCallEnded]            = useState(false);
  const [webviewLoading, setWebviewLoading]  = useState(true);
  const [callNotes, setCallNotes]            = useState('');
  const [createTreatmentNote, setCreateTreatmentNote] = useState(true);
  const initRef = useRef(false);

  // ── Live participants from Convex ──────────────────────────────────────
  const participants = liveSession?.participants || [];

  // ── Session initialisation ─────────────────────────────────────────────
  useEffect(() => {
    if (initRef.current) return;

    // Case 1: sessionId passed directly (instant session already created)
    if (routeSessionId) {
      if (liveSession === undefined) return; // still loading
      initRef.current = true;
      if (liveSession?.roomUrl) {
        setRoomUrl(liveSession.roomUrl);
        if (liveSession.startedAt) {
          setElapsed(Math.round((Date.now() - liveSession.startedAt) / 1000));
        }
      }
      _join(routeSessionId);
      return;
    }

    // Case 2: appointment-linked session
    if (!effectivePid || !currentUserId) return;
    if (appointmentId && existingSession === undefined) return;

    if (existingSession?.status === 'active' && existingSession?.roomUrl) {
      initRef.current = true;
      setActiveSessionId(existingSession._id);
      setRoomUrl(existingSession.roomUrl);
      if (existingSession.startedAt) {
        setElapsed(Math.round((Date.now() - existingSession.startedAt) / 1000));
      }
      _join(existingSession._id);
      return;
    }

    // No existing session — start one
    if (existingSession !== null && existingSession !== undefined) return; // already handled
    initRef.current = true;
    startSessionMut({
      appointmentId,
      patientId: effectivePid,
      providerId: currentUserId,
      createdBy: currentUserId,
    }).then(result => {
      const id  = result?.sessionId ?? result;
      const url = result?.roomUrl;
      setActiveSessionId(id);
      if (url) setRoomUrl(url);
      _join(id);
    });
  }, [effectivePid, currentUserId, existingSession, liveSession, routeSessionId]);

  // Update roomUrl from live session when it arrives
  useEffect(() => {
    if (liveSession?.roomUrl && !roomUrl) {
      setRoomUrl(liveSession.roomUrl);
    }
  }, [liveSession?.roomUrl]);

  const _join = (sid) => {
    if (!sid || !currentUserId || !currentAccount?.displayName) return;
    joinSessionMut({
      sessionId: sid,
      userId: currentUserId,
      displayName: currentAccount.displayName,
    });
  };

  // ── 1-hour timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (callEnded || !roomUrl) return;
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next === MAX_DURATION - 300) setShowTimeWarning(true);
        if (next >= MAX_DURATION) {
          clearInterval(interval);
          setShowEndConfirm(true);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [callEnded, roomUrl]);

  // ── Helpers ────────────────────────────────────────────────────────────
  const formatDuration = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  const handleEndCall = async () => {
    setCallEnded(true);
    setShowEndConfirm(false);
    const sid = activeSessionId || routeSessionId;
    if (sid) {
      if (currentUserId) {
        try { await leaveSessionMut({ sessionId: sid, userId: currentUserId }); } catch {}
      }
      try {
        await endSessionMut({
          sessionId: sid,
          callNotes: callNotes.trim() ? callNotes : undefined,
          createTreatmentNote,
        });
      } catch {}
    }
    navigation.goBack();
  };

  // Build Jitsi URL with inline config so no auth/lobby is needed
  const buildJitsiUrl = (url) => {
    if (!url) return null;
    const name = encodeURIComponent(currentAccount?.displayName || 'Provider');
    const cfg = [
      'config.prejoinPageEnabled=false',
      'config.startWithAudioMuted=false',
      'config.startWithVideoMuted=false',
      'config.disableDeepLinking=true',
      'config.enableWelcomePage=false',
      'config.enableClosePage=false',
      `userInfo.displayName="${name}"`,
    ].join('&');
    return `${url}#${cfg}`;
  };

  const jitsiUrl = buildJitsiUrl(roomUrl);
  const remaining = MAX_DURATION - elapsed;

  // ── Loading state ──────────────────────────────────────────────────────
  if (!jitsiUrl) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A14" />
        <ActivityIndicator size="large" color="#4ADE80" />
        <AppText variant="body" color="rgba(255,255,255,0.6)" style={{ marginTop: spacing.md }}>
          Setting up your session…
        </AppText>
        {patient && (
          <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginTop: spacing.xs }}>
            {patient.displayName}
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A14" />

      {/* ── HUD overlay ──────────────────────────────────────────────── */}
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <View style={styles.liveDot} />
          <AppText variant="small" color="#4ADE80" style={{ marginLeft: 5 }}>In Call</AppText>
        </View>

        <AppText variant="bodyBold" color={colors.white}>{formatDuration(elapsed)}</AppText>

        <Pressable
          style={styles.participantBtn}
          onPress={() => setShowParticipants(v => !v)}
        >
          <Feather name="users" size={13} color={colors.white} />
          <AppText variant="small" color={colors.white} style={{ marginLeft: 4 }}>
            {participants.length}
          </AppText>
        </Pressable>
      </View>

      {/* ── 5-min warning ────────────────────────────────────────────── */}
      {showTimeWarning && remaining > 0 && remaining <= 300 && (
        <View style={styles.warningBanner}>
          <Feather name="alert-triangle" size={13} color="#FCD34D" />
          <AppText variant="small" color="#FCD34D" style={{ marginLeft: 6 }}>
            {Math.ceil(remaining / 60)} min remaining — session ends at 1 hr
          </AppText>
        </View>
      )}

      {/* ── Conditional WebView or External Call Dashboard ─────────────────── */}
      {(() => {
        const isExternal = liveSession?.platform === 'zoom' || liveSession?.platform === 'meet';
        if (isExternal) {
          const platformLabel = liveSession.platform === 'zoom' ? 'Zoom' : 'Google Meet';
          const platformIcon = liveSession.platform === 'zoom' ? 'video' : 'video';
          
          return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.externalContainer}>
              <View style={styles.externalCard}>
                <View style={styles.externalIconBg}>
                  <Feather name={platformIcon} size={42} color="#4ADE80" />
                </View>
                <AppText variant="h2" color={colors.white} style={{ marginTop: spacing.md, textAlign: 'center' }}>
                  {platformLabel} Call Active
                </AppText>
                <AppText variant="body" color="rgba(255,255,255,0.6)" style={{ marginTop: spacing.sm, textAlign: 'center', paddingHorizontal: spacing.base }}>
                  This call is hosted externally. Launch {platformLabel} on your device to participate.
                </AppText>

                <View style={{ gap: spacing.md, marginTop: spacing.xl, width: '100%' }}>
                  <Button
                    label="Join External Call"
                    onPress={() => Linking.openURL(liveSession.roomUrl)}
                    style={{ backgroundColor: '#22C55E' }}
                  />
                  <Button
                    label="End Session"
                    onPress={() => setShowEndConfirm(true)}
                    style={{ backgroundColor: colors.error }}
                  />
                </View>
              </View>

              {/* Session Notes Panel */}
              <View style={styles.notesPanel}>
                <AppText variant="bodyBold" color={colors.white} style={{ marginBottom: spacing.sm }}>
                  Clinical Session Notes
                </AppText>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Record patient state, NHIMA logs, or clinical remarks..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  value={callNotes}
                  onChangeText={setCallNotes}
                  multiline
                  numberOfLines={5}
                />
                
                <View style={styles.switchRow}>
                  <AppText variant="small" color="rgba(255,255,255,0.7)" style={{ flex: 1 }}>
                    Auto-create Clinical Treatment Note
                  </AppText>
                  <Switch
                    value={createTreatmentNote}
                    onValueChange={setCreateTreatmentNote}
                    trackColor={{ false: '#767577', true: '#4ADE80' }}
                    thumbColor={Platform.OS === 'android' ? (createTreatmentNote ? '#22C55E' : '#f4f3f4') : ''}
                  />
                </View>
              </View>
            </ScrollView>
          );
        }

        return (
          <>
            <WebView
              source={{ uri: jitsiUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              startInLoadingState={false}
              // Android: grant camera/mic permission inline
              allowUniversalAccessFromFileURLs
              mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
              onLoadStart={() => setWebviewLoading(true)}
              onLoadEnd={() => setWebviewLoading(false)}
              // Intercept Jitsi hangup postMessage to trigger our end-call
              onMessage={(e) => {
                try {
                  const data = JSON.parse(e.nativeEvent.data);
                  if (data?.action === 'hangup') setShowEndConfirm(true);
                } catch {}
              }}
            />

            {/* WebView loading spinner */}
            {webviewLoading && (
              <View style={styles.webviewLoader}>
                <ActivityIndicator size="small" color="#4ADE80" />
              </View>
            )}

            {/* ── End call button ──────────────────────────────────────────── */}
            <View style={styles.endBar}>
              <Pressable style={styles.endBtn} onPress={() => setShowEndConfirm(true)}>
                <Feather name="phone-off" size={22} color={colors.white} />
              </Pressable>
            </View>
          </>
        );
      })()}

      {/* ── Participants panel ───────────────────────────────────────── */}
      {showParticipants && (
        <View style={styles.participantsPanel}>
          <View style={styles.panelHeader}>
            <AppText variant="bodyBold">
              Participants ({participants.length})
            </AppText>
            <Pressable onPress={() => setShowParticipants(false)} hitSlop={8}>
              <Feather name="x" size={18} color={colors.black} />
            </Pressable>
          </View>
          {participants.length === 0 ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <Feather name="user-x" size={24} color={colors.lightGrey} />
              <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.sm }}>
                No one else has joined yet
              </AppText>
              <AppText variant="small" color={colors.mediumGrey} style={{ textAlign: 'center', marginTop: spacing.xs }}>
                Invitees will appear here when they join
              </AppText>
            </View>
          ) : (
            participants.map((p, i) => (
              <View key={i} style={styles.participantRow}>
                <Avatar name={p.displayName} size={36} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <AppText variant="body">{p.displayName}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>
                    Joined {new Date(p.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </AppText>
                </View>
                <View style={styles.onlineDot} />
              </View>
            ))
          )}
        </View>
      )}

      {/* ── End call confirm ─────────────────────────────────────────── */}
      <Modal visible={showEndConfirm} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmSheet}>
            <View style={styles.confirmIcon}>
              <Feather name="phone-off" size={26} color={colors.error} />
            </View>
            <AppText variant="h3" style={{ textAlign: 'center', marginTop: spacing.md }}>
              End Call?
            </AppText>
            <AppText variant="body" color={colors.darkGrey} style={{ textAlign: 'center', marginTop: spacing.sm }}>
              {patient?.displayName || 'Patient'} · {formatDuration(elapsed)}
            </AppText>
            <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
              <Button
                label="End Call & Save"
                onPress={handleEndCall}
                style={{ backgroundColor: colors.error }}
              />
              <Pressable
                style={{ alignItems: 'center', paddingVertical: spacing.md }}
                onPress={() => setShowEndConfirm(false)}
              >
                <AppText variant="bodyBold" color={colors.navyBlue}>Continue Call</AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A14' },
  loadingContainer: {
    flex: 1, backgroundColor: '#0A0A14',
    alignItems: 'center', justifyContent: 'center',
  },
  webview: { flex: 1 },
  webviewLoader: {
    position: 'absolute',
    top: 100, left: 0, right: 0,
    alignItems: 'center',
  },

  // HUD
  hud: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 52 : 36,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: 'rgba(10,10,20,0.75)',
  },
  hudLeft: { flexDirection: 'row', alignItems: 'center' },
  liveDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  participantBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },

  // Warning
  warningBanner: {
    position: 'absolute',
    zIndex: 20,
    top: Platform.OS === 'ios' ? 100 : 84,
    left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.2)',
    paddingVertical: spacing.sm,
  },

  // End bar
  endBar: {
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 36 : spacing.lg,
    backgroundColor: 'rgba(10,10,20,0.85)',
  },
  endBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },

  // Participants panel
  participantsPanel: {
    position: 'absolute',
    bottom: 110, left: spacing.base, right: spacing.base,
    zIndex: 30,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    maxHeight: 340,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  participantRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4ADE80',
  },

  // End confirm
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center',
    padding: spacing.xl,
  },
  confirmSheet: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%', maxWidth: 340,
    alignItems: 'center',
  },
  confirmIcon: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(201,68,68,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // External call dashboard styles
  externalContainer: {
    padding: spacing.base,
    paddingTop: Platform.OS === 'ios' ? 120 : 100,
    paddingBottom: spacing.xl,
  },
  externalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  externalIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  notesPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notesInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: radius.md,
    color: colors.white,
    padding: spacing.md,
    height: 120,
    textAlignVertical: 'top',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
});
