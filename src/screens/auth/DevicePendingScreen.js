import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';

export default function DevicePendingScreen() {
  const { retryDeviceCheck, logout, currentAccount } = useAuth();
  const [checking, setChecking] = useState(false);
  const [autoCheckCount, setAutoCheckCount] = useState(0);

  // Auto-check every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      retryDeviceCheck();
      setAutoCheckCount((c) => c + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, [retryDeviceCheck]);

  const handleManualCheck = () => {
    setChecking(true);
    retryDeviceCheck();
    setTimeout(() => setChecking(false), 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="shield" size={56} color={colors.warning} />
        </View>

        <AppText variant="h1" style={styles.title}>Waiting for Approval</AppText>

        <AppText variant="body" color={colors.darkGrey} style={styles.desc}>
          Your administrator has been notified that you are trying to log in from a new device.
        </AppText>

        <AppText variant="body" color={colors.darkGrey} style={styles.desc}>
          Please check back shortly. Once approved, you will be able to access the app.
        </AppText>

        {checking ? (
          <View style={styles.checkingRow}>
            <ActivityIndicator size="small" color={colors.navyBlue} />
            <AppText variant="body" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>
              Checking approval status...
            </AppText>
          </View>
        ) : (
          <Button
            label="Check Again"
            icon="refresh-cw"
            onPress={handleManualCheck}
            style={styles.checkBtn}
          />
        )}

        <View style={styles.infoBox}>
          <Feather name="clock" size={18} color={colors.navyBlue} />
          <AppText variant="caption" color={colors.darkGrey} style={styles.infoText}>
            We are automatically checking every 10 seconds. You can also tap the button above to check manually.
          </AppText>
        </View>

        <View style={styles.contactBox}>
          <Feather name="phone" size={16} color={colors.success} />
          <AppText variant="caption" color={colors.darkGrey} style={styles.infoText}>
            Please notify your administrator if you need urgent access.
          </AppText>
        </View>

        <Button
          label="Back to Login"
          variant="tertiary"
          onPress={logout}
          style={styles.backBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: colors.warning + '15', alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xxl,
  },
  title: { textAlign: 'center', marginBottom: spacing.base },
  desc: { textAlign: 'center', marginBottom: spacing.md, maxWidth: 300 },
  checkingRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.lg,
  },
  checkBtn: { marginTop: spacing.lg, marginBottom: spacing.lg, width: '100%' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.navyLight, borderRadius: radius.md,
    padding: spacing.base, width: '100%',
  },
  contactBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lightGrey,
    borderRadius: radius.md, padding: spacing.base, marginTop: spacing.md, width: '100%',
  },
  infoText: { flex: 1, marginLeft: spacing.md },
  backBtn: { marginTop: spacing.xl },
});
