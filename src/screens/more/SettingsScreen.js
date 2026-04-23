import React from 'react';
import { View, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Divider } from '../../components/common/Divider';

const SETTINGS = [
  { section: 'Notifications', items: [
    { icon: 'bell', label: 'Push Notifications', type: 'toggle', value: true },
    { icon: 'volume-x', label: 'Quiet Hours', type: 'navigate', sub: '10:00 PM - 7:00 AM' },
    { icon: 'at-sign', label: 'Mention Notifications', type: 'toggle', value: true },
  ]},
  { section: 'Appearance', items: [
    { icon: 'type', label: 'Text Size', type: 'navigate', sub: 'Default' },
  ]},
  { section: 'Data & Storage', items: [
    { icon: 'download', label: 'Auto-Download Media', type: 'navigate', sub: 'Wi-Fi Only' },
    { icon: 'trash-2', label: 'Clear Cache', type: 'navigate', sub: '24 MB' },
  ]},
];

export default function SettingsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Settings</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView>
        {SETTINGS.map(section => (
          <View key={section.section}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>{section.section.toUpperCase()}</AppText>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <View style={styles.row}>
                  <Feather name={item.icon} size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="body">{item.label}</AppText>
                    {item.sub && <AppText variant="caption" color={colors.mediumGrey}>{item.sub}</AppText>}
                  </View>
                  {item.type === 'toggle' ? (
                    <Switch value={item.value} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
                  ) : (
                    <Feather name="chevron-right" size={16} color={colors.lightGrey} />
                  )}
                </View>
                {i < section.items.length - 1 && <Divider type="inset" />}
              </View>
            ))}
          </View>
        ))}
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
