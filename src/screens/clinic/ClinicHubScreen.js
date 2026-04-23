import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { SectionHeader } from '../../components/common/SectionHeader';
import { AppointmentCard } from '../../components/clinic/AppointmentCard';
import { PatientCard } from '../../components/clinic/PatientCard';
import { ClinicQuickAction } from '../../components/clinic/ClinicQuickAction';
import { Divider } from '../../components/common/Divider';
import { getTodaysAppointments, getPendingAppointmentsCount } from '../../data/mockAppointments';
import { getRecentPatients } from '../../data/mockPatients';
import { getTotalOutstanding, formatCurrency } from '../../data/mockInvoices';
import { getPendingNotesCount } from '../../data/mockTreatmentNotes';
import { getLowStockItems, getExpiringSoonItems, getExpiredItems } from '../../data/mockStock';

const QUICK_STATS = [
  { key: 'appointments', icon: 'calendar', label: 'Today' },
  { key: 'notes', icon: 'file-text', label: 'Pending' },
  { key: 'invoices', icon: 'credit-card', label: 'Invoices Due' },
  { key: 'lowStock', icon: 'alert-triangle', label: 'Low Stock' },
  { key: 'expiring', icon: 'clock', label: 'Expiring' },
];

export default function ClinicHubScreen({ navigation }) {
  const todaysAppointments = getTodaysAppointments().filter(a => a.status !== 'open');
  const recentPatients = getRecentPatients(3);
  const pendingNotes = getPendingNotesCount();
  const outstanding = getTotalOutstanding();
  const pendingApts = getPendingAppointmentsCount();

  const lowStockCount = getLowStockItems().length;
  const expiringCount = getExpiringSoonItems().length + getExpiredItems().length;

  const statValues = {
    appointments: todaysAppointments.length,
    notes: pendingNotes,
    invoices: outstanding > 0 ? formatCurrency(outstanding) : '0',
    lowStock: lowStockCount,
    expiring: expiringCount,
  };

  const statColors = {
    appointments: colors.navyBlue,
    notes: colors.warning,
    invoices: colors.peach,
    lowStock: lowStockCount > 0 ? colors.warning : colors.success,
    expiring: expiringCount > 0 ? colors.error : colors.success,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Clinic</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Quick Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
          {QUICK_STATS.map(s => (
            <View key={s.key} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: statColors[s.key] + '18' }]}>
                <Feather name={s.icon} size={16} color={statColors[s.key]} />
              </View>
              <AppText variant="h3" style={styles.statValue}>
                {typeof statValues[s.key] === 'number' ? statValues[s.key] : statValues[s.key]}
              </AppText>
              <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{s.label}</AppText>
            </View>
          ))}
        </ScrollView>

        {/* Today's Appointments */}
        <SectionHeader
          title="Today's Appointments"
          action="See All"
          onAction={() => navigation.navigate('AppointmentsList')}
        />
        {todaysAppointments.length > 0 ? (
          todaysAppointments.slice(0, 3).map(apt => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: apt.id })}
            />
          ))
        ) : (
          <AppText variant="body" color={colors.mediumGrey} style={styles.empty}>No appointments today</AppText>
        )}

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.actionsGrid}>
          <ClinicQuickAction
            icon="calendar"
            label="Book Appointment"
            color={colors.navyBlue}
            onPress={() => navigation.navigate('BookAppointment')}
          />
          <ClinicQuickAction
            icon="search"
            label="Patient Lookup"
            color={colors.success}
            onPress={() => navigation.navigate('PatientDirectory')}
          />
          <ClinicQuickAction
            icon="file-text"
            label="Treatment Note"
            color={colors.warning}
            onPress={() => navigation.navigate('TreatmentNote', { patientId: null })}
          />
          <ClinicQuickAction
            icon="credit-card"
            label="Create Invoice"
            color={colors.peach}
            onPress={() => navigation.navigate('CreateInvoice')}
          />
          <ClinicQuickAction
            icon="bar-chart-2"
            label="Reports"
            color={colors.navyDark}
            onPress={() => navigation.navigate('ReportsDashboard')}
          />
          <ClinicQuickAction
            icon="video"
            label="Telehealth"
            color={colors.success}
            onPress={() => navigation.navigate('Telehealth')}
          />
          <ClinicQuickAction
            icon="package"
            label="Stock"
            color={colors.darkGrey}
            onPress={() => navigation.navigate('StockList')}
          />
          <ClinicQuickAction
            icon="dollar-sign"
            label="Payments"
            color={colors.success}
            onPress={() => navigation.navigate('PaymentsList')}
          />
          <ClinicQuickAction
            icon="file-minus"
            label="Expenses"
            color={colors.error}
            onPress={() => navigation.navigate('ExpensesList')}
          />
        </View>

        {/* Recent Patients */}
        <SectionHeader
          title="Recent Patients"
          action="View All"
          onAction={() => navigation.navigate('PatientDirectory')}
        />
        {recentPatients.map((p, i) => (
          <React.Fragment key={p.id}>
            <PatientCard
              patient={p}
              onPress={() => navigation.navigate('PatientProfile', { patientId: p.id })}
            />
            {i < recentPatients.length - 1 && <Divider type="inset" />}
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  headerTitle: { flex: 1, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  statCard: {
    width: 90,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    alignItems: 'center',
    ...shadows.subtle,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: { marginBottom: 2 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    justifyContent: 'space-between',
  },
  empty: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.lg,
  },
});
