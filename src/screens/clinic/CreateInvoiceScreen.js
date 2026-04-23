import React, { useState } from 'react';
import { View, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { mockPatients, searchPatients } from '../../data/mockPatients';
import { formatCurrency } from '../../data/mockInvoices';
import { TAX_TYPES } from '../../data/mockStock';

export default function CreateInvoiceScreen({ navigation }) {
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientList, setShowPatientList] = useState(false);
  const [lineItems, setLineItems] = useState([{ description: '', quantity: '1', price: '' }]);
  const [notes, setNotes] = useState('');
  const [sendToPatient, setSendToPatient] = useState(false);
  const [selectedTax, setSelectedTax] = useState('exempt');
  const [submitToNhima, setSubmitToNhima] = useState(false);

  const filteredPatients = patientSearch.length > 0
    ? searchPatients(patientSearch)
    : mockPatients.filter(p => p.status === 'active');

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', price: '' }]);
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  const taxRate = TAX_TYPES.find(t => t.key === selectedTax)?.rate || 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSave = () => {
    if (!selectedPatient) {
      alert('Please select a patient.');
      return;
    }
    if (lineItems.every(i => !i.description && !i.price)) {
      alert('Please add at least one line item.');
      return;
    }
    const msg = `Invoice for ${selectedPatient.displayName}\nTotal: ${formatCurrency(total)}${submitToNhima ? '\nSubmitted to NHIMA' : ''}`;
    alert(msg);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>New Invoice</AppText>
        <Pressable onPress={handleSave} hitSlop={8}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Save</AppText>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Selection */}
        <AppText variant="bodyBold" style={styles.label}>Patient</AppText>
        {selectedPatient ? (
          <Pressable style={styles.selectedPatient} onPress={() => { setSelectedPatient(null); setShowPatientList(true); }}>
            <Avatar name={selectedPatient.displayName} size={36} />
            <View style={styles.selectedInfo}>
              <AppText variant="bodyBold">{selectedPatient.displayName}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{selectedPatient.patientId}</AppText>
            </View>
            <Feather name="x" size={16} color={colors.mediumGrey} />
          </Pressable>
        ) : (
          <>
            <SearchBar
              placeholder="Search patient..."
              value={patientSearch}
              onChangeText={(text) => { setPatientSearch(text); setShowPatientList(true); }}
              onFocus={() => setShowPatientList(true)}
            />
            {showPatientList && (
              <View style={styles.patientList}>
                {filteredPatients.slice(0, 5).map(p => (
                  <Pressable
                    key={p.id}
                    style={({ pressed }) => [styles.patientOption, pressed && styles.pressed]}
                    onPress={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(''); }}
                  >
                    <Avatar name={p.displayName} size={32} />
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <AppText variant="body">{p.displayName}</AppText>
                      <AppText variant="small" color={colors.mediumGrey}>{p.patientId}</AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <Divider type="section" />

        {/* Line Items */}
        <AppText variant="bodyBold" style={styles.label}>Line Items</AppText>
        {lineItems.map((item, index) => (
          <View key={index} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <AppText variant="caption" color={colors.mediumGrey}>Item {index + 1}</AppText>
              {lineItems.length > 1 && (
                <Pressable onPress={() => removeLineItem(index)} hitSlop={8}>
                  <Feather name="trash-2" size={16} color={colors.error} />
                </Pressable>
              )}
            </View>
            <Input
              placeholder="Description (e.g. Consultation Fee)"
              value={item.description}
              onChangeText={text => updateLineItem(index, 'description', text)}
            />
            <View style={styles.lineItemRow}>
              <View style={{ flex: 1 }}>
                <Input
                  placeholder="Qty"
                  value={item.quantity}
                  onChangeText={text => updateLineItem(index, 'quantity', text)}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 2 }}>
                <Input
                  placeholder="Price (K)"
                  value={item.price}
                  onChangeText={text => updateLineItem(index, 'price', text)}
                  keyboardType="numeric"
                  icon="credit-card"
                />
              </View>
            </View>
            {item.quantity && item.price ? (
              <AppText variant="caption" color={colors.darkGrey} style={styles.lineTotal}>
                Line total: {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0))}
              </AppText>
            ) : null}
          </View>
        ))}

        <Pressable style={styles.addItemBtn} onPress={addLineItem}>
          <Feather name="plus" size={16} color={colors.navyBlue} />
          <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Add Item</AppText>
        </Pressable>

        <Divider type="section" />

        {/* Tax Selection */}
        <AppText variant="bodyBold" style={styles.label}>Tax</AppText>
        <View style={styles.taxRow}>
          {TAX_TYPES.map(t => (
            <Pressable key={t.key} style={[styles.taxPill, selectedTax === t.key && styles.taxPillActive]} onPress={() => setSelectedTax(t.key)}>
              <AppText variant="small" color={selectedTax === t.key ? colors.white : colors.darkGrey}>{t.label}</AppText>
            </Pressable>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalBox}>
          <View style={styles.totalRow}>
            <AppText variant="body" color={colors.darkGrey}>Subtotal</AppText>
            <AppText variant="body">{formatCurrency(subtotal)}</AppText>
          </View>
          <View style={styles.totalRow}>
            <AppText variant="body" color={colors.darkGrey}>Tax ({TAX_TYPES.find(t => t.key === selectedTax)?.label})</AppText>
            <AppText variant="body">{formatCurrency(taxAmount)}</AppText>
          </View>
          <Divider type="full" />
          <View style={styles.totalRow}>
            <AppText variant="h3">Total</AppText>
            <AppText variant="h2" color={colors.navyBlue}>{formatCurrency(total)}</AppText>
          </View>
        </View>

        {/* Notes */}
        <Input label="Notes" placeholder="Any additional notes..." value={notes} onChangeText={setNotes} multiline />

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Send invoice to patient</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Via SMS or email on save</AppText>
          </View>
          <Switch
            value={sendToPatient}
            onValueChange={setSendToPatient}
            trackColor={{ true: colors.navyBlue, false: colors.lightGrey }}
            thumbColor={colors.white}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Submit to NHIMA</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Send to National Health Insurance</AppText>
          </View>
          <Switch
            value={submitToNhima}
            onValueChange={setSubmitToNhima}
            trackColor={{ true: colors.success, false: colors.lightGrey }}
            thumbColor={colors.white}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
        <Button label="Create Invoice" onPress={handleSave} />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
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
  scrollContent: { paddingHorizontal: spacing.base },
  label: { marginTop: spacing.base, marginBottom: spacing.sm },
  selectedPatient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
  },
  selectedInfo: { flex: 1, marginLeft: spacing.sm },
  patientList: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginTop: spacing.xs,
  },
  patientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.offWhite },
  lineItem: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lineItemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  lineTotal: {
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderStyle: 'dashed',
    marginBottom: spacing.base,
  },
  totalBox: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  taxRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  taxPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.offWhite,
  },
  taxPillActive: {
    backgroundColor: colors.navyBlue,
  },
});
