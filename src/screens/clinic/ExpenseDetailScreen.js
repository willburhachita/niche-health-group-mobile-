import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Divider } from '../../components/common/Divider';
import { getExpenseById, getCategoryLabel, getCategoryIcon, getCategoryColor } from '../../data/mockExpenses';
import { formatCurrency } from '../../data/mockInvoices';
import { getUserById } from '../../data/mockUsers';
import { formatDate, formatTimestamp } from '../../utils/dateHelpers';

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expenseId } = route.params;
  const expense = getExpenseById(expenseId);
  const createdByUser = expense ? getUserById(expense.createdBy) : null;

  if (!expense) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Expense</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Expense not found</AppText>
      </SafeAreaView>
    );
  }

  const catColor = getCategoryColor(expense.category);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Expense Detail</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <AppText variant="display" color={colors.error}>{formatCurrency(expense.amount)}</AppText>
          <View style={[styles.catBadge, { backgroundColor: catColor + '14' }]}>
            <Feather name={getCategoryIcon(expense.category)} size={12} color={catColor} />
            <AppText variant="small" color={catColor} style={{ marginLeft: 4 }}>{getCategoryLabel(expense.category)}</AppText>
          </View>
        </View>

        <Divider type="section" />

        <View style={styles.section}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>DETAILS</AppText>
          <DetailRow label="Description" value={expense.description} />
          <DetailRow label="Date" value={formatDate(expense.date)} />
          <DetailRow label="Vendor" value={expense.vendorName || 'Not specified'} />
          <DetailRow label="Payment Method" value={expense.paymentMethod?.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) || 'Not specified'} />
          {expense.referenceNumber && <DetailRow label="Reference" value={expense.referenceNumber} />}
        </View>

        {expense.notes && (
          <>
            <Divider type="section" />
            <View style={styles.section}>
              <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>NOTES</AppText>
              <AppText variant="body">{expense.notes}</AppText>
            </View>
          </>
        )}

        {expense.attachments.length > 0 && (
          <>
            <Divider type="section" />
            <View style={styles.section}>
              <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>ATTACHMENTS ({expense.attachments.length})</AppText>
              {expense.attachments.map((att, i) => (
                <View key={i} style={styles.attachRow}>
                  <Feather name="paperclip" size={14} color={colors.navyBlue} />
                  <AppText variant="body" color={colors.navyBlue} style={{ flex: 1, marginLeft: spacing.sm }}>{att.name}</AppText>
                  <Feather name="download" size={16} color={colors.mediumGrey} />
                </View>
              ))}
            </View>
          </>
        )}

        <Divider type="section" />
        <View style={styles.section}>
          <AppText variant="small" color={colors.mediumGrey}>
            Recorded by {createdByUser?.displayName || 'Unknown'} · {formatTimestamp(expense.createdAt)}
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="body" color={colors.darkGrey} style={{ width: 120 }}>{label}</AppText>
      <AppText variant="body" style={{ flex: 1 }}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  amountSection: { alignItems: 'center', paddingVertical: spacing.xl },
  catBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, marginTop: spacing.sm },
  section: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.sm },
  detailRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  attachRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.lightGrey },
});
