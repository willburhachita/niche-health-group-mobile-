import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Switch, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../components/common/CustomAlert';

function formatCurrency(amount) {
  return `K ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatTime(ms) {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ms) {
  const d = new Date(ms);
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

const TAX_TYPES = [
  { key: 'vat_16', label: 'VAT 16%', rate: 0.16 },
  { key: 'zero_rated', label: 'Zero-rated', rate: 0 },
  { key: 'exempt', label: 'Exempt', rate: 0 },
];

// Default charges by appointment type
const TYPE_CHARGES = {
  'Consultation': { description: 'Consultation Fee', price: 500 },
  'Follow-up': { description: 'Follow-up Consultation', price: 300 },
  'Dialysis': { description: 'Dialysis Session', price: 2500 },
  'Lab Work': { description: 'Laboratory Tests', price: 800 },
  'Telehealth': { description: 'Telehealth Consultation', price: 400 },
  'Emergency': { description: 'Emergency Assessment', price: 1000 },
};

export default function CreateInvoiceScreen({ navigation }) {
  const customAlert = useAlert();
  const { currentAccount } = useAuth();
  const nextNumber = useQuery(api.invoices.getNextNumber) ?? 'INV-001';
  const createInvoice = useMutation(api.invoices.create);

  // Patient
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientList, setShowPatientList] = useState(false);

  // Appointment
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAptList, setShowAptList] = useState(false);
  const [aptFilter, setAptFilter] = useState('patient'); // 'patient' | 'today'

  // Line items: { description, quantity, price, stockItemId?, stockItemName? }
  const [lineItems, setLineItems] = useState([{ description: '', quantity: '1', price: '', stockItemId: null, stockItemName: '' }]);
  const [notes, setNotes] = useState('');
  const [sendToPatient, setSendToPatient] = useState(false);
  const [selectedTax, setSelectedTax] = useState('exempt');
  const [submitToNhima, setSubmitToNhima] = useState(false);

  // Stock item picker
  const [activeLineIndex, setActiveLineIndex] = useState(null);
  const [stockSearch, setStockSearch] = useState('');
  const [showStockPicker, setShowStockPicker] = useState(false);

  // Queries
  const searchResults = useQuery(api.patients.search, { query: patientSearch });
  const allPatients = useQuery(api.patients.list, {}) ?? [];
  const filteredPatients = patientSearch.length > 0
    ? (searchResults ?? [])
    : allPatients.filter(p => p.status === 'active');

  const uninvoicedByPatient = useQuery(
    api.appointments.listUninvoiced,
    selectedPatient ? { patientId: selectedPatient._id } : 'skip'
  ) ?? [];
  const todayUninvoiced = useQuery(api.appointments.listTodayUninvoiced) ?? [];
  const patients = useQuery(api.patients.list, {}) ?? [];

  const displayedApts = aptFilter === 'patient' ? uninvoicedByPatient : todayUninvoiced;

  const allStock = useQuery(api.stock.list, { status: 'active' }) ?? [];
  const filteredStock = useMemo(() => {
    if (!stockSearch.trim()) return allStock;
    const q = stockSearch.toLowerCase();
    return allStock.filter(s => s.name.toLowerCase().includes(q) || (s.itemCode && s.itemCode.toLowerCase().includes(q)));
  }, [stockSearch, allStock]);

  // Get patient name for today's appointments
  const getPatientName = (patientId) => {
    const p = patients.find(pt => pt._id === patientId);
    return p ? p.displayName : 'Unknown';
  };

  // When selecting appointment, auto-populate line items
  const handleSelectAppointment = (apt) => {
    setSelectedAppointment(apt);
    setShowAptList(false);

    // If patient not selected yet (from today's list), select them
    if (!selectedPatient && apt.patientId) {
      const p = patients.find(pt => pt._id === apt.patientId);
      if (p) setSelectedPatient(p);
    }

    // Auto-populate charge from appointment type
    const typeCharge = TYPE_CHARGES[apt.type] || { description: `${apt.type || 'Appointment'} Fee`, price: 500 };
    setLineItems([{ description: typeCharge.description, quantity: '1', price: String(typeCharge.price), stockItemId: null, stockItemName: '' }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: '1', price: '', stockItemId: null, stockItemName: '' }]);
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

  const linkStockItem = (stockItem) => {
    if (activeLineIndex === null) return;
    const updated = [...lineItems];
    updated[activeLineIndex] = {
      ...updated[activeLineIndex],
      description: stockItem.name,
      price: String(stockItem.pricePerItem),
      stockItemId: stockItem._id,
      stockItemName: stockItem.name,
    };
    setLineItems(updated);
    setShowStockPicker(false);
    setActiveLineIndex(null);
    setStockSearch('');
  };

  const addStockAsLineItem = (stockItem) => {
    setLineItems(prev => [...prev, {
      description: stockItem.name,
      quantity: '1',
      price: String(stockItem.pricePerItem),
      stockItemId: stockItem._id,
      stockItemName: stockItem.name,
    }]);
    setShowStockPicker(false);
    setStockSearch('');
  };

  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.price) || 0;
    return sum + (qty * price);
  }, 0);

  const taxRate = TAX_TYPES.find(t => t.key === selectedTax)?.rate || 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  const handleSave = async () => {
    if (!selectedPatient) {
      customAlert({ type: 'warning', title: 'Required', message: 'Please select a patient.' });
      return;
    }
    const validItems = lineItems.filter(i => i.description && i.price);
    if (validItems.length === 0) {
      customAlert({ type: 'warning', title: 'Required', message: 'Please add at least one line item.' });
      return;
    }

    // Check stock availability for linked items
    for (const item of validItems) {
      if (item.stockItemId) {
        const si = allStock.find(s => s._id === item.stockItemId);
        if (si && si.stockLevel < (parseFloat(item.quantity) || 1)) {
          customAlert({ type: 'warning', title: 'Insufficient Stock', message: `${si.name} only has ${si.stockLevel} in stock but ${item.quantity} requested.` });
          return;
        }
      }
    }

    try {
      await createInvoice({
        invoiceNumber: nextNumber,
        patientId: selectedPatient._id,
        appointmentId: selectedAppointment?._id || undefined,
        dueDate: Date.now() + 30 * 86400000,
        lineItems: validItems.map(i => ({
          description: i.description,
          quantity: parseFloat(i.quantity) || 1,
          unitPrice: parseFloat(i.price) || 0,
          stockItemId: i.stockItemId || undefined,
        })),
        tax: taxAmount,
        notes: notes || undefined,
        createdBy: currentAccount?.userId || 'unknown',
      });

      const stockItems = validItems.filter(i => i.stockItemId);
      const stockMsg = stockItems.length > 0
        ? `\n${stockItems.length} stock item(s) auto-deducted.`
        : '';

      customAlert({
        type: 'success',
        title: 'Invoice Created',
        message: `${nextNumber} for ${selectedPatient.displayName}\nTotal: ${formatCurrency(total)}${stockMsg}`,
        buttons: [{ label: 'OK', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      customAlert({ type: 'warning', title: 'Error', message: e.message || 'Failed to create invoice.' });
    }
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Selection */}
        <AppText variant="bodyBold" style={styles.label}>Patient</AppText>
        {selectedPatient ? (
          <Pressable style={styles.selectedChip} onPress={() => { setSelectedPatient(null); setSelectedAppointment(null); setShowPatientList(true); }}>
            <Avatar name={selectedPatient.displayName} size={36} />
            <View style={styles.selectedInfo}>
              <AppText variant="bodyBold">{selectedPatient.displayName}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{selectedPatient.patientCode}</AppText>
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
              <View style={styles.dropdown}>
                {filteredPatients.slice(0, 5).map(p => (
                  <Pressable
                    key={p._id}
                    style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
                    onPress={() => { setSelectedPatient(p); setShowPatientList(false); setPatientSearch(''); }}
                  >
                    <Avatar name={p.displayName} size={32} />
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <AppText variant="body">{p.displayName}</AppText>
                      <AppText variant="small" color={colors.mediumGrey}>{p.patientCode}</AppText>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}

        <Divider type="section" />

        {/* Appointment Selection */}
        <AppText variant="bodyBold" style={styles.label}>Link to Appointment (optional)</AppText>
        <View style={styles.aptFilterRow}>
          <Pressable
            style={[styles.aptFilterPill, aptFilter === 'patient' && styles.aptFilterActive]}
            onPress={() => setAptFilter('patient')}
          >
            <AppText variant="small" color={aptFilter === 'patient' ? colors.white : colors.darkGrey}>Patient Uninvoiced</AppText>
          </Pressable>
          <Pressable
            style={[styles.aptFilterPill, aptFilter === 'today' && styles.aptFilterActive]}
            onPress={() => setAptFilter('today')}
          >
            <AppText variant="small" color={aptFilter === 'today' ? colors.white : colors.darkGrey}>Today Uninvoiced</AppText>
          </Pressable>
        </View>

        {selectedAppointment ? (
          <View style={styles.selectedChip}>
            <Feather name="calendar" size={18} color={colors.navyBlue} />
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <AppText variant="bodyBold">{selectedAppointment.type || 'Appointment'}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>
                {formatDate(selectedAppointment.startTime)} at {formatTime(selectedAppointment.startTime)}
              </AppText>
            </View>
            <Pressable hitSlop={8} onPress={() => setSelectedAppointment(null)}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable style={styles.selectBtn} onPress={() => setShowAptList(!showAptList)}>
              <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
              <AppText variant="body" color={colors.mediumGrey} style={{ flex: 1 }}>
                {aptFilter === 'patient' && !selectedPatient ? 'Select a patient first' : 'Select appointment'}
              </AppText>
              <Feather name={showAptList ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mediumGrey} />
            </Pressable>
            {showAptList && (
              <View style={styles.dropdown}>
                {displayedApts.length === 0 ? (
                  <View style={styles.emptyRow}>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <AppText variant="body" color={colors.mediumGrey} style={{ marginLeft: spacing.sm }}>
                      {aptFilter === 'patient' && !selectedPatient ? 'Select a patient first' : 'All appointments invoiced'}
                    </AppText>
                  </View>
                ) : (
                  displayedApts.map(apt => (
                    <Pressable
                      key={apt._id}
                      style={({ pressed }) => [styles.dropdownItem, pressed && styles.pressed]}
                      onPress={() => handleSelectAppointment(apt)}
                    >
                      <View style={[styles.aptIcon, { backgroundColor: apt.status === 'completed' ? colors.success + '20' : colors.navyLight }]}>
                        <Feather name={apt.status === 'completed' ? 'check' : 'clock'} size={14} color={apt.status === 'completed' ? colors.success : colors.navyBlue} />
                      </View>
                      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                        <AppText variant="body">{apt.type || 'Appointment'}</AppText>
                        <AppText variant="small" color={colors.mediumGrey}>
                          {formatDate(apt.startTime)} {formatTime(apt.startTime)}
                          {aptFilter === 'today' && apt.patientId ? ` - ${getPatientName(apt.patientId)}` : ''}
                        </AppText>
                      </View>
                      <AppText variant="caption" color={apt.status === 'completed' ? colors.success : colors.navyBlue}>
                        {apt.status}
                      </AppText>
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </>
        )}

        <Divider type="section" />

        {/* Line Items */}
        <View style={styles.lineItemsHeader}>
          <AppText variant="bodyBold">Line Items</AppText>
          <Pressable onPress={() => { setActiveLineIndex(null); setShowStockPicker(!showStockPicker); }} style={styles.stockBtn}>
            <Feather name="package" size={14} color={colors.navyBlue} />
            <AppText variant="small" color={colors.navyBlue} style={{ marginLeft: 4 }}>Add from Stock</AppText>
          </Pressable>
        </View>

        {/* Stock item picker */}
        {showStockPicker && (
          <View style={styles.stockPickerBox}>
            <View style={styles.stockSearchRow}>
              <Feather name="search" size={16} color={colors.mediumGrey} />
              <TextInput
                style={styles.stockSearchInput}
                placeholder="Search stock items..."
                placeholderTextColor={colors.mediumGrey}
                value={stockSearch}
                onChangeText={setStockSearch}
              />
              <Pressable hitSlop={8} onPress={() => { setShowStockPicker(false); setStockSearch(''); }}>
                <Feather name="x" size={16} color={colors.mediumGrey} />
              </Pressable>
            </View>
            {filteredStock.slice(0, 6).map(s => (
              <Pressable
                key={s._id}
                style={({ pressed }) => [styles.stockRow, pressed && styles.pressed]}
                onPress={() => activeLineIndex !== null ? linkStockItem(s) : addStockAsLineItem(s)}
              >
                <View style={styles.stockIcon}>
                  <Feather name="package" size={14} color={colors.navyBlue} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <AppText variant="body">{s.name}</AppText>
                  <AppText variant="small" color={colors.mediumGrey}>{s.itemCode} - Stock: {s.stockLevel}</AppText>
                </View>
                <AppText variant="bodyBold" color={colors.navyBlue}>{formatCurrency(s.pricePerItem)}</AppText>
              </Pressable>
            ))}
            {filteredStock.length === 0 && (
              <View style={styles.emptyRow}>
                <AppText variant="body" color={colors.mediumGrey}>No stock items found</AppText>
              </View>
            )}
          </View>
        )}

        {lineItems.map((item, index) => (
          <View key={index} style={styles.lineItem}>
            <View style={styles.lineItemHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <AppText variant="caption" color={colors.mediumGrey}>Item {index + 1}</AppText>
                {item.stockItemId && (
                  <View style={styles.stockBadge}>
                    <Feather name="package" size={10} color={colors.success} />
                    <AppText variant="small" color={colors.success} style={{ marginLeft: 2 }}>Stock linked</AppText>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {!item.stockItemId && (
                  <Pressable onPress={() => { setActiveLineIndex(index); setShowStockPicker(true); }} hitSlop={8}>
                    <Feather name="link" size={15} color={colors.navyBlue} />
                  </Pressable>
                )}
                {lineItems.length > 1 && (
                  <Pressable onPress={() => removeLineItem(index)} hitSlop={8}>
                    <Feather name="trash-2" size={16} color={colors.error} />
                  </Pressable>
                )}
              </View>
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
          <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.sm }}>Add Custom Item</AppText>
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

        {/* Stock deduction warning */}
        {lineItems.some(i => i.stockItemId) && (
          <View style={styles.stockWarning}>
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <AppText variant="small" color={colors.darkGrey} style={{ flex: 1, marginLeft: spacing.sm }}>
              Stock items will be auto-deducted when this invoice is created.
            </AppText>
          </View>
        )}

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
      </KeyboardAvoidingView>
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
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
  },
  selectedInfo: { flex: 1, marginLeft: spacing.sm },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    marginTop: spacing.xs,
    maxHeight: 280,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  pressed: { backgroundColor: colors.offWhite },
  emptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  // Appointment filter
  aptFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  aptFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.offWhite,
  },
  aptFilterActive: {
    backgroundColor: colors.navyBlue,
  },
  aptIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Line items
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  stockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
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
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.success + '15',
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
  // Stock picker
  stockPickerBox: {
    borderWidth: 1,
    borderColor: colors.navyBlue,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  stockSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  stockSearchInput: {
    flex: 1,
    ...typography.body,
    color: colors.black,
    marginLeft: spacing.sm,
    height: 36,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  stockIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.warning + '12',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  // Totals
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
