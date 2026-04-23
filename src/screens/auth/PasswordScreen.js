import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';

export default function PasswordScreen({ navigation, route }) {
  const { login } = useAuth();
  const convex = useConvex();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const email = route?.params?.email || '';

  const handleLogin = async () => {
    setError('');
    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await convex.mutation(api.auth.verifyPassword, { email, password });
      if (result.success) {
        login(result.account);
      } else {
        setIsSubmitting(false);
        setError('Incorrect password. Please try again.');
      }
    } catch {
      setIsSubmitting(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Password</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AppText variant="h1" style={styles.title}>Enter your password</AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.subtitle}>
          Enter the password provided to you by your administrator
        </AppText>

        <View style={styles.inputWrapper}>
          <Input
            placeholder="Password"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry={!showPassword}
            icon="lock"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.mediumGrey} />
          </Pressable>
        </View>

        {error ? (
          <AppText variant="caption" color={colors.error} style={styles.error}>{error}</AppText>
        ) : null}

        <Button
          label={isSubmitting ? 'Signing in...' : 'Sign In'}
          onPress={handleLogin}
          disabled={!password.trim() || isSubmitting}
          style={styles.submitBtn}
        />

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color={colors.navyBlue} />
          <AppText variant="caption" color={colors.darkGrey} style={styles.infoText}>
            Your password was sent to you by an administrator. Contact your admin if you need a new password.
          </AppText>
        </View>
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
  content: { padding: spacing.xl, flex: 1 },
  title: { marginBottom: spacing.sm },
  subtitle: { marginBottom: spacing.xl },
  inputWrapper: { position: 'relative' },
  eyeBtn: {
    position: 'absolute', right: spacing.base, top: 16,
  },
  error: { marginTop: spacing.sm },
  submitBtn: { marginTop: spacing.lg },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    padding: spacing.base,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
  },
  infoText: { flex: 1, lineHeight: 18 },
});
