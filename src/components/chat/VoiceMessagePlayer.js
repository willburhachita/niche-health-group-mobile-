import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../common/AppText';

const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VoiceMessagePlayer = ({ fileUrl, durationSec = 0, isOwn }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused
  const [position, setPosition] = useState(0);
  const [totalMs, setTotalMs] = useState(durationSec * 1000);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const toggle = async () => {
    if (status === 'playing') {
      await soundRef.current?.pauseAsync();
      setStatus('paused');
      return;
    }

    if (status === 'paused' && soundRef.current) {
      await soundRef.current.playAsync();
      setStatus('playing');
      return;
    }

    if (!fileUrl) return;
    setStatus('loading');

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUrl },
        { shouldPlay: true },
        (s) => {
          if (!s.isLoaded) return;
          setPosition(s.positionMillis ?? 0);
          if (s.durationMillis) setTotalMs(s.durationMillis);
          if (s.didJustFinish) {
            setStatus('idle');
            setPosition(0);
            soundRef.current?.unloadAsync().catch(() => {});
            soundRef.current = null;
          }
        }
      );
      soundRef.current = sound;
      setStatus('playing');
    } catch (e) {
      console.error('[VoicePlayer] play error:', e);
      setStatus('idle');
    }
  };

  const progress = totalMs > 0 ? position / totalMs : 0;
  const displaySec = status === 'idle' ? durationSec : Math.floor(position / 1000);

  const fg = isOwn ? colors.white : colors.navyBlue;
  const track = isOwn ? 'rgba(255,255,255,0.25)' : colors.lightGrey;
  const fill = isOwn ? 'rgba(255,255,255,0.9)' : colors.navyBlue;

  return (
    <Pressable onPress={toggle} style={styles.container}>
      <View style={[styles.playBtn, { borderColor: fg }]}>
        {status === 'loading' ? (
          <Feather name="loader" size={13} color={fg} />
        ) : (
          <Feather name={status === 'playing' ? 'pause' : 'play'} size={13} color={fg} />
        )}
      </View>
      <View style={styles.middle}>
        <View style={[styles.track, { backgroundColor: track }]}>
          <View style={[styles.fill, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: fill }]} />
        </View>
      </View>
      <AppText variant="small" style={{ color: isOwn ? 'rgba(255,255,255,0.75)' : colors.mediumGrey }}>
        {fmt(displaySec)}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 180,
    paddingVertical: 2,
  },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});
