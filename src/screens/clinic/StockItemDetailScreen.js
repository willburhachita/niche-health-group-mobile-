import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { getStockItemById, getAdjustmentsForItem, formatCurrency } from '../../data/mockStock';
import { getSupplierById } from '../../data/mockSuppliers';
import { getUserById } from '../../data/mockUsers';
import { formatDate, formatTimestamp } from '../../utils/dateHelpers';

function getStockColor(item) {
  if (item.stockLevel === 0) return colors.error;
  if (item.stockLevel <= item.reorderLevel) return colors.warning;
  return colors.success;
}

function getStockLabel(item) {
  if (item.stockLevel === 0) return 'Out of Stock';
  if (item.stockLevel <= item.reorderLevel) return 'Low Stock';
  return 'In Stock';
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) return { text: 'No expiry set', color: colors.mediumGrey };
  const daysLeft = Math.ceil((expiryDate - Date.now()) / 86400000);
  if (daysLeft < 0) return { text: `Expired ${Math.abs(daysLeft)} days ago`, color: colors.error };
  if (daysLeft <= 30) return { text: `Expires in ${daysLeft} days`, color: colors.error };
  if (daysLeft <= 60) return { text: `Expires in ~2 months`, color: colors.warning };
  if (daysLeft <= 90) return { text: `Expires in ~3 months`, color: colors.warning };
  return { text: `Expires in ${Math.ceil(daysLeft / 30)} months`, color: colors.mediumGrey };
}

function getTaxLabel(item) {
  if (item.taxType === 'vat_16') return 'VAT 16%';
  if (item.taxType === 'zero_rated') return 'Zero-rated';
  return 'Exempt';
}

export default function StockItemDetailScreen({ route, navigation }) {
  const { stockItemId } = route.params;
  const item = getStockItemById(stockItemId);
  const supplier = item ? getSupplierById(item.supplierId) : null;
  const adjustments = item ? getAdjustmentsForItem(item.id).slice(0, 5) : [];
  const createdByUser = item ? getUserById(item.createdBy) : null;
  const updatedByUser = item?.updatedBy ? getUserById(item.updatedBy) : null;

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Feather name="chevron-left" size={24} color={colors.black} />
          </Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Stock Item</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Item not found</AppText>
      </SafeAreaView>
    );
  }

  const stockColor = getStockColor(item);
  const expiry = getExpiryInfo(item.expiryDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>{item.itemCode}</AppText>
        <Pressable onPress={() => navigation.navigate('CreateEditProduct', { stockItemId: item.id })} hitSlop={8}>
          <Feather name="edit-2" size={20} color={colors.navyBlue} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Name & Stock Level */}
        <View style={styles.heroSection}>
          <AppText variant="h1">{item.name}</AppText>
          {item.serialNumber && <AppText variant="caption" color={colors.darkGrey}>S/N: {item.serialNumber}</AppText>}
          <View style={styles.stockDisplay}>
            <View style={[styles.stockCircle, { borderColor: stockColor }]}>
              <AppText variant="display" color={stockColor}>{item.stockLevel}</AppText>
              <AppText variant="small" color={colors.mediumGrey}>in stock</AppText>
            </View>
            <View style={[styles.stockStatusBadge, { backgroundColor: stockColor + '14' }]}>
              <View style={[styles.stockStatusDot, { backgroundColor: stockColor }]} />
              <AppText variant="caption" color={stockColor}>{getStockLabel(item)}</AppText>
            </View>
          </View>
        </View>

        <Divider type="section" />

        {/* Pricing */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PRICING</AppText>
          <View style={styles.detailRow}>
            <AppText variant="body" color={colors.darkGrey}>Price per item</AppText>
            <AppText variant="bodyBold">{formatCurrency(item.pricePerItem)}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="body" color={colors.darkGrey}>Tax</AppText>
            <AppText variant="body">{getTaxLabel(item)}{item.includesTax ? ' (included)' : ''}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="body" color={colors.darkGrey}>Cost price</AppText>
            <AppText variant="bodyBold">{formatCurrency(item.costPrice)}</AppText>
          </View>
          <View style={styles.detailRow}>
            <AppText variant="body" color={colors.darkGrey}>Total value</AppText>
            <AppText variant="bodyBold">{formatCurrency(item.pricePerItem * item.stockLevel)}</AppText>
          </View>
        </View>

        <Divider type="section" />

        {/* Supplier */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>SUPPLIER</AppText>
          {supplier ? (
            <Pressable style={styles.supplierCard} onPress={() => navigation.navigate('SupplierDetail', { supplierId: supplier.id })}>
              <View style={styles.supplierIcon}>
                <Feather name="truck" size={16} color={colors.navyBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{supplier.name}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{supplier.contactPerson} · {supplier.phone}</AppText>
              </View>
              <Feather name="chevron-right" size={16} color={colors.lightGrey} />
            </Pressable>
          ) : (
            <AppText variant="body" color={colors.mediumGrey}>No supplier linked</AppText>
          )}
        </View>

        <Divider type="section" />

        {/* Expiry */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>EXPIRY</AppText>
          <View style={[styles.expiryBanner, { backgroundColor: expiry.color + '14' }]}>
            <Feather name={expiry.color === colors.mediumGrey ? 'clock' : 'alert-circle'} size={16} color={expiry.color} />
            <AppText variant="bodyBold" color={expiry.color} style={{ marginLeft: spacing.sm }}>{expiry.text}</AppText>
          </View>
          {item.expiryDate && (
            <AppText variant="caption" color={colors.darkGrey} style={{ marginTop: spacing.xs }}>
              Expiry date: {formatDate(item.expiryDate)}
            </AppText>
          )}
        </View>

        <Divider type="section" />

        {/* Notes */}
        {item.notes && (
          <>
            <View style={styles.section}>
              <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>NOTES</AppText>
              <AppText variant="body">{item.notes}</AppText>
            </View>
            <Divider type="section" />
          </>
        )}

        {/* Ownership */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>AUDIT</AppText>
          <AppText variant="small" color={colors.mediumGrey}>
            Added by {createdByUser?.displayName || 'Unknown'} · {formatTimestamp(item.createdAt)}
          </AppText>
          {updatedByUser && (
            <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: 2 }}>
              Last updated by {updatedByUser.displayName} · {formatTimestamp(item.updatedAt)}
            </AppText>
          )}
        </View>

        <Divider type="section" />

        {/* Recent Adjustments */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>RECENT ADJUSTMENTS</AppText>
            {adjustments.length > 0 && (
              <Pressable onPress={() => navigation.navigate('StockHistory', { stockItemId: item.id })}>
                <AppText variant="small" color={colors.navyBlue}>View All</AppText>
              </Pressable>
            )}
          </View>
          {adjustments.length === 0 ? (
            <AppText variant="body" color={colors.mediumGrey}>No adjustments yet</AppText>
          ) : (
            adjustments.map(adj => {
              const adjUser = getUserById(adj.adjustedBy);
              const isIncrease = adj.adjustmentType === 'increase';
              return (
                <View key={adj.id} style={styles.adjRow}>
                  <View style={[styles.adjIcon, { backgroundColor: isIncrease ? colors.success + '14' : colors.error + '14' }]}>
                    <Feather name={isIncrease ? 'arrow-up' : 'arrow-down'} size={14} color={isIncrease ? colors.success : colors.error} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body">{isIncrease ? '+' : '-'}{adj.quantity} · {adj.reason.replace(/_/g, ' ')}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>{adjUser?.displayName} · {formatTimestamp(adj.adjustedAt)}</AppText>
                  </View>
                  <AppText variant="caption" color={colors.darkGrey}>{adj.previousLevel} → {adj.newLevel}</AppText>
                </View>
              );
            })
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button label="Adjust Stock" icon="sliders" onPress={() => navigation.navigate('StockAdjustment', { stockItemId: item.id })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  heroSection: { paddingHorizontal: spacing.base, paddingBottom: spacing.lg },
  stockDisplay: { alignItems: 'center', marginTop: spacing.lg },
  stockCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  stockStatusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  stockStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.xs },
  section: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  supplierCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.lightGrey },
  supplierIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  expiryBanner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md },
  adjRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  adjIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actions: { paddingHorizontal: spacing.base, paddingVertical: spacing.lg },
});
