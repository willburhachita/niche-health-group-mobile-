import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Switch, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { CalendarDatePicker } from '../../components/common/CalendarDatePicker';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

const TAX_TYPES = [
  { key: 'vat_16', label: 'VAT 16%', rate: 0.16 },
  { key: 'zero_rated', label: 'Zero-rated', rate: 0 },
  { key: 'exempt', label: 'Exempt', rate: 0 },
];

export default function CreateEditProductScreen({ route, navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const stockItemId = route.params?.stockItemId;
  const existing = useQuery(api.stock.get, stockItemId ? { id: stockItemId } : 'skip');
  const isEdit = !!existing;
  const createItem = useMutation(api.stock.create);
  const updateItem = useMutation(api.stock.update);

  const [itemCode, setItemCode] = useState(existing?.itemCode || '');
  const [name, setName] = useState(existing?.name || '');
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber || '');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [pricePerItem, setPricePerItem] = useState(existing ? String(existing.pricePerItem) : '');
  const [includesTax, setIncludesTax] = useState(existing?.includesTax || false);
  const [selectedTax, setSelectedTax] = useState(existing?.taxType || 'vat_16');
  const [stockLevel, setStockLevel] = useState(existing ? String(existing.stockLevel) : '');
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ? new Date(existing.expiryDate).toISOString().split('T')[0] : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState(existing?.notes || '');
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');

  const allSuppliers = useQuery(api.suppliers.list) ?? [];
  const filteredSuppliers = React.useMemo(() => {
    if (!supplierSearch.trim()) return allSuppliers;
    const q = supplierSearch.toLowerCase();
    return allSuppliers.filter(s =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
    );
  }, [allSuppliers, supplierSearch]);

  const taxRate = TAX_TYPES.find(t => t.key === selectedTax)?.rate || 0;
  const price = parseFloat(pricePerItem) || 0;
  const costPrice = includesTax ? price : price * (1 + taxRate);

  const validateAndSave = async () => {
    let valid = true;
    setCodeError('');
    setNameError('');

    if (!name.trim()) { setNameError('Product name is required'); valid = false; }
    if (!itemCode.trim()) { setCodeError('Item code is required'); valid = false; }
    if (!valid) return;

    try {
      if (isEdit) {
        await updateItem({
          id: stockItemId,
          name: name.trim(),
          serialNumber: serialNumber || undefined,
          supplierId: selectedSupplier?._id || undefined,
          pricePerItem: parseFloat(pricePerItem) || 0,
          includesTax,
          taxType: selectedTax,
          stockLevel: parseInt(stockLevel) || 0,
          expiryDate: expiryDate ? new Date(expiryDate).getTime() : undefined,
          notes: notes || undefined,
          updatedBy: currentAccount?.userId || 'unknown',
        });
      } else {
        await createItem({
          itemCode: itemCode.trim(),
          name: name.trim(),
          serialNumber: serialNumber || undefined,
          supplierId: selectedSupplier?._id || undefined,
          pricePerItem: parseFloat(pricePerItem) || 0,
          costPrice: costPrice,
          includesTax,
          taxType: selectedTax,
          taxRate,
          stockLevel: parseInt(stockLevel) || 0,
          reorderLevel: 5,
          expiryDate: expiryDate ? new Date(expiryDate).getTime() : undefined,
          notes: notes || undefined,
          createdBy: currentAccount?.userId || 'unknown',
        });
      }
      alert({ type: 'success', title: isEdit ? 'Product Updated' : 'Product Created', message: `${name} has been ${isEdit ? 'updated' : 'added to inventory'}.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to save product.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>{isEdit ? 'Edit Product' : 'New Product'}</AppText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        {/* Item Code */}
        <Input label="Item Code" value={itemCode} onChangeText={setItemCode} error={codeError} placeholder="STK-001" />

        {/* Name */}
        <Input label="Product Name" value={name} onChangeText={setName} error={nameError} placeholder="e.g. Heparin 5000 IU/mL" />

        {/* Serial Number */}
        <Input label="Serial Number (optional)" value={serialNumber} onChangeText={setSerialNumber} placeholder="e.g. HEP-2026-A" />

        <Divider type="section" />

        {/* Supplier */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.fieldLabel}>SUPPLIER</AppText>
        {selectedSupplier ? (
          <View style={styles.selectedChip}>
            <Feather name="truck" size={14} color={colors.navyBlue} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <AppText variant="body">{selectedSupplier.name}</AppText>
              {selectedSupplier.contactPerson ? (
                <AppText variant="small" color={colors.mediumGrey}>{selectedSupplier.contactPerson}</AppText>
              ) : null}
            </View>
            <Pressable onPress={() => { setSelectedSupplier(null); setShowSupplierList(true); }} hitSlop={8}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </View>
        ) : (
          <View>
            <View style={styles.supplierSearchRow}>
              <Feather name="search" size={16} color={colors.mediumGrey} />
              <TextInput
                style={styles.supplierSearchInput}
                placeholder="Search by name or contact person..."
                placeholderTextColor={colors.mediumGrey}
                value={supplierSearch}
                onChangeText={(t) => { setSupplierSearch(t); if (!showSupplierList) setShowSupplierList(true); }}
                onFocus={() => setShowSupplierList(true)}
              />
              {supplierSearch.length > 0 && (
                <Pressable onPress={() => setSupplierSearch('')} hitSlop={8}>
                  <Feather name="x-circle" size={16} color={colors.mediumGrey} />
                </Pressable>
              )}
              <Pressable
                style={styles.supplierToggle}
                onPress={() => setShowSupplierList(!showSupplierList)}
              >
                <Feather name={showSupplierList ? 'chevron-up' : 'chevron-down'} size={18} color={colors.darkGrey} />
              </Pressable>
            </View>
            {showSupplierList && (
              <View style={styles.dropdown}>
                {filteredSuppliers.length === 0 && supplierSearch.length > 0 ? (
                  <View style={styles.dropdownEmpty}>
                    <AppText variant="body" color={colors.mediumGrey}>No suppliers match "{supplierSearch}"</AppText>
                  </View>
                ) : (
                  filteredSuppliers.map(s => (
                    <Pressable key={s._id} style={({ pressed }) => [styles.dropdownItem, pressed && { backgroundColor: colors.offWhite }]} onPress={() => { setSelectedSupplier(s); setShowSupplierList(false); setSupplierSearch(''); }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="truck" size={14} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
                        <AppText variant="bodyBold">{s.name}</AppText>
                      </View>
                      {s.contactPerson ? (
                        <AppText variant="small" color={colors.mediumGrey} style={{ marginLeft: spacing.lg + spacing.sm }}>
                          Contact: {s.contactPerson}
                        </AppText>
                      ) : null}
                    </Pressable>
                  ))
                )}
                <Pressable style={[styles.dropdownItem, styles.dropdownAddNew]} onPress={() => { setShowSupplierList(false); navigation.navigate('CreateEditSupplier'); }}>
                  <Feather name="plus-circle" size={14} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
                  <AppText variant="bodyBold" color={colors.navyBlue}>Add New Supplier</AppText>
                </Pressable>
              </View>
            )}
          </View>
        )}

        <Divider type="section" />

        {/* Pricing */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.fieldLabel}>PRICING</AppText>
        <Input label="Price per item (K)" value={pricePerItem} onChangeText={setPricePerItem} placeholder="e.g. 85" keyboardType="numeric" />

        <View style={styles.switchRow}>
          <AppText variant="body">Price includes tax</AppText>
          <Switch value={includesTax} onValueChange={setIncludesTax} trackColor={{ true: colors.navyBlue }} />
        </View>

        <AppText variant="caption" color={colors.mediumGrey} style={[styles.fieldLabel, { marginTop: spacing.md }]}>TAX TYPE</AppText>
        <View style={styles.taxRow}>
          {TAX_TYPES.map(t => (
            <Pressable key={t.key} style={[styles.taxPill, selectedTax === t.key && styles.taxPillActive]} onPress={() => setSelectedTax(t.key)}>
              <AppText variant="small" color={selectedTax === t.key ? colors.white : colors.darkGrey}>{t.label}</AppText>
            </Pressable>
          ))}
        </View>

        {price > 0 && (
          <View style={styles.costPreview}>
            <AppText variant="caption" color={colors.mediumGrey}>Cost price (incl. tax):</AppText>
            <AppText variant="bodyBold" color={colors.navyBlue}>K {costPrice.toFixed(2)}</AppText>
          </View>
        )}

        <Divider type="section" />

        {/* Stock Level */}
        <Input label="Stock Level" value={stockLevel} onChangeText={setStockLevel} placeholder="Current quantity" keyboardType="number-pad" />

        {/* Expiry Date */}
        <View style={styles.fieldWrap}>
          <AppText style={styles.dateLabel}>Expiry Date</AppText>
          <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
            <Feather name="calendar" size={18} color={colors.navyBlue} />
            <AppText variant="body" color={expiryDate ? colors.black : colors.mediumGrey} style={{ flex: 1, marginLeft: spacing.sm }}>
              {expiryDate || 'Select expiry date'}
            </AppText>
            {expiryDate ? (
              <Pressable hitSlop={8} onPress={() => setExpiryDate('')}>
                <Feather name="x-circle" size={16} color={colors.mediumGrey} />
              </Pressable>
            ) : (
              <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
            )}
          </Pressable>
        </View>

        <CalendarDatePicker
          visible={showDatePicker}
          selectedDate={expiryDate}
          onSelect={(dateStr) => { setExpiryDate(dateStr); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />

        {/* Notes */}
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Storage instructions, special handling..." multiline />

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button label={isEdit ? 'Save Changes' : 'Create Product'} onPress={validateAndSave} style={{ flex: 1 }} />
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
  selectedChip: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.navyLight, marginBottom: spacing.sm },
  supplierSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  supplierSearchInput: {
    flex: 1,
    ...typography.body,
    color: colors.black,
    height: '100%',
    marginLeft: spacing.sm,
  },
  supplierToggle: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  dropdown: { borderWidth: 1, borderColor: colors.lightGrey, borderRadius: radius.md, marginBottom: spacing.sm, maxHeight: 220, backgroundColor: colors.white },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  dropdownEmpty: { padding: spacing.lg, alignItems: 'center' },
  dropdownAddNew: { borderTopWidth: 1, borderTopColor: colors.lightGrey, borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  taxRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  taxPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  taxPillActive: { backgroundColor: colors.navyBlue },
  costPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.sm },
  fieldWrap: { marginBottom: spacing.base },
  dateLabel: { ...typography.caption, color: colors.darkGrey, marginBottom: spacing.xs },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  buttonRow: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
});
