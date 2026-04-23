import React, { useState } from 'react';
import { View, ScrollView, Pressable, Switch, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { getStockItemById, TAX_TYPES, mockStockItems } from '../../data/mockStock';
import { mockSuppliers, searchSuppliers } from '../../data/mockSuppliers';

export default function CreateEditProductScreen({ route, navigation }) {
  const alert = useAlert();
  const stockItemId = route.params?.stockItemId;
  const existing = stockItemId ? getStockItemById(stockItemId) : null;
  const isEdit = !!existing;

  const [itemCode, setItemCode] = useState(existing?.itemCode || `STK-${String(mockStockItems.length + 1).padStart(3, '0')}`);
  const [name, setName] = useState(existing?.name || '');
  const [serialNumber, setSerialNumber] = useState(existing?.serialNumber || '');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(
    existing?.supplierId ? mockSuppliers.find(s => s.id === existing.supplierId) : null
  );
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [pricePerItem, setPricePerItem] = useState(existing ? String(existing.pricePerItem) : '');
  const [includesTax, setIncludesTax] = useState(existing?.includesTax || false);
  const [selectedTax, setSelectedTax] = useState(existing?.taxType || 'vat_16');
  const [stockLevel, setStockLevel] = useState(existing ? String(existing.stockLevel) : '');
  const [expiryDate, setExpiryDate] = useState(existing?.expiryDate ? new Date(existing.expiryDate).toISOString().split('T')[0] : '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [codeError, setCodeError] = useState('');
  const [nameError, setNameError] = useState('');

  const filteredSuppliers = supplierSearch.length > 0
    ? searchSuppliers(supplierSearch)
    : mockSuppliers;

  const taxRate = TAX_TYPES.find(t => t.key === selectedTax)?.rate || 0;
  const price = parseFloat(pricePerItem) || 0;
  const costPrice = includesTax ? price : price * (1 + taxRate);

  const validateAndSave = () => {
    let valid = true;
    setCodeError('');
    setNameError('');

    if (!name.trim()) { setNameError('Product name is required'); valid = false; }

    const duplicate = mockStockItems.find(s => s.itemCode === itemCode && s.id !== existing?.id);
    if (duplicate) { setCodeError('Item code already exists'); valid = false; }

    const nameDuplicate = mockStockItems.find(s =>
      s.name.toLowerCase() === name.trim().toLowerCase() && s.id !== existing?.id
    );
    if (nameDuplicate) {
      alert({ type: 'warning', title: 'Possible Duplicate', message: `A product named "${nameDuplicate.name}" already exists (${nameDuplicate.itemCode}). Are you sure you want to continue?`, buttons: [{ label: 'Cancel', style: 'cancel' }, { label: 'Continue', onPress: () => doSave() }] });
      return;
    }

    if (valid) doSave();
  };

  const doSave = () => {
    alert({ type: 'success', title: isEdit ? 'Product Updated' : 'Product Created', message: `${name} has been ${isEdit ? 'updated' : 'added to inventory'}.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
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
            <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>{selectedSupplier.name}</AppText>
            <Pressable onPress={() => { setSelectedSupplier(null); setShowSupplierList(true); }}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </View>
        ) : (
          <>
            <SearchBar placeholder="Search suppliers..." value={supplierSearch} onChangeText={(t) => { setSupplierSearch(t); setShowSupplierList(true); }} />
            {showSupplierList && (
              <View style={styles.dropdown}>
                {filteredSuppliers.map(s => (
                  <Pressable key={s.id} style={styles.dropdownItem} onPress={() => { setSelectedSupplier(s); setShowSupplierList(false); setSupplierSearch(''); }}>
                    <AppText variant="body">{s.name}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>{s.contactPerson}</AppText>
                  </Pressable>
                ))}
                <Pressable style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: colors.lightGrey }]} onPress={() => navigation.navigate('CreateEditSupplier')}>
                  <AppText variant="bodyBold" color={colors.navyBlue}>+ Add New Supplier</AppText>
                </Pressable>
              </View>
            )}
          </>
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
        <Input label="Expiry Date (YYYY-MM-DD)" value={expiryDate} onChangeText={setExpiryDate} placeholder="e.g. 2026-10-15" />

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
  dropdown: { borderWidth: 1, borderColor: colors.lightGrey, borderRadius: radius.md, marginBottom: spacing.sm, maxHeight: 200 },
  dropdownItem: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  taxRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  taxPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  taxPillActive: { backgroundColor: colors.navyBlue },
  costPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.sm },
  buttonRow: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.sm },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
});
