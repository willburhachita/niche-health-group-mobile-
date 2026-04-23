import React from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Divider } from '../../components/common/Divider';

export default function AccountSettingsScreen({ navigation }) {
  const items = [
    { icon: 'user', label: 'Display Name', value: 'Dr. Sarah Mbewe' },
    { icon: 'mail', label: 'Email', value: 'sarah.mbewe@nichehealthcare.co.uk' },
    { icon: 'phone', label: 'Phone', value: '+447700900890' },
    { icon: 'globe', label: 'Language', value: 'English' },
    { icon: 'clock', label: 'Time Zone', value: 'GMT+2' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Account Settings</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PERSONAL INFORMATION</AppText>
        {items.map((item, i) => (
          <View key={item.label}>
            <Pressable style={styles.row}>
              <Feather name={item.icon} size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color={colors.mediumGrey}>{item.label}</AppText>
                <AppText variant="body">{item.value}</AppText>
              </View>
              <Feather name="chevron-right" size={16} color={colors.lightGrey} />
            </Pressable>
            {i < items.length - 1 && <Divider type="inset" />}
          </View>
        ))}

        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>SESSION</AppText>
        <Pressable style={styles.row}>
          <Feather name="refresh-cw" size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
          <AppText variant="body" style={{ flex: 1 }}>Active Sessions</AppText>
          <AppText variant="caption" color={colors.mediumGrey}>2 devices</AppText>
          <Feather name="chevron-right" size={16} color={colors.lightGrey} style={{ marginLeft: spacing.sm }} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  sectionLabel: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
});
