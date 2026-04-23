import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { getSupplierById } from '../../data/mockSuppliers';
import { mockStockItems, formatCurrency } from '../../data/mockStock';
import { getUserById } from '../../data/mockUsers';
import { formatTimestamp } from '../../utils/dateHelpers';

export default function SupplierDetailScreen({ route, navigation }) {
  const { supplierId } = route.params;
  const supplier = getSupplierById(supplierId);
  const products = mockStockItems.filter(s => s.supplierId === supplierId);
  const createdByUser = supplier ? getUserById(supplier.createdBy) : null;

  if (!supplier) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Supplier</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Supplier not found</AppText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Supplier</AppText>
        <Pressable onPress={() => navigation.navigate('CreateEditSupplier', { supplierId: supplier.id })} hitSlop={8}>
          <Feather name="edit-2" size={20} color={colors.navyBlue} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconLarge}>
            <Feather name="truck" size={28} color={colors.navyBlue} />
          </View>
          <AppText variant="h1" style={{ textAlign: 'center', marginTop: spacing.md }}>{supplier.name}</AppText>
          {supplier.isFrequent && (
            <View style={styles.frequentBadge}>
              <Feather name="star" size={12} color={colors.success} />
              <AppText variant="small" color={colors.success} style={{ marginLeft: 4 }}>Frequent Supplier</AppText>
            </View>
          )}
          <AppText variant="caption" color={colors.darkGrey} style={{ textAlign: 'center' }}>{supplier.orderCount} orders placed</AppText>
        </View>

        <Divider type="section" />

        {/* Contact */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>CONTACT DETAILS</AppText>
          <DetailRow icon="user" label="Contact Person" value={supplier.contactPerson || 'Not set'} />
          <DetailRow icon="phone" label="Phone" value={supplier.phone || 'Not set'} onPress={() => supplier.phone && Linking.openURL(`tel:${supplier.phone}`)} />
          <DetailRow icon="mail" label="Email" value={supplier.email || 'Not set'} onPress={() => supplier.email && Linking.openURL(`mailto:${supplier.email}`)} />
          <DetailRow icon="map-pin" label="Address" value={supplier.address || 'Not set'} />
        </View>

        <Divider type="section" />

        {/* Products */}
        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PRODUCTS SUPPLIED ({products.length})</AppText>
          {products.length === 0 ? (
            <AppText variant="body" color={colors.mediumGrey}>No products linked to this supplier</AppText>
          ) : (
            products.map(p => (
              <Pressable key={p.id} style={styles.productRow} onPress={() => navigation.navigate('StockItemDetail', { stockItemId: p.id })}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{p.name}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>{p.itemCode} · {formatCurrency(p.pricePerItem)}/unit · Stock: {p.stockLevel}</AppText>
                </View>
                <Feather name="chevron-right" size={14} color={colors.lightGrey} />
              </Pressable>
            ))
          )}
        </View>

        <Divider type="section" />

        {/* Notes */}
        {supplier.notes && (
          <View style={styles.section}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>NOTES</AppText>
            <AppText variant="body">{supplier.notes}</AppText>
          </View>
        )}

        {/* Audit */}
        <View style={styles.section}>
          <AppText variant="small" color={colors.mediumGrey}>
            Added by {createdByUser?.displayName || 'Unknown'} · {formatTimestamp(supplier.createdAt)}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper style={styles.detailRow} onPress={onPress}>
      <Feather name={icon} size={16} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 20 }} />
      <View style={{ flex: 1 }}>
        <AppText variant="small" color={colors.mediumGrey}>{label}</AppText>
        <AppText variant="body" color={onPress ? colors.navyBlue : colors.black}>{value}</AppText>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  heroSection: { alignItems: 'center', paddingVertical: spacing.xl },
  iconLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' },
  frequentBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success + '14', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, marginTop: spacing.sm, marginBottom: spacing.xs },
  section: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
});
