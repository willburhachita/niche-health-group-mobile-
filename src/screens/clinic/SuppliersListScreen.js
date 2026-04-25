import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
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
import { Badge } from '../../components/common/Badge';

const FILTERS = ['All', 'Frequent', 'New'];

export default function SuppliersListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const allSuppliers = useQuery(api.suppliers.list) ?? [];
  const searchResults = useQuery(api.suppliers.search, { query: search });

  const suppliers = useMemo(() => {
    let items = search.length > 0 ? (searchResults ?? []) : allSuppliers;
    if (filter === 'Frequent') return items.filter(s => s.isFrequent);
    if (filter === 'New') return items.filter(s => (s.orderCount ?? 0) <= 3);
    return items;
  }, [allSuppliers, searchResults, filter, search]);

  const renderItem = ({ item }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('SupplierDetail', { supplierId: item._id })}>
      <View style={styles.iconCircle}>
        <Feather name="truck" size={18} color={colors.navyBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyBold">{item.name}</AppText>
        <AppText variant="caption" color={colors.darkGrey}>{item.contactPerson} · {item.phone}</AppText>
        <View style={styles.metaRow}>
          <AppText variant="small" color={colors.mediumGrey}>{item.orderCount ?? 0} orders</AppText>
          {item.isFrequent && <Badge variant="success" count={0} style={{ marginLeft: spacing.sm }}><AppText variant="small" color={colors.success}>Frequent</AppText></Badge>}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.lightGrey} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Suppliers</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ paddingHorizontal: spacing.base }}>
        <SearchBar placeholder="Search suppliers..." value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterPill, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText variant="small" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={suppliers}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl, textAlign: 'center' }}>No suppliers found</AppText>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateEditSupplier')}>
        <Feather name="plus" size={22} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  filterActive: { backgroundColor: colors.navyBlue },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGrey, marginBottom: spacing.sm, ...shadows.subtle },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  fab: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: spacing.base, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navyBlue, alignItems: 'center', justifyContent: 'center', ...shadows.medium },
});
