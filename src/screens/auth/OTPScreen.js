import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useConvex, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { typography } from '../../constants/typography';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';

export default function OTPScreen({ navigation, route }) {
  const convex = useConvex();
  const sendOTPCode = useAction(api.notifications.sendOTPCode);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const email = route?.params?.email || '';

  useEffect(() => {
    inputs.current[0]?.focus();
    const interval = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const verifyCode = async (fullCode) => {
    setVerifying(true);
    try {
      const result = await convex.mutation(api.auth.verifyOTPCode, { email, code: fullCode });
      if (result.success) {
        navigation.navigate('Password', { email });
      } else {
        setError(result.error || 'Invalid verification code');
        triggerShake();
        setCode(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      triggerShake();
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    setError('');
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      verifyCode(newCode.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setCode(['', '', '', '', '', '']);
    try {
      const result = await sendOTPCode({ email });
      if (result.success) {
        setTimer(600);
        inputs.current[0]?.focus();
      } else {
        setError(result.error || 'Failed to resend. Please try again.');
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Mask email for display
  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Verification</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AppText variant="h1" style={styles.title}>Check your email</AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.subtitle}>
          We sent a verification code to {maskedEmail}
        </AppText>

        <Animated.View style={[styles.codeRow, { transform: [{ translateX: shakeAnim }] }]}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={ref => inputs.current[i] = ref}
              style={[styles.codeBox, digit && styles.codeBoxFilled, error && styles.codeBoxError]}
              value={digit}
              onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, ''), i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        {verifying && (
          <View style={styles.verifyingRow}>
            <ActivityIndicator size="small" color={colors.navyBlue} />
            <AppText variant="caption" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Verifying...</AppText>
          </View>
        )}

        {error ? (
          <AppText variant="caption" color={colors.error} style={styles.error}>{error}</AppText>
        ) : null}

        {timer > 0 ? (
          <AppText variant="caption" color={colors.mediumGrey} style={styles.timer}>
            Code expires in {formatTimer(timer)}
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.error} style={styles.timer}>
            Code expired
          </AppText>
        )}

        {resending ? (
          <View style={styles.resendRow}>
            <ActivityIndicator size="small" color={colors.navyBlue} />
            <AppText variant="caption" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Sending new code...</AppText>
          </View>
        ) : (
          <Pressable onPress={handleResend} style={styles.resendRow}>
            <Feather name="refresh-cw" size={13} color={colors.navyBlue} />
            <AppText variant="bodyBold" color={colors.navyBlue} style={styles.resend}>Resend Code</AppText>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.lightGrey,
  },
  content: { padding: spacing.xl },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.xxl },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  codeBox: {
    width: 48, height: 56, borderWidth: 1.5, borderColor: colors.lightGrey,
    borderRadius: radius.md, textAlign: 'center',
    ...typography.h1, color: colors.black,
  },
  codeBoxFilled: { borderColor: colors.navyBlue },
  codeBoxError: { borderColor: colors.error },
  error: { textAlign: 'center', marginBottom: spacing.sm },
  timer: { textAlign: 'center', marginBottom: spacing.sm },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm },
  resend: { marginLeft: spacing.xs },
});
