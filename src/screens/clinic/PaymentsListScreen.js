import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { Card } from '../../components/common/Card';
import { mockPayments, getPaymentsSummary, getMethodLabel, getMethodIcon } from '../../data/mockPayments';
import { getPatientById } from '../../data/mockPatients';
import { formatCurrency } from '../../data/mockInvoices';
import { formatTimestamp } from '../../utils/dateHelpers';

const FILTERS = ['All', 'Completed', 'Pending'];

export default function PaymentsListScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const summary = getPaymentsSummary();

  const getFiltered = () => {
    let items = mockPayments;
    if (filter === 'Completed') items = items.filter(p => p.status === 'completed');
    if (filter === 'Pending') items = items.filter(p => p.status === 'pending');
    if (search.length > 0) {
      const q = search.toLowerCase();
      items = items.filter(p => {
        const patient = getPatientById(p.patientId);
        return patient?.displayName.toLowerCase().includes(q) || p.invoiceId.toLowerCase().includes(q) || p.referenceNumber?.toLowerCase().includes(q);
      });
    }
    return items.sort((a, b) => b.paymentDate - a.paymentDate);
  };

  const payments = getFiltered();

  const renderItem = ({ item }) => {
    const patient = getPatientById(item.patientId);
    const isCompleted = item.status === 'completed';
    return (
      <Pressable style={styles.payCard} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.invoiceId })}>
        <View style={[styles.methodIcon, { backgroundColor: isCompleted ? colors.success + '14' : colors.warning + '14' }]}>
          <Feather name={getMethodIcon(item.method)} size={16} color={isCompleted ? colors.success : colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.payTop}>
            <AppText variant="bodyBold">{formatCurrency(item.amount)}</AppText>
            <View style={[styles.statusDot, { backgroundColor: isCompleted ? colors.success : colors.warning }]} />
          </View>
          <AppText variant="caption" color={colors.darkGrey}>{patient?.displayName || 'Unknown'} · {item.invoiceId.toUpperCase()}</AppText>
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
        <View style={{ width: 24 }} />
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
        keyExtractor={item => item.id}
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
