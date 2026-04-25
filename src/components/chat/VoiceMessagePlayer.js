import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
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

// Generate a deterministic pseudo-waveform from a seed string
const generateWaveform = (seed, barCount = 28) => {
  let hash = 0;
  const s = seed || 'default';
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  const bars = [];
  for (let i = 0; i < barCount; i++) {
    hash = ((hash << 5) - hash + i * 7 + 13) | 0;
    const val = ((hash & 0x7fffffff) % 100) / 100;
    // Shape like speech: mid-range with occasional peaks, never flat
    bars.push(0.15 + val * 0.85);
  }
  return bars;
};

const BAR_COUNT = 28;
const BAR_WIDTH = 2.5;
const BAR_GAP = 1.5;
const MAX_BAR_HEIGHT = 24;
const MAX_RETRIES = 2;

export const VoiceMessagePlayer = ({ fileUrl, durationSec = 0, isOwn }) => {
  const [status, setStatus] = useState('idle'); // idle | loading | playing | paused | error
  const [position, setPosition] = useState(0);
  const [totalMs, setTotalMs] = useState(durationSec * 1000);
  const soundRef = useRef(null);
  const retryCount = useRef(0);

  const waveform = useMemo(() => generateWaveform(fileUrl, BAR_COUNT), [fileUrl]);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const loadAndPlay = async () => {
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
      retryCount.current = 0;
      setStatus('playing');
    } catch (e) {
      console.error('[VoicePlayer] play error:', e);
      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1;
        setTimeout(loadAndPlay, 1000);
      } else {
        retryCount.current = 0;
        setStatus('error');
      }
    }
  };

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
    // idle or error → load fresh
    await loadAndPlay();
  };

  const progress = totalMs > 0 ? position / totalMs : 0;
  const displaySec = status === 'idle' || status === 'error' ? durationSec : Math.floor(position / 1000);
  const playedBars = Math.floor(progress * BAR_COUNT);

  const fg = isOwn ? colors.white : colors.navyBlue;
  const barPlayed = isOwn ? 'rgba(255,255,255,0.9)' : colors.navyBlue;
  const barUnplayed = isOwn ? 'rgba(255,255,255,0.3)' : colors.lightGrey;

  return (
    <Pressable onPress={toggle} style={styles.container}>
      {/* Play / Pause button */}
      <View style={[styles.playBtn, { backgroundColor: fg }]}>
        {status === 'loading' ? (
          <ActivityIndicator size={14} color={isOwn ? colors.navyBlue : colors.white} />
        ) : (
          <Feather
            name={status === 'playing' ? 'pause' : 'play'}
            size={14}
            color={isOwn ? colors.navyBlue : colors.white}
          />
        )}
      </View>

      {/* Waveform bars */}
      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveform.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: Math.max(3, h * MAX_BAR_HEIGHT),
                  backgroundColor: i < playedBars ? barPlayed : barUnplayed,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Duration / position */}
      <AppText variant="small" style={[styles.time, { color: isOwn ? 'rgba(255,255,255,0.75)' : colors.mediumGrey }]}>
        {status === 'error' ? 'Retry' : fmt(displaySec)}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 200,
    paddingVertical: 4,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    height: MAX_BAR_HEIGHT,
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: BAR_GAP,
    height: MAX_BAR_HEIGHT,
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: BAR_WIDTH / 2,
  },
  time: {
    minWidth: 32,
    textAlign: 'right',
  },
});
