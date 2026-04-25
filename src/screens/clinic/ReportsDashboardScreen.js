import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatBar, RevenueBar } from '../../components/clinic/StatBar';
import { Avatar } from '../../components/common/Avatar';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Static chart data — will be replaced with real aggregation queries in the future
const dailyRevenue = [
  { day: 'Mon', amount: 2400 },
  { day: 'Tue', amount: 1800 },
  { day: 'Wed', amount: 3200 },
  { day: 'Thu', amount: 2900 },
  { day: 'Fri', amount: 3600 },
  { day: 'Today', amount: 1500 },
];
const appointmentsByType = [
  { type: 'General Consultation', count: 0, percentage: 0, color: colors.navyBlue },
  { type: 'Follow-up', count: 0, percentage: 0, color: colors.peach },
  { type: 'Emergency', count: 0, percentage: 0, color: colors.error },
  { type: 'Telehealth', count: 0, percentage: 0, color: colors.success },
];
const topProviders = [];
function getMaxRevenue() {
  return Math.max(...dailyRevenue.map(d => d.amount), 1);
}

const PERIODS = ['This Week', 'This Month'];

export default function ReportsDashboardScreen({ navigation }) {
  const [period, setPeriod] = useState('This Month');
  const todayStats = useQuery(api.appointments.todayStats) ?? { total: 0, completed: 0, cancelled: 0, pending: 0 };
  const outstanding = useQuery(api.invoices.outstandingTotal) ?? 0;
  const maxRev = getMaxRevenue();

  const STAT_CARDS = [
    { label: 'Appointments', value: todayStats.total, trend: 0, icon: 'calendar', color: colors.navyBlue },
    { label: 'Outstanding', value: formatCurrency(outstanding), trend: 0, icon: 'credit-card', color: colors.peach },
    { label: 'Completed', value: todayStats.completed, trend: 0, icon: 'users', color: colors.success },
    { label: 'Cancelled', value: todayStats.cancelled, trend: 0, icon: 'x-circle', color: todayStats.cancelled > 0 ? colors.error : colors.success },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Reports</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Period Picker */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <Pressable
              key={p}
              style={[styles.periodPill, period === p && styles.periodPillActive]}
              onPress={() => setPeriod(p)}
            >
              <AppText variant="caption" color={period === p ? colors.white : colors.navyBlue}>{p}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <Feather name={s.icon} size={16} color={s.color} />
              </View>
              <AppText variant="h3">{s.value}</AppText>
              <AppText variant="small" color={colors.mediumGrey} numberOfLines={1}>{s.label}</AppText>
              <View style={styles.trendRow}>
                <Feather
                  name={s.trend >= 0 ? 'trending-up' : 'trending-down'}
                  size={12}
                  color={s.label === 'No-Shows' ? (s.trend <= 0 ? colors.success : colors.error) : (s.trend >= 0 ? colors.success : colors.error)}
                />
                <AppText
                  variant="small"
                  color={s.label === 'No-Shows' ? (s.trend <= 0 ? colors.success : colors.error) : (s.trend >= 0 ? colors.success : colors.error)}
                  style={{ marginLeft: 2 }}
                >
                  {Math.abs(s.trend)}%
                </AppText>
              </View>
            </View>
          ))}
        </View>

        {/* Revenue Chart */}
        <SectionHeader title="Revenue Overview" />
        <Card style={{ marginHorizontal: spacing.base }}>
          <View style={styles.chartRow}>
            {dailyRevenue.map((d, i) => (
              <RevenueBar
                key={i}
                label={d.day}
                amount={d.amount}
                maxAmount={maxRev}
                color={d.day === 'Today' ? colors.navyBlue : colors.peach}
              />
            ))}
          </View>
        </Card>

        {/* Appointment Breakdown */}
        <SectionHeader title="Appointment Breakdown" />
        <View style={{ paddingHorizontal: spacing.base }}>
          {appointmentsByType.map((item, i) => (
            <StatBar
              key={i}
              label={item.type}
              value={item.count}
              percentage={item.percentage}
              color={item.color}
            />
          ))}
        </View>

        {/* Top Providers */}
        <SectionHeader title="Top Providers" />
        <View style={{ paddingHorizontal: spacing.base }}>
          {topProviders.map((p, i) => (
            <View key={p.providerId} style={styles.providerRow}>
              <AppText variant="h3" color={colors.mediumGrey} style={styles.providerRank}>{i + 1}</AppText>
              <Avatar name={p.name} size={36} />
              <View style={styles.providerInfo}>
                <AppText variant="bodyBold">{p.name}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>
                  {p.appointments} appointments · {formatCurrency(p.revenue)}
                </AppText>
              </View>
            </View>
          ))}
        </View>
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
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  periodPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  periodPillActive: {
    backgroundColor: colors.navyBlue,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightGrey,
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: spacing.md,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  providerRank: {
    width: 24,
    textAlign: 'center',
    marginRight: spacing.sm,
  },
  providerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
});
