import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { formatTimestamp } from '../../utils/dateHelpers';

const FILTERS = ['All', 'Increases', 'Decreases'];

export default function StockHistoryScreen({ route, navigation }) {
  const { stockItemId } = route.params;
  const item = useQuery(api.stock.get, { id: stockItemId });
  const [filter, setFilter] = useState('All');

  const allAdj = useQuery(api.stock.listAdjustments, { stockItemId }) ?? [];
  const adjustments = useMemo(() => {
    if (filter === 'Increases') return allAdj.filter(a => a.adjustmentType === 'increase');
    if (filter === 'Decreases') return allAdj.filter(a => a.adjustmentType === 'decrease');
    return allAdj;
  }, [allAdj, filter]);

  const renderItem = ({ item: adj }) => {
    const isIncrease = adj.adjustmentType === 'increase';
    return (
      <View style={styles.adjCard}>
        <View style={[styles.adjIcon, { backgroundColor: isIncrease ? colors.success + '14' : colors.error + '14' }]}>
          <Feather name={isIncrease ? 'arrow-up' : 'arrow-down'} size={16} color={isIncrease ? colors.success : colors.error} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.adjTop}>
            <AppText variant="bodyBold">{isIncrease ? '+' : '-'}{adj.quantity}</AppText>
            <AppText variant="caption" color={colors.darkGrey}>{adj.previousLevel} → {adj.newLevel}</AppText>
          </View>
          <AppText variant="body" color={colors.darkGrey}>{adj.reason.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}</AppText>
          {adj.notes && <AppText variant="small" color={colors.mediumGrey} numberOfLines={2}>{adj.notes}</AppText>}
          <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
            {adj.adjustedBy || 'Unknown'} · {formatTimestamp(adj.adjustedAt)}
          </AppText>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Stock History</AppText>
        <View style={{ width: 24 }} />
      </View>

      {item && (
        <View style={styles.itemBanner}>
          <AppText variant="bodyBold">{item.name}</AppText>
          <AppText variant="caption" color={colors.darkGrey}>{item.itemCode} · Current: {item.stockLevel}</AppText>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterPill, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <AppText variant="small" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={adjustments}
        keyExtractor={adj => adj._id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: spacing.base, paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={<AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl, textAlign: 'center' }}>No adjustments recorded</AppText>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  itemBanner: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  filterActive: { backgroundColor: colors.navyBlue },
  adjCard: { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  adjIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  adjTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
});
