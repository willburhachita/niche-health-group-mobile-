import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { Card } from '../../components/common/Card';
import { formatTimestamp } from '../../utils/dateHelpers';
import { exportPaymentsCSV } from '../../utils/documentHelpers';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const METHOD_META = {
  cash: { label: 'Cash', icon: 'dollar-sign' },
  mobile_money: { label: 'Mobile Money', icon: 'smartphone' },
  card: { label: 'Card', icon: 'credit-card' },
  nhima: { label: 'NHIMA', icon: 'shield' },
  bank_transfer: { label: 'Bank Transfer', icon: 'briefcase' },
  cheque: { label: 'Cheque', icon: 'file-text' },
};
function getMethodLabel(m) { return METHOD_META[m]?.label || m; }
function getMethodIcon(m) { return METHOD_META[m]?.icon || 'dollar-sign'; }

const FILTERS = ['All', 'Completed', 'Pending'];

export default function PaymentsListScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportPaymentsCSV(payments, patientMap);
    setExporting(false);
  };
  const allPayments = useQuery(api.paymentsClinic.list) ?? [];
  const summary = useQuery(api.paymentsClinic.summary) ?? { totalReceived: 0, totalPending: 0, completedCount: 0, pendingCount: 0 };
  const patients = useQuery(api.patients.list, {}) ?? [];

  const patientMap = useMemo(() => {
    const m = {};
    patients.forEach(p => { m[p._id] = p; });
    return m;
  }, [patients]);

  const payments = useMemo(() => {
    let items = [...allPayments];
    if (filter === 'Completed') items = items.filter(p => p.status === 'completed');
    if (filter === 'Pending') items = items.filter(p => p.status === 'pending');
    if (search.length > 0) {
      const q = search.toLowerCase();
      items = items.filter(p => {
        const patient = patientMap[p.patientId];
        return patient?.displayName?.toLowerCase().includes(q) || p.referenceNumber?.toLowerCase().includes(q);
      });
    }
    return items.sort((a, b) => b.paymentDate - a.paymentDate);
  }, [allPayments, filter, search, patientMap]);

  const renderItem = ({ item }) => {
    const patient = patientMap[item.patientId];
    const isCompleted = item.status === 'completed';
    return (
      <Pressable style={styles.payCard} onPress={() => item.invoiceId && navigation.navigate('InvoiceDetail', { invoiceId: item.invoiceId })}>
        <View style={[styles.methodIcon, { backgroundColor: isCompleted ? colors.success + '14' : colors.warning + '14' }]}>
          <Feather name={getMethodIcon(item.method)} size={16} color={isCompleted ? colors.success : colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.payTop}>
            <AppText variant="bodyBold">{formatCurrency(item.amount)}</AppText>
            <View style={[styles.statusDot, { backgroundColor: isCompleted ? colors.success : colors.warning }]} />
          </View>
          <AppText variant="caption" color={colors.darkGrey}>{patient?.displayName || 'Unknown'}</AppText>
          <AppText variant="small" color={colors.mediumGrey}>{getMethodLabel(item.method)}{item.referenceNumber ? ` · ${item.referenceNumber}` : ''} · {formatTimestamp(item.paymentDate)}</AppText>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Payments</AppText>
        <Pressable onPress={handleExport} hitSlop={8} disabled={exporting}>
          {exporting ? <ActivityIndicator size="small" color={colors.navyBlue} /> : <Feather name="download" size={22} color={colors.navyBlue} />}
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.success + '14' }]}>
          <AppText variant="small" color={colors.success}>Received</AppText>
          <AppText variant="h3" color={colors.success}>{formatCurrency(summary.totalReceived)}</AppText>
          <AppText variant="small" color={colors.mediumGrey}>{summary.completedCount} payments</AppText>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.warning + '14' }]}>
          <AppText variant="small" color={colors.warning}>Pending</AppText>
          <AppText variant="h3" color={colors.warning}>{formatCurrency(summary.totalPending)}</AppText>
          <AppText variant="small" color={colors.mediumGrey}>{summary.pendingCount} payments</AppText>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.base }}>
        <SearchBar placeholder="Search by patient or invoice..." value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterPill, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText variant="small" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl, textAlign: 'center' }}>No payments found</AppText>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  summaryCard: { flex: 1, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  filterActive: { backgroundColor: colors.navyBlue },
  payCard: { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  methodIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  payTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
});
