import React from 'react';
import { View, Image, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

        <AppText variant="display" style={styles.heading}>
          Better care starts with better communication
        </AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.sub}>
          Your secure internal platform for Niche Healthcare
        </AppText>

        <View style={styles.cardRow}>
          <Card style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Feather name="message-circle" size={24} color={colors.navyBlue} />
            </View>
            <AppText variant="bodyBold" style={styles.featureTitle}>Messaging</AppText>
            <AppText variant="caption" color={colors.darkGrey} style={styles.featureDesc}>Stay connected with your team</AppText>
          </Card>
          <Card style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Feather name="shield" size={24} color={colors.navyBlue} />
            </View>
            <AppText variant="bodyBold" style={styles.featureTitle}>Secure</AppText>
            <AppText variant="caption" color={colors.darkGrey} style={styles.featureDesc}>Private and encrypted</AppText>
          </Card>
        </View>

        <View style={styles.buttons}>
          <Button label="Log In" onPress={() => navigation.navigate('Login')} style={styles.btn} />
        </View>

        <AppText variant="caption" color={colors.mediumGrey} style={styles.footer}>
          For Niche Healthcare staff only
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: spacing.xl, alignItems: 'center', paddingTop: spacing.xxxl },
  logo: { width: 220, height: 220, marginBottom: -spacing.md },
  heading: { textAlign: 'center', marginBottom: spacing.md },
  sub: { textAlign: 'center', marginBottom: spacing.xxl },
  cardRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xxl },
  featureCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  featureIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.navyLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  featureTitle: { textAlign: 'center', marginBottom: spacing.xs },
  featureDesc: { textAlign: 'center' },
  buttons: { width: '100%', gap: spacing.md },
  btn: { width: '100%' },
  footer: { marginTop: spacing.xl, textAlign: 'center' },
});
