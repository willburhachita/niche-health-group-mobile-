import React, { useState } from 'react';
import { View, ScrollView, Pressable, FlatList, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';

const COUNTRY_CODES = [
  { code: '+260', country: 'Zambia', flag: 'ZM' },
  { code: '+27', country: 'South Africa', flag: 'ZA' },
  { code: '+254', country: 'Kenya', flag: 'KE' },
  { code: '+255', country: 'Tanzania', flag: 'TZ' },
  { code: '+256', country: 'Uganda', flag: 'UG' },
  { code: '+263', country: 'Zimbabwe', flag: 'ZW' },
  { code: '+265', country: 'Malawi', flag: 'MW' },
  { code: '+258', country: 'Mozambique', flag: 'MZ' },
  { code: '+267', country: 'Botswana', flag: 'BW' },
  { code: '+264', country: 'Namibia', flag: 'NA' },
  { code: '+243', country: 'DR Congo', flag: 'CD' },
  { code: '+234', country: 'Nigeria', flag: 'NG' },
  { code: '+233', country: 'Ghana', flag: 'GH' },
  { code: '+44', country: 'United Kingdom', flag: 'GB' },
  { code: '+1', country: 'United States', flag: 'US' },
  { code: '+91', country: 'India', flag: 'IN' },
  { code: '+86', country: 'China', flag: 'CN' },
  { code: '+971', country: 'UAE', flag: 'AE' },
];
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function CreateEditSupplierScreen({ route, navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const supplierId = route.params?.supplierId;
  const existing = useQuery(api.suppliers.get, supplierId ? { id: supplierId } : 'skip');
  const isEdit = !!existing;
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);

  const [name, setName] = useState(existing?.name || '');
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson || '');
  const [countryCode, setCountryCode] = useState(() => {
    if (existing?.phone) {
      const match = COUNTRY_CODES.find(c => existing.phone.startsWith(c.code));
      return match || COUNTRY_CODES[0];
    }
    return COUNTRY_CODES[0];
  });
  const [phone, setPhone] = useState(() => {
    if (existing?.phone) {
      const match = COUNTRY_CODES.find(c => existing.phone.startsWith(c.code));
      return match ? existing.phone.slice(match.code.length).trim() : existing.phone;
    }
    return '';
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [city, setCity] = useState(existing?.city || '');
  const [region, setRegion] = useState(existing?.region || '');
  const [country, setCountry] = useState(existing?.country || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSave = async () => {
    if (!name.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Supplier name is required.' });
      return;
    }
    try {
      if (isEdit) {
        await updateSupplier({
          id: supplierId,
          name: name.trim(),
          contactPerson: contactPerson || undefined,
          phone: phone ? `${countryCode.code}${phone}` : undefined,
          email: email || undefined,
          address: address || undefined,
          city: city || undefined,
          region: region || undefined,
          country: country || undefined,
          notes: notes || undefined,
        });
      } else {
        await createSupplier({
          name: name.trim(),
          contactPerson: contactPerson || undefined,
          phone: phone ? `${countryCode.code}${phone}` : undefined,
          email: email || undefined,
          address: address || undefined,
          city: city || undefined,
          region: region || undefined,
          country: country || undefined,
          notes: notes || undefined,
          createdBy: currentAccount?.userId || 'unknown',
        });
      }
      alert({
        type: 'success',
        title: isEdit ? 'Supplier Updated' : 'Supplier Created',
        message: `${name} has been ${isEdit ? 'updated' : 'added'}.`,
        buttons: [{ label: 'OK', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to save supplier.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>{isEdit ? 'Edit Supplier' : 'New Supplier'}</AppText>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <Input label="Supplier Name" value={name} onChangeText={setName} placeholder="e.g. MedSupply Zambia Ltd" />
        <Input label="Contact Person" value={contactPerson} onChangeText={setContactPerson} placeholder="e.g. David Kangwa" />
        <View style={styles.fieldWrap}>
          <AppText style={styles.fieldLabel}>Phone</AppText>
          <View style={styles.phoneRow}>
            <Pressable style={styles.codeBtn} onPress={() => { setCountrySearch(''); setShowCountryPicker(true); }}>
              <AppText variant="body">{countryCode.flag}</AppText>
              <AppText variant="body" style={{ marginLeft: spacing.xs }}>{countryCode.code}</AppText>
              <Feather name="chevron-down" size={14} color={colors.mediumGrey} style={{ marginLeft: 2 }} />
            </Pressable>
            <View style={styles.phoneInputWrap}>
              <Input value={phone} onChangeText={setPhone} placeholder="97 1234567" keyboardType="phone-pad" style={{ marginBottom: 0 }} />
            </View>
          </View>
        </View>

        <Modal visible={showCountryPicker} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <AppText variant="h3">Select Country Code</AppText>
                <Pressable onPress={() => setShowCountryPicker(false)} hitSlop={8}>
                  <Feather name="x" size={22} color={colors.black} />
                </Pressable>
              </View>
              <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.sm }}>
                <SearchBar placeholder="Search country..." value={countrySearch} onChangeText={setCountrySearch} />
              </View>
              <FlatList
                data={COUNTRY_CODES.filter(c => {
                  if (!countrySearch) return true;
                  const q = countrySearch.toLowerCase();
                  return c.country.toLowerCase().includes(q) || c.code.includes(q);
                })}
                keyExtractor={item => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.countryRow, item.code === countryCode.code && styles.countryRowActive]}
                    onPress={() => { setCountryCode(item); setShowCountryPicker(false); }}
                  >
                    <AppText variant="body" style={{ width: 28 }}>{item.flag}</AppText>
                    <AppText variant="body" style={{ flex: 1 }}>{item.country}</AppText>
                    <AppText variant="body" color={colors.darkGrey}>{item.code}</AppText>
                    {item.code === countryCode.code && <Feather name="check" size={16} color={colors.navyBlue} style={{ marginLeft: spacing.sm }} />}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.offWhite }} />}
              />
            </View>
          </View>
        </Modal>
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="orders@example.com" keyboardType="email-address" />
        <Input label="Address" value={address} onChangeText={setAddress} placeholder="Street address" />
        <Input label="City / Town" value={city} onChangeText={setCity} placeholder="e.g. Lusaka" />
        <Input label="Region / Province" value={region} onChangeText={setRegion} placeholder="e.g. Lusaka Province" />
        <Input label="Country" value={country} onChangeText={setCountry} placeholder="e.g. Zambia" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Delivery terms, minimum orders..." multiline />

        <View style={{ marginTop: spacing.xl }}>
          <Button label={isEdit ? 'Save Changes' : 'Add Supplier'} onPress={handleSave} />
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
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  fieldWrap: { marginBottom: spacing.base },
  fieldLabel: { ...typography.caption, color: colors.darkGrey, marginBottom: spacing.xs },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  phoneInputWrap: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '70%',
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  countryRowActive: { backgroundColor: colors.navyLight },
});
