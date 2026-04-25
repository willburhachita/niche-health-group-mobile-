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
import { formatTimestamp } from '../../utils/dateHelpers';
import { exportExpensesCSV } from '../../utils/documentHelpers';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const EXPENSE_CATEGORIES = [
  { key: 'medical_supplies', label: 'Medical Supplies', icon: 'heart', color: colors.error },
  { key: 'equipment', label: 'Equipment', icon: 'tool', color: colors.navyBlue },
  { key: 'utilities', label: 'Utilities', icon: 'zap', color: colors.warning },
  { key: 'rent', label: 'Rent', icon: 'home', color: colors.peach },
  { key: 'salaries', label: 'Salaries', icon: 'users', color: colors.success },
  { key: 'other', label: 'Other', icon: 'more-horizontal', color: colors.mediumGrey },
];
function getCategoryLabel(key) { return EXPENSE_CATEGORIES.find(c => c.key === key)?.label || key; }
function getCategoryIcon(key) { return EXPENSE_CATEGORIES.find(c => c.key === key)?.icon || 'more-horizontal'; }
function getCategoryColor(key) { return EXPENSE_CATEGORIES.find(c => c.key === key)?.color || colors.mediumGrey; }

const FILTERS = ['All', ...EXPENSE_CATEGORIES.slice(0, 3).map(c => c.label)];

export default function ExpensesListScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await exportExpensesCSV(expenses);
    setExporting(false);
  };
  const allExpenses = useQuery(api.expenses.list, {}) ?? [];
  const summary = useQuery(api.expenses.summary) ?? { total: 0, count: 0 };

  const expenses = useMemo(() => {
    let items = [...allExpenses];
    if (filter !== 'All') {
      const cat = EXPENSE_CATEGORIES.find(c => c.label === filter);
      if (cat) items = items.filter(e => e.category === cat.key);
    }
    if (search.length > 0) {
      const q = search.toLowerCase();
      items = items.filter(e => e.description.toLowerCase().includes(q) || e.vendorName?.toLowerCase().includes(q));
    }
    return items.sort((a, b) => b.date - a.date);
  }, [allExpenses, filter, search]);

  const renderItem = ({ item }) => {
    const catColor = getCategoryColor(item.category);
    return (
      <Pressable style={styles.expCard} onPress={() => navigation.navigate('ExpenseDetail', { expenseId: item._id })}>
        <View style={[styles.catIcon, { backgroundColor: catColor + '14' }]}>
          <Feather name={getCategoryIcon(item.category)} size={16} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyBold" numberOfLines={1}>{item.description}</AppText>
          <AppText variant="caption" color={colors.darkGrey}>{getCategoryLabel(item.category)} · {item.vendorName || 'No vendor'}</AppText>
          <View style={styles.expMeta}>
            <AppText variant="small" color={colors.mediumGrey}>{formatTimestamp(item.date)}</AppText>
            {(item.attachments?.length ?? 0) > 0 && (
              <View style={styles.attachBadge}>
                <Feather name="paperclip" size={10} color={colors.mediumGrey} />
                <AppText variant="small" color={colors.mediumGrey} style={{ marginLeft: 2 }}>{item.attachments?.length}</AppText>
              </View>
            )}
          </View>
        </View>
        <AppText variant="bodyBold" color={colors.error}>{formatCurrency(item.amount)}</AppText>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Expenses</AppText>
        <Pressable onPress={handleExport} hitSlop={8} disabled={exporting}>
          {exporting ? <ActivityIndicator size="small" color={colors.navyBlue} /> : <Feather name="download" size={22} color={colors.navyBlue} />}
        </Pressable>
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <AppText variant="caption" color={colors.mediumGrey}>Total Expenses</AppText>
        <AppText variant="h1" color={colors.error}>{formatCurrency(summary.total)}</AppText>
        <AppText variant="small" color={colors.mediumGrey}>{allExpenses.length} entries this period</AppText>
      </View>

      <View style={{ paddingHorizontal: spacing.base }}>
        <SearchBar placeholder="Search expenses..." value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterPill, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText variant="small" color={filter === f ? colors.white : colors.darkGrey} numberOfLines={1}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl, textAlign: 'center' }}>No expenses found</AppText>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateExpense')}>
        <Feather name="plus" size={22} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  totalCard: { alignItems: 'center', paddingVertical: spacing.md, marginHorizontal: spacing.base, marginBottom: spacing.sm, backgroundColor: colors.error + '08', borderRadius: radius.md },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  filterActive: { backgroundColor: colors.navyBlue },
  expCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  catIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  expMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  attachBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  fab: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: spacing.base, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navyBlue, alignItems: 'center', justifyContent: 'center', ...shadows.medium },
});
