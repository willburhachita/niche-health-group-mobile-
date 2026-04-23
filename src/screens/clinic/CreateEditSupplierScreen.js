import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { getSupplierById } from '../../data/mockSuppliers';

export default function CreateEditSupplierScreen({ route, navigation }) {
  const alert = useAlert();
  const supplierId = route.params?.supplierId;
  const existing = supplierId ? getSupplierById(supplierId) : null;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [contactPerson, setContactPerson] = useState(existing?.contactPerson || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  const handleSave = () => {
    if (!name.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Supplier name is required.' });
      return;
    }
    alert({
      type: 'success',
      title: isEdit ? 'Supplier Updated' : 'Supplier Created',
      message: `${name} has been ${isEdit ? 'updated' : 'added'}.`,
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
        <AppText variant="h2" style={styles.headerTitle}>{isEdit ? 'Edit Supplier' : 'New Supplier'}</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <Input label="Supplier Name" value={name} onChangeText={setName} placeholder="e.g. MedSupply Zambia Ltd" />
        <Input label="Contact Person" value={contactPerson} onChangeText={setContactPerson} placeholder="e.g. David Kangwa" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+260..." keyboardType="phone-pad" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="orders@example.com" keyboardType="email-address" />
        <Input label="Address" value={address} onChangeText={setAddress} placeholder="Street address, city" />
        <Input label="Notes" value={notes} onChangeText={setNotes} placeholder="Delivery terms, minimum orders..." multiline />

        <View style={{ marginTop: spacing.xl }}>
          <Button label={isEdit ? 'Save Changes' : 'Add Supplier'} onPress={handleSave} />
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
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
});
