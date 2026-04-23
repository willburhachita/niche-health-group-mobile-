import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { Divider } from '../../components/common/Divider';
import { InvoiceItem } from '../../components/clinic/InvoiceItem';
import { mockInvoices, getTotalOutstanding, getOverdueInvoices, formatCurrency } from '../../data/mockInvoices';

const FILTERS = ['All', 'Unpaid', 'Overdue', 'Paid'];

export default function InvoicesListScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('All');

  const getFiltered = () => {
    if (activeFilter === 'All') return mockInvoices;
    return mockInvoices.filter(inv => inv.status === activeFilter.toLowerCase());
  };

  const invoices = getFiltered();
  const totalOutstanding = getTotalOutstanding();
  const overdueCount = getOverdueInvoices().length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Invoices</AppText>
        <Pressable onPress={() => navigation.navigate('CreateInvoice')} hitSlop={8}>
          <Feather name="plus" size={24} color={colors.navyBlue} />
        </Pressable>
      </View>

      {/* Outstanding Summary */}
      <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
        <Card variant="highlighted">
          <View style={styles.summaryRow}>
            <View>
              <AppText variant="small" color={colors.mediumGrey}>Total Outstanding</AppText>
              <AppText variant="h1" color={colors.peach}>{formatCurrency(totalOutstanding)}</AppText>
            </View>
            {overdueCount > 0 && (
              <View style={styles.overdueBadge}>
                <AppText variant="small" color={colors.error}>{overdueCount} overdue</AppText>
              </View>
            )}
          </View>
        </Card>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <AppText variant="caption" color={activeFilter === f ? colors.white : colors.navyBlue}>
              {f}
            </AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <>
            <InvoiceItem
              invoice={item}
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
            />
            <Divider type="inset" />
          </>
        )}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={
          <EmptyState icon="credit-card" title="No invoices" message={`No ${activeFilter.toLowerCase()} invoices found`} />
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('CreateInvoice')}
      >
        <Feather name="plus" size={24} color={colors.white} />
      </Pressable>
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overdueBadge: {
    backgroundColor: colors.error + '14',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  filterPillActive: {
    backgroundColor: colors.navyBlue,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: TAB_BAR_HEIGHT + spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.navyBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
