import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

const EXPENSE_CATEGORIES = [
  { key: 'medical_supplies', label: 'Medical Supplies', icon: 'heart', color: colors.error },
  { key: 'equipment', label: 'Equipment', icon: 'tool', color: colors.navyBlue },
  { key: 'utilities', label: 'Utilities', icon: 'zap', color: colors.warning },
  { key: 'rent', label: 'Rent', icon: 'home', color: colors.peach },
  { key: 'salaries', label: 'Salaries', icon: 'users', color: colors.success },
  { key: 'other', label: 'Other', icon: 'more-horizontal', color: colors.mediumGrey },
];
function getCategoryIcon(key) { return EXPENSE_CATEGORIES.find(c => c.key === key)?.icon || 'more-horizontal'; }
function getCategoryColor(key) { return EXPENSE_CATEGORIES.find(c => c.key === key)?.color || colors.mediumGrey; }

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'dollar-sign' },
  { key: 'mobile_money', label: 'Mobile Money', icon: 'smartphone' },
  { key: 'card', label: 'Card', icon: 'credit-card' },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: 'briefcase' },
  { key: 'cheque', label: 'Cheque', icon: 'file-text' },
];

export default function CreateExpenseScreen({ navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const createExpense = useMutation(api.expenses.create);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState([]);

  const addAttachment = () => {
    const mockFile = { name: `Receipt_${attachments.length + 1}.jpg`, type: 'jpg', size: 500000 };
    setAttachments([...attachments, mockFile]);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!description.trim() || !amount || !category) {
      alert({ type: 'warning', title: 'Required', message: 'Please fill in description, amount, and category.' });
      return;
    }
    try {
      await createExpense({
        description: description.trim(),
        amount: parseFloat(amount) || 0,
        category,
        date: Date.now(),
        vendorName: vendorName || undefined,
        paymentMethod: paymentMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        createdBy: currentAccount?.userId || 'unknown',
      });
      alert({ type: 'success', title: 'Expense Recorded', message: `${description} \u2014 K ${amount}`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to save expense.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>New Expense</AppText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="What was this expense for?" />
        <Input label="Amount (K)" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="numeric" />

        {/* Category */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.fieldLabel}>CATEGORY</AppText>
        <View style={styles.categoryGrid}>
          {EXPENSE_CATEGORIES.map(c => {
            const isSelected = category === c.key;
            const catColor = getCategoryColor(c.key);
            return (
              <Pressable key={c.key} style={[styles.catPill, isSelected && { backgroundColor: catColor, borderColor: catColor }]} onPress={() => setCategory(c.key)}>
                <Feather name={getCategoryIcon(c.key)} size={14} color={isSelected ? colors.white : catColor} />
                <AppText variant="small" color={isSelected ? colors.white : colors.darkGrey} style={{ marginLeft: 4 }}>{c.label}</AppText>
              </Pressable>
            );
          })}
        </View>

        <Input label="Vendor / Payee" value={vendorName} onChangeText={setVendorName} placeholder="e.g. MedSupply Zambia" />

        {/* Payment Method */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.fieldLabel}>PAYMENT METHOD</AppText>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.filter(m => m.key !== 'insurance_nhima').map(m => (
            <Pressable key={m.key} style={[styles.methodPill, paymentMethod === m.key && styles.methodActive]} onPress={() => setPaymentMethod(m.key)}>
              <Feather name={m.icon} size={12} color={paymentMethod === m.key ? colors.white : colors.darkGrey} />
              <AppText variant="small" color={paymentMethod === m.key ? colors.white : colors.darkGrey} style={{ marginLeft: 4 }}>{m.label}</AppText>
            </Pressable>
          ))}
        </View>

        {paymentMethod && paymentMethod !== 'cash' && (
          <Input label="Reference Number" value={referenceNumber} onChangeText={setReferenceNumber} placeholder="Transaction reference" />
        )}

        {/* Attachments */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.fieldLabel}>ATTACHMENTS (Invoices / Receipts)</AppText>
        {attachments.map((att, i) => (
          <View key={i} style={styles.attachRow}>
            <Feather name="paperclip" size={14} color={colors.navyBlue} />
            <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>{att.name}</AppText>
            <Pressable onPress={() => removeAttachment(i)} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.attachBtn} onPress={addAttachment}>
          <Feather name="camera" size={16} color={colors.navyBlue} />
          <AppText variant="body" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Attach Invoice / Receipt</AppText>
        </Pressable>

        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Additional details..." multiline />

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Save Expense" onPress={handleSave} />
        </View>
        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <AppText variant="body" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  headerTitle: { flex: 1, textAlign: 'center' },
  form: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  fieldLabel: { letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  catPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite, borderWidth: 1, borderColor: colors.lightGrey },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  methodPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  methodActive: { backgroundColor: colors.navyBlue },
  attachRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.lightGrey },
  attachBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.navyBlue, borderStyle: 'dashed' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
});
