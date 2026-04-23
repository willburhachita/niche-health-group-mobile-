import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { getAppointmentById } from '../../data/mockAppointments';
import { getPatientById } from '../../data/mockPatients';

export default function TelehealthCallScreen({ route, navigation }) {
  const { appointmentId } = route.params || {};
  const appointment = appointmentId ? getAppointmentById(appointmentId) : null;
  const patient = appointment?.patientId ? getPatientById(appointment.patientId) : null;

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Top Info */}
      <View style={styles.topBar}>
        <AppText variant="bodyBold" color={colors.white}>
          {patient?.displayName || 'Telehealth Call'}
        </AppText>
        <AppText variant="caption" color={colors.lightGrey}>{formatDuration(elapsed)}</AppText>
      </View>

      {/* Main Video Area (mock) */}
      <View style={styles.videoArea}>
        <Avatar name={patient?.displayName || 'Patient'} size={100} />
        <AppText variant="h2" color={colors.white} style={{ marginTop: spacing.base }}>
          {patient?.displayName || 'Connecting...'}
        </AppText>
        <AppText variant="caption" color={colors.lightGrey} style={{ marginTop: spacing.xs }}>
          {isCameraOn ? 'Camera preview would appear here' : 'Camera is off'}
        </AppText>
      </View>

      {/* Self Preview (mock) */}
      <View style={styles.selfPreview}>
        <View style={styles.selfCamera}>
          <Feather name="user" size={24} color={colors.mediumGrey} />
          <AppText variant="small" color={colors.mediumGrey}>You</AppText>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.controlsBar}>
        <Pressable
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={() => setIsMuted(!isMuted)}
        >
          <Feather name={isMuted ? 'mic-off' : 'mic'} size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>
            {isMuted ? 'Unmute' : 'Mute'}
          </AppText>
        </Pressable>

        <Pressable
          style={[styles.controlBtn, !isCameraOn && styles.controlBtnActive]}
          onPress={() => setIsCameraOn(!isCameraOn)}
        >
          <Feather name={isCameraOn ? 'video' : 'video-off'} size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>
            {isCameraOn ? 'Camera' : 'Off'}
          </AppText>
        </Pressable>

        <Pressable style={styles.endCallBtn} onPress={handleEndCall}>
          <Feather name="phone-off" size={24} color={colors.white} />
        </Pressable>

        <Pressable style={styles.controlBtn} onPress={() => {}}>
          <Feather name="message-circle" size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>Chat</AppText>
        </Pressable>

        <Pressable
          style={styles.controlBtn}
          onPress={() => {
            if (appointment?.patientId) {
              navigation.navigate('TreatmentNote', { patientId: appointment.patientId });
            }
          }}
        >
          <Feather name="file-text" size={22} color={colors.white} />
          <AppText variant="small" color={colors.white} style={styles.controlLabel}>Notes</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  topBar: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  videoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfPreview: {
    position: 'absolute',
    bottom: 140,
    right: spacing.base,
  },
  selfCamera: {
    width: 90,
    height: 120,
    borderRadius: radius.lg,
    backgroundColor: '#2A2A3E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  controlLabel: {
    marginTop: 2,
    fontSize: 9,
  },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
