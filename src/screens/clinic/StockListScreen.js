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
import { Badge } from '../../components/common/Badge';
import { mockStockItems, searchStockItems, getLowStockItems, getExpiringSoonItems, getExpiredItems, getOutOfStockItems, formatCurrency } from '../../data/mockStock';
import { getSupplierById } from '../../data/mockSuppliers';

const FILTERS = ['All', 'Low Stock', 'Expiring', 'Out of Stock'];

function getStockColor(item) {
  if (item.stockLevel === 0) return colors.error;
  if (item.stockLevel <= item.reorderLevel) return colors.warning;
  return colors.success;
}

function getExpiryLabel(expiryDate) {
  if (!expiryDate) return null;
  const now = Date.now();
  const daysLeft = Math.ceil((expiryDate - now) / 86400000);
  if (daysLeft < 0) return { text: 'Expired', color: colors.error };
  if (daysLeft <= 30) return { text: `${daysLeft}d left`, color: colors.error };
  if (daysLeft <= 60) return { text: `${Math.ceil(daysLeft / 30)}mo left`, color: colors.warning };
  if (daysLeft <= 90) return { text: `${Math.ceil(daysLeft / 30)}mo left`, color: colors.warning };
  return null;
}

export default function StockListScreen({ navigation }) {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const getFilteredItems = () => {
    let items = search.length > 0 ? searchStockItems(search) : mockStockItems;
    switch (filter) {
      case 'Low Stock': return items.filter(i => i.stockLevel <= i.reorderLevel && i.stockLevel > 0);
      case 'Expiring': return items.filter(i => {
        if (!i.expiryDate) return false;
        const daysLeft = Math.ceil((i.expiryDate - Date.now()) / 86400000);
        return daysLeft > 0 && daysLeft <= 90;
      });
      case 'Out of Stock': return items.filter(i => i.stockLevel === 0);
      default: return items.filter(i => i.status === 'active');
    }
  };

  const items = getFilteredItems();
  const lowCount = getLowStockItems().length;
  const expiringCount = getExpiringSoonItems().length + getExpiredItems().length;

  const renderItem = ({ item }) => {
    const supplier = getSupplierById(item.supplierId);
    const stockColor = getStockColor(item);
    const expiry = getExpiryLabel(item.expiryDate);

    return (
      <Pressable
        style={styles.itemCard}
        onPress={() => navigation.navigate('StockItemDetail', { stockItemId: item.id })}
      >
        <View style={styles.itemTop}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" numberOfLines={1}>{item.name}</AppText>
            <AppText variant="caption" color={colors.darkGrey}>{item.itemCode}{supplier ? ` · ${supplier.name}` : ''}</AppText>
          </View>
          <View style={styles.stockBadge}>
            <View style={[styles.stockDot, { backgroundColor: stockColor }]} />
            <AppText variant="bodyBold" color={stockColor}>{item.stockLevel}</AppText>
          </View>
        </View>
        <View style={styles.itemBottom}>
          <AppText variant="small" color={colors.mediumGrey}>{formatCurrency(item.pricePerItem)} / unit</AppText>
          {expiry && (
            <View style={[styles.expiryTag, { backgroundColor: expiry.color + '14' }]}>
              <Feather name="alert-circle" size={10} color={expiry.color} />
              <AppText variant="small" color={expiry.color} style={{ marginLeft: 3 }}>{expiry.text}</AppText>
            </View>
          )}
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
        <AppText variant="h2" style={styles.headerTitle}>Stock & Inventory</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.alertRow}>
        {lowCount > 0 && (
          <View style={[styles.alertChip, { backgroundColor: colors.warning + '14' }]}>
            <Feather name="alert-triangle" size={12} color={colors.warning} />
            <AppText variant="small" color={colors.warning} style={{ marginLeft: 4 }}>{lowCount} Low Stock</AppText>
          </View>
        )}
        {expiringCount > 0 && (
          <View style={[styles.alertChip, { backgroundColor: colors.error + '14' }]}>
            <Feather name="clock" size={12} color={colors.error} />
            <AppText variant="small" color={colors.error} style={{ marginLeft: 4 }}>{expiringCount} Expiring</AppText>
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.base }}>
        <SearchBar placeholder="Search by name or code..." value={search} onChangeText={setSearch} />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterPill, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText variant="small" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl, textAlign: 'center' }}>No items found</AppText>}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateEditProduct')}>
        <Feather name="plus" size={22} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  alertRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  alertChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  filterActive: { backgroundColor: colors.navyBlue },
  itemCard: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.lightGrey, marginBottom: spacing.sm, ...shadows.subtle },
  itemTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  itemBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.sm },
  stockDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  expiryTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full },
  fab: { position: 'absolute', bottom: TAB_BAR_HEIGHT + 16, right: spacing.base, width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navyBlue, alignItems: 'center', justifyContent: 'center', ...shadows.medium },
});
