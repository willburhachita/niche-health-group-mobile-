import React from 'react';
import { View, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';

export default function AboutScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">About</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <AppText variant="h2" style={styles.name}>NHL Connect</AppText>
        <AppText variant="caption" color={colors.mediumGrey}>Version 1.0.0 (Build 1)</AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.desc}>
          Internal communication and management system for Niche Healthcare Limited. Built for doctors, nurses, pharmacists, and administrators.
        </AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.desc}>
          "You are in Safe Hands."
        </AppText>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.copyright}>
          Niche Healthcare Limited 2026. All rights reserved.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { alignItems: 'center', padding: spacing.xl, paddingTop: spacing.xxxl },
  logo: { width: 80, height: 80, marginBottom: spacing.xl },
  name: { marginBottom: spacing.xs },
  desc: { textAlign: 'center', marginTop: spacing.xl, maxWidth: 300 },
  copyright: { marginTop: spacing.xxxl },
});
