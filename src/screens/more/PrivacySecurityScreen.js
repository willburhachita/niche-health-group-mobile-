import React from 'react';
import { View, Pressable, ScrollView, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Divider } from '../../components/common/Divider';

const SETTINGS = [
  { icon: 'lock', label: 'Read Receipts', type: 'toggle', value: true, desc: 'Let others see when you have read messages' },
  { icon: 'users', label: 'Online Status', type: 'toggle', value: true, desc: 'Show your online status to other staff' },
  { icon: 'eye-off', label: 'Hide Last Seen', type: 'toggle', value: false, desc: 'Hide your last seen timestamp' },
];

export default function PrivacySecurityScreen({ navigation }) {
  const alert = useAlert();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Privacy & Security</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PRIVACY</AppText>
        {SETTINGS.map((item, i) => (
          <View key={item.label}>
            <View style={styles.row}>
              <Feather name={item.icon} size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
              <View style={{ flex: 1 }}>
                <AppText variant="body">{item.label}</AppText>
                <AppText variant="caption" color={colors.mediumGrey}>{item.desc}</AppText>
              </View>
              <Switch value={item.value} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
            </View>
            {i < SETTINGS.length - 1 && <Divider type="inset" />}
          </View>
        ))}

        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>SECURITY</AppText>
        <Pressable style={styles.row} onPress={() => navigation.navigate('TrustedDevices')}>
          <Feather name="smartphone" size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="body">Trusted Devices</AppText>
            <AppText variant="caption" color={colors.mediumGrey}>Manage devices that can access your account</AppText>
          </View>
          <Feather name="chevron-right" size={16} color={colors.lightGrey} />
        </Pressable>

        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>DANGER ZONE</AppText>
        <Pressable style={styles.row} onPress={() => alert({ type: 'error', title: 'Delete Account', message: 'Contact admin to delete your account.' })}>
          <Feather name="trash-2" size={20} color={colors.error} style={{ marginRight: spacing.md, width: 24 }} />
          <AppText variant="body" color={colors.error}>Delete Account</AppText>
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
