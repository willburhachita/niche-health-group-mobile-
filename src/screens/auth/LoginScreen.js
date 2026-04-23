import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export default function LoginScreen({ navigation }) {
  const convex = useConvex();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const handleContinue = async () => {
    setError('');
    setIsChecking(true);
    try {
      const account = await convex.query(api.auth.getAccountByEmail, { email: email.trim() });
      if (!account) {
        setError('No account found with this email address');
        setIsChecking(false);
        return;
      }
      setIsChecking(false);
      navigation.navigate('OTP', { email: account.email });
    } catch {
      setError('Something went wrong. Please try again.');
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Log In</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AppText variant="h1" style={styles.title}>Welcome back</AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.subtitle}>
          Enter your email address to receive a verification code
        </AppText>

        <Input
          placeholder="Email address"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? (
          <AppText variant="caption" color={colors.error} style={styles.error}>{error}</AppText>
        ) : null}

        <Button
          label={isChecking ? 'Checking...' : 'Send Verification Code'}
          onPress={handleContinue}
          disabled={!isValid || isChecking}
          style={styles.submitBtn}
        />

        <AppText variant="caption" color={colors.mediumGrey} style={styles.terms}>
          A verification code will be sent to your email via SendGrid
        </AppText>
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
  error: { marginTop: spacing.sm },
  submitBtn: { marginTop: spacing.lg },
  terms: { marginTop: spacing.xl, textAlign: 'center' },
});
