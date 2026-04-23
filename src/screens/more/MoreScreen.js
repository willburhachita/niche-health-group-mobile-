import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Divider } from '../../components/common/Divider';
import { useAuth } from '../../hooks/useAuth';

// Dynamic menu based on user role

export default function MoreScreen({ navigation }) {
  const { logout, hasPermission, role, currentAccount } = useAuth();
  const displayName = currentAccount?.displayName || currentAccount?.email || 'User';
  const roleLabel = (currentAccount?.role || 'member').charAt(0).toUpperCase() + (currentAccount?.role || 'member').slice(1);

  const canAccessClinic = hasPermission('clinicDashboard');
  const canAccessAdmin = hasPermission('adminPanel');

  const menu = [
    ...(canAccessClinic ? [{ section: 'Clinic Tools', items: [
      { icon: 'activity', label: 'Clinic Hub', screen: 'ClinicHub' },
      { icon: 'calendar', label: 'Appointments', screen: 'AppointmentsList' },
      { icon: 'users', label: 'Patients', screen: 'PatientDirectory' },
      { icon: 'credit-card', label: 'Billing & Invoices', screen: 'InvoicesList' },
      { icon: 'package', label: 'Stock & Inventory', screen: 'StockList' },
      { icon: 'truck', label: 'Suppliers', screen: 'SuppliersList' },
      { icon: 'dollar-sign', label: 'Payments', screen: 'PaymentsList' },
      { icon: 'file-minus', label: 'Expenses', screen: 'ExpensesList' },
      { icon: 'bar-chart-2', label: 'Reports', screen: 'ReportsDashboard' },
      { icon: 'video', label: 'Telehealth', screen: 'Telehealth' },
    ]}] : []),
    { section: 'General', items: [
      { icon: 'bell', label: 'Notifications', screen: 'NotificationsScreen' },
      { icon: 'file-text', label: 'Files & Documents', screen: 'Files' },
      { icon: 'users', label: 'Staff Directory', screen: 'StaffDirectory' },
      { icon: 'grid', label: 'Departments', screen: 'Departments' },
    ]},
    { section: 'Account', items: [
      { icon: 'user', label: 'My Profile', screen: 'Profile' },
      { icon: 'settings', label: 'Settings', screen: 'Settings' },
      { icon: 'shield', label: 'Privacy & Security', screen: 'PrivacySecurity' },
      { icon: 'smartphone', label: 'Trusted Devices', screen: 'TrustedDevices' },
    ]},
    ...(canAccessAdmin ? [{ 
      section: 'Administration', items: [
        { icon: 'shield', label: 'Admin Panel', screen: 'AdminPanel' },
        { icon: 'database', label: 'System Logs', screen: null },
      ]
    }] : []),
    { section: 'About', items: [
      { icon: 'info', label: 'About NHL Connect', screen: 'About' },
      { icon: 'help-circle', label: 'Help & Support', screen: null },
    ]},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h1">More</AppText>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Pressable style={styles.userCard} onPress={() => navigation.navigate('Profile')}>
          <Avatar name={displayName} size={56} showOnline onlineStatus="online" />
          <View style={styles.userInfo}>
            <AppText variant="h3">{displayName}</AppText>
            <AppText variant="caption" color={colors.darkGrey}>{roleLabel}</AppText>
          </View>
          <Feather name="chevron-right" size={16} color={colors.lightGrey} />
        </Pressable>

        {menu.map(section => (
          <View key={section.section}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>{section.section.toUpperCase()}</AppText>
            {section.items.map((item, i) => (
              <View key={item.label}>
                <Pressable
                  style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
                  onPress={() => item.screen && navigation.navigate(item.screen)}
                >
                  <Feather name={item.icon} size={20} color={colors.navyBlue} style={styles.menuIcon} />
                  <AppText variant="body" style={{ flex: 1 }}>{item.label}</AppText>
                  <Feather name="chevron-right" size={16} color={colors.lightGrey} />
                </Pressable>
                {i < section.items.length - 1 && <Divider type="inset" />}
              </View>
            ))}
          </View>
        ))}

        <Pressable style={[styles.menuItem, { marginTop: spacing.base }]} onPress={logout}>
          <Feather name="log-out" size={20} color={colors.error} style={styles.menuIcon} />
          <AppText variant="body" color={colors.error}>Log Out</AppText>
        </Pressable>

        <View style={{ height: TAB_BAR_HEIGHT }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
  userCard: {
    flexDirection: 'row', alignItems: 'center', padding: spacing.base,
    marginHorizontal: spacing.base, marginBottom: spacing.md,
    backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.lightGrey,
  },
  userInfo: { flex: 1, marginLeft: spacing.md },
  sectionLabel: { paddingHorizontal: spacing.base, paddingTop: spacing.xl, paddingBottom: spacing.sm, letterSpacing: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  menuIcon: { marginRight: spacing.md, width: 24 },
  pressed: { backgroundColor: colors.offWhite },
});
