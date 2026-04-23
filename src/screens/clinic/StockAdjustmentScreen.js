import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { getStockItemById, INCREASE_REASONS, DECREASE_REASONS } from '../../data/mockStock';

export default function StockAdjustmentScreen({ route, navigation }) {
  const alert = useAlert();
  const { stockItemId } = route.params;
  const item = getStockItemById(stockItemId);

  const [adjustmentType, setAdjustmentType] = useState('increase');
  const [reason, setReason] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}><Feather name="x" size={24} color={colors.black} /></Pressable>
          <AppText variant="h2" style={styles.headerTitle}>Adjust Stock</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Item not found</AppText>
      </SafeAreaView>
    );
  }

  const reasons = adjustmentType === 'increase' ? INCREASE_REASONS : DECREASE_REASONS;
  const qty = parseInt(quantity, 10) || 0;
  const newLevel = adjustmentType === 'increase' ? item.stockLevel + qty : item.stockLevel - qty;
  const isValid = reason && qty > 0 && newLevel >= 0;

  const handleSave = () => {
    if (!isValid) {
      alert({ type: 'warning', title: 'Invalid', message: adjustmentType === 'decrease' && newLevel < 0 ? 'Cannot decrease below zero.' : 'Please fill in all required fields.' });
      return;
    }
    const reasonLabel = reasons.find(r => r.key === reason)?.label || reason;
    alert({
      type: 'success',
      title: 'Stock Adjusted',
      message: `${item.name}\n${adjustmentType === 'increase' ? '+' : '-'}${qty} (${reasonLabel})\n${item.stockLevel} → ${newLevel}`,
      buttons: [{ label: 'OK', onPress: () => navigation.goBack() }],
    }
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Adjust Stock</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {/* Item Info */}
        <View style={styles.itemInfo}>
          <AppText variant="bodyBold">{item.name}</AppText>
          <AppText variant="caption" color={colors.darkGrey}>{item.itemCode}</AppText>
          <View style={styles.currentLevel}>
            <AppText variant="caption" color={colors.mediumGrey}>Current stock level</AppText>
            <AppText variant="h1">{item.stockLevel}</AppText>
          </View>
        </View>

        {/* Type Toggle */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>ADJUSTMENT TYPE</AppText>
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, adjustmentType === 'increase' && { backgroundColor: colors.success }]}
            onPress={() => { setAdjustmentType('increase'); setReason(null); }}
          >
            <Feather name="arrow-up" size={16} color={adjustmentType === 'increase' ? colors.white : colors.success} />
            <AppText variant="bodyBold" color={adjustmentType === 'increase' ? colors.white : colors.success} style={{ marginLeft: spacing.xs }}>Increase</AppText>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, adjustmentType === 'decrease' && { backgroundColor: colors.error }]}
            onPress={() => { setAdjustmentType('decrease'); setReason(null); }}
          >
            <Feather name="arrow-down" size={16} color={adjustmentType === 'decrease' ? colors.white : colors.error} />
            <AppText variant="bodyBold" color={adjustmentType === 'decrease' ? colors.white : colors.error} style={{ marginLeft: spacing.xs }}>Decrease</AppText>
          </Pressable>
        </View>

        {/* Reason */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>REASON</AppText>
        <View style={styles.reasonRow}>
          {reasons.map(r => (
            <Pressable key={r.key} style={[styles.reasonPill, reason === r.key && styles.reasonActive]} onPress={() => setReason(r.key)}>
              <AppText variant="small" color={reason === r.key ? colors.white : colors.darkGrey}>{r.label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Quantity */}
        <Input label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="Enter amount" keyboardType="number-pad" />

        {/* Preview */}
        {qty > 0 && (
          <View style={[styles.preview, { borderColor: newLevel < 0 ? colors.error : colors.success }]}>
            <View style={styles.previewRow}>
              <AppText variant="body" color={colors.darkGrey}>Current</AppText>
              <AppText variant="bodyBold">{item.stockLevel}</AppText>
            </View>
            <View style={styles.previewRow}>
              <AppText variant="body" color={colors.darkGrey}>Adjustment</AppText>
              <AppText variant="bodyBold" color={adjustmentType === 'increase' ? colors.success : colors.error}>
                {adjustmentType === 'increase' ? '+' : '-'}{qty}
              </AppText>
            </View>
            <View style={[styles.previewRow, { borderTopWidth: 1, borderTopColor: colors.lightGrey, paddingTop: spacing.sm }]}>
              <AppText variant="bodyBold">New Level</AppText>
              <AppText variant="h2" color={newLevel < 0 ? colors.error : colors.navyBlue}>{newLevel}</AppText>
            </View>
            {newLevel < 0 && <AppText variant="small" color={colors.error}>Cannot decrease below zero</AppText>}
          </View>
        )}

        {/* Notes */}
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Reason details..." multiline />
        {(reason === 'other_increase' || reason === 'other_decrease') && !notes.trim() && (
          <AppText variant="small" color={colors.warning}>Notes are required when reason is "Other"</AppText>
        )}

        {/* Save */}
        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save Adjustment" onPress={handleSave} disabled={!isValid} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  form: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  itemInfo: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lightGrey, marginBottom: spacing.lg },
  currentLevel: { alignItems: 'center', marginTop: spacing.md },
  label: { letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.offWhite },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  reasonPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  reasonActive: { backgroundColor: colors.navyBlue },
  preview: { padding: spacing.md, borderRadius: radius.md, borderWidth: 2, marginVertical: spacing.md },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
});
