import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform, StyleSheet, Image, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CalendarDatePicker } from '../../components/common/CalendarDatePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';

const GENDERS = ['Male', 'Female', 'Other'];

export default function AddEditPatientScreen({ route, navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const patientId = route?.params?.patientId;
  const existing = useQuery(api.patients.get, patientId ? { id: patientId } : 'skip');
  const nextCode = useQuery(api.patients.getNextPatientCode);
  const createPatient = useMutation(api.patients.create);
  const updatePatient = useMutation(api.patients.update);
  const isEdit = !!existing;

  const [firstName, setFirstName] = useState(existing?.firstName || '');
  const [lastName, setLastName] = useState(existing?.lastName || '');
  const [dob, setDob] = useState(existing?.dateOfBirth || '');
  const [gender, setGender] = useState(existing?.gender || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [email, setEmail] = useState(existing?.email || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [nrcNumber, setNrcNumber] = useState(existing?.nrcNumber || '');
  const [occupation, setOccupation] = useState(existing?.occupation || '');
  const [employer, setEmployer] = useState(existing?.employer || '');
  const [allergies, setAllergies] = useState(existing?.allergies?.join(', ') || '');
  const [conditions, setConditions] = useState(existing?.conditions?.join(', ') || '');
  const [bloodType, setBloodType] = useState(existing?.bloodType || '');
  const [insuranceProvider, setInsuranceProvider] = useState(existing?.insuranceProvider || '');
  const [policyNumber, setPolicyNumber] = useState(existing?.policyNumber || '');
  const [otherInsurers, setOtherInsurers] = useState(
    existing?.otherInsuranceProviders || []
  );
  const [ecName, setEcName] = useState(existing?.emergencyContactName || '');
  const [ecPhone, setEcPhone] = useState(existing?.emergencyContactPhone || '');
  const [ecRelationship, setEcRelationship] = useState(existing?.emergencyContactRelationship || '');
  // NHIMA
  const [nhimaMemberNo, setNhimaMemberNo] = useState(existing?.nhimaMemberNo || '');
  const [nhimaScheme, setNhimaScheme] = useState(existing?.nhimaScheme || '');
  const [nhimaEmployer, setNhimaEmployer] = useState(existing?.nhimaEmployer || '');
  // Consent & Comm Preferences
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [prefSms, setPrefSms] = useState(true);
  const [prefEmail, setPrefEmail] = useState(false);
  const [prefPhone, setPrefPhone] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(existing?.profileImageUrl || null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const pickImage = async (useCamera = false) => {
    let result;
    if (useCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { alert({ type: 'warning', title: 'Permission', message: 'Camera access is needed.' }); return; }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    } else {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { alert({ type: 'warning', title: 'Permission', message: 'Photo library access is needed.' }); return; }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    }
    if (!result.canceled && result.assets?.[0]) {
      setProfileImageUri(result.assets[0].uri);
    }
  };

  const handleImagePress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (idx) => { if (idx === 1) pickImage(true); else if (idx === 2) pickImage(false); }
      );
    } else {
      // Android: show Alert with options
      Alert.alert(
        'Patient Photo',
        'Choose how to add a photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: () => pickImage(true) },
          { text: 'Choose from Library', onPress: () => pickImage(false) },
        ],
        { cancelable: true }
      );
    }
  };

  const calculatedAge = useMemo(() => {
    if (!dob) return null;
    const [y, m, d] = dob.split('-').map(Number);
    const birth = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }, [dob]);

  const [showDobPicker, setShowDobPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'First name and last name are required.' });
      return;
    }
    if (!isEdit && (!consentPrivacy || !consentData)) {
      alert({ type: 'warning', title: 'Consent Required', message: 'Privacy policy and data access consent must be accepted for new patients.' });
      return;
    }
    setSaving(true);
    try {
      // Upload profile image if a new local image was selected
      let uploadedImageUrl = profileImageUri;
      if (profileImageUri && !profileImageUri.startsWith('http')) {
        try {
          const uploadUrl = await generateUploadUrl();
          const resp = await fetch(profileImageUri);
          const blob = await resp.blob();
          const uploadResp = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'Content-Type': blob.type || 'image/jpeg' },
            body: blob,
          });
          const { storageId } = await uploadResp.json();
          uploadedImageUrl = storageId;
        } catch (imgErr) {
          console.warn('Image upload failed:', imgErr);
        }
      }

      if (isEdit) {
        await updatePatient({
          id: patientId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          gender,
          phone,
          email: email || undefined,
          address: address || undefined,
          nrcNumber: nrcNumber || undefined,
          occupation: occupation || undefined,
          employer: employer || undefined,
          profileImageUrl: uploadedImageUrl || undefined,
          allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          conditions: conditions ? conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          bloodType: bloodType || undefined,
          insuranceProvider: insuranceProvider || undefined,
          policyNumber: policyNumber || undefined,
          otherInsuranceProviders: otherInsurers.filter(i => i.provider.trim()).length > 0
            ? otherInsurers.filter(i => i.provider.trim()).map(i => ({ provider: i.provider.trim(), policyNumber: i.policyNumber || undefined }))
            : undefined,
          emergencyContactName: ecName || undefined,
          emergencyContactPhone: ecPhone || undefined,
          emergencyContactRelationship: ecRelationship || undefined,
        });
      } else {
        await createPatient({
          patientCode: nextCode || 'PT-001',
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          gender,
          phone,
          email: email || undefined,
          address: address || undefined,
          nrcNumber: nrcNumber || undefined,
          occupation: occupation || undefined,
          employer: employer || undefined,
          profileImageUrl: uploadedImageUrl || undefined,
          allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          conditions: conditions ? conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          medications: [],
          bloodType: bloodType || undefined,
          insuranceProvider: insuranceProvider || undefined,
          policyNumber: policyNumber || undefined,
          otherInsuranceProviders: otherInsurers.filter(i => i.provider.trim()).length > 0
            ? otherInsurers.filter(i => i.provider.trim()).map(i => ({ provider: i.provider.trim(), policyNumber: i.policyNumber || undefined }))
            : undefined,
          emergencyContactName: ecName || undefined,
          emergencyContactPhone: ecPhone || undefined,
          emergencyContactRelationship: ecRelationship || undefined,
          department: 'General',
          createdBy: currentAccount?.userId || 'unknown',
        });
      }
      const label = isEdit ? 'Updated' : 'Registered';
      alert({ type: 'success', title: `Patient ${label}`, message: `${firstName} ${lastName} has been ${label.toLowerCase()}.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to save patient.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>
          {isEdit ? 'Edit Patient' : 'New Patient'}
        </AppText>
        <Pressable onPress={handleSave} hitSlop={8}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Save</AppText>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarPlaceholder}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.avatarImage} />
            ) : (
              <Feather name="user" size={32} color={colors.mediumGrey} />
            )}
          </View>
          <Pressable style={styles.cameraBtn} onPress={handleImagePress}>
            <Feather name="camera" size={14} color={colors.white} />
          </Pressable>
        </View>

        {/* Personal */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PERSONAL</AppText>
        <Input label="First Name" placeholder="Enter first name" value={firstName} onChangeText={setFirstName} />
        <Input label="Last Name" placeholder="Enter last name" value={lastName} onChangeText={setLastName} />
        <AppText variant="bodyBold" style={styles.fieldLabel}>Date of Birth</AppText>
        <Pressable style={styles.dateBtn} onPress={() => setShowDobPicker(true)}>
          <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={dob ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
            {dob || 'Select date of birth'}
          </AppText>
          <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
        </Pressable>
        <CalendarDatePicker
          visible={showDobPicker}
          selectedDate={dob}
          onSelect={(date) => { setDob(date); setShowDobPicker(false); }}
          onClose={() => setShowDobPicker(false)}
          minYear={1920}
          maxYear={new Date().getFullYear()}
        />

        <AppText variant="bodyBold" style={styles.fieldLabel}>Gender</AppText>
        <View style={styles.genderRow}>
          {GENDERS.map(g => (
            <Pressable
              key={g}
              style={[styles.genderPill, gender === g && styles.genderPillActive]}
              onPress={() => setGender(g)}
            >
              <AppText variant="caption" color={gender === g ? colors.white : colors.navyBlue}>{g}</AppText>
            </Pressable>
          ))}
        </View>

        {calculatedAge !== null && (
          <View style={styles.ageBadge}>
            <Feather name="info" size={14} color={colors.navyBlue} />
            <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.xs }}>Age: {calculatedAge} years</AppText>
          </View>
        )}

        <Input label="NRC Number" placeholder="e.g. 123456/78/1" value={nrcNumber} onChangeText={setNrcNumber} icon="credit-card" />
        <Input label="Phone" placeholder="+260..." value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
        <Input label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} icon="mail" keyboardType="email-address" />
        <Input label="Home Address" placeholder="e.g. 123 Main Rd, Lusaka" value={address} onChangeText={setAddress} icon="map-pin" />

        <Divider type="section" />

        {/* Employment */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>EMPLOYMENT</AppText>
        <Input label="Occupation" placeholder="e.g. Teacher, Nurse" value={occupation} onChangeText={setOccupation} icon="briefcase" />
        <Input label="Employer" placeholder="Company / Organisation" value={employer} onChangeText={setEmployer} icon="home" />

        <Divider type="section" />

        {/* Medical */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>MEDICAL</AppText>
        <Input label="Allergies" placeholder="e.g. Penicillin, Ibuprofen" value={allergies} onChangeText={setAllergies} />
        <Input label="Conditions" placeholder="Comma-separated" value={conditions} onChangeText={setConditions} />
        <Input label="Blood Type" placeholder="e.g. O+" value={bloodType} onChangeText={setBloodType} />

        <Divider type="section" />

        {/* Insurance */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>INSURANCE</AppText>
        <Input label="Primary Provider" placeholder="e.g. NHIMA" value={insuranceProvider} onChangeText={setInsuranceProvider} />
        <Input label="Policy Number" placeholder="e.g. NHI-12345" value={policyNumber} onChangeText={setPolicyNumber} />

        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>OTHER INSURANCE PROVIDERS</AppText>
        {otherInsurers.map((ins, idx) => (
          <View key={idx} style={styles.otherInsurerRow}>
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Provider name"
                value={ins.provider}
                onChangeText={text => {
                  const updated = [...otherInsurers];
                  updated[idx] = { ...updated[idx], provider: text };
                  setOtherInsurers(updated);
                }}
              />
              <Input
                placeholder="Policy number (optional)"
                value={ins.policyNumber || ''}
                onChangeText={text => {
                  const updated = [...otherInsurers];
                  updated[idx] = { ...updated[idx], policyNumber: text };
                  setOtherInsurers(updated);
                }}
              />
            </View>
            <Pressable
              hitSlop={8}
              style={styles.removeInsurerBtn}
              onPress={() => setOtherInsurers(otherInsurers.filter((_, i) => i !== idx))}
            >
              <Feather name="trash-2" size={18} color={colors.error} />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={styles.addInsurerBtn}
          onPress={() => setOtherInsurers([...otherInsurers, { provider: '', policyNumber: '' }])}
        >
          <Feather name="plus" size={15} color={colors.navyBlue} />
          <AppText variant="small" color={colors.navyBlue} style={{ marginLeft: 4 }}>Add Another Insurer</AppText>
        </Pressable>

        <Divider type="section" />

        {/* NHIMA */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>NHIMA (NATIONAL HEALTH INSURANCE)</AppText>
        <Input label="NHIMA Member Number" placeholder="e.g. NHIMA-12345" value={nhimaMemberNo} onChangeText={setNhimaMemberNo} icon="shield" />
        <AppText variant="bodyBold" style={styles.fieldLabel}>Scheme Type</AppText>
        <View style={styles.genderRow}>
          {['Formal', 'Informal', 'Voluntary'].map(s => (
            <Pressable key={s} style={[styles.genderPill, nhimaScheme === s && styles.genderPillActive]} onPress={() => setNhimaScheme(s)}>
              <AppText variant="caption" color={nhimaScheme === s ? colors.white : colors.navyBlue}>{s}</AppText>
            </Pressable>
          ))}
        </View>
        <Input label="Employer" placeholder="Employer name (if formal scheme)" value={nhimaEmployer} onChangeText={setNhimaEmployer} />

        <Divider type="section" />

        {/* Emergency Contact */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>EMERGENCY CONTACT</AppText>
        <Input label="Name" placeholder="Contact name" value={ecName} onChangeText={setEcName} />
        <Input label="Phone" placeholder="+260..." value={ecPhone} onChangeText={setEcPhone} keyboardType="phone-pad" />
        <Input label="Relationship" placeholder="e.g. Spouse, Parent" value={ecRelationship} onChangeText={setEcRelationship} />

        <Divider type="section" />

        {/* Communication Preferences */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>COMMUNICATION PREFERENCES</AppText>
        <View style={styles.commRow}>
          <Pressable style={styles.checkboxRow} onPress={() => setPrefSms(!prefSms)}>
            <View style={[styles.checkbox, prefSms && styles.checkboxActive]}>
              {prefSms && <Feather name="check" size={14} color={colors.white} />}
            </View>
            <AppText variant="body" style={{ marginLeft: spacing.sm }}>SMS</AppText>
          </Pressable>
          <Pressable style={styles.checkboxRow} onPress={() => setPrefEmail(!prefEmail)}>
            <View style={[styles.checkbox, prefEmail && styles.checkboxActive]}>
              {prefEmail && <Feather name="check" size={14} color={colors.white} />}
            </View>
            <AppText variant="body" style={{ marginLeft: spacing.sm }}>Email</AppText>
          </Pressable>
          <Pressable style={styles.checkboxRow} onPress={() => setPrefPhone(!prefPhone)}>
            <View style={[styles.checkbox, prefPhone && styles.checkboxActive]}>
              {prefPhone && <Feather name="check" size={14} color={colors.white} />}
            </View>
            <AppText variant="body" style={{ marginLeft: spacing.sm }}>Phone</AppText>
          </Pressable>
        </View>

        {!isEdit && (
          <>
            <Divider type="section" />
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>PATIENT CONSENT</AppText>
            <Pressable style={styles.checkboxRow} onPress={() => setConsentPrivacy(!consentPrivacy)}>
              <View style={[styles.checkbox, consentPrivacy && styles.checkboxActive]}>
                {consentPrivacy && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Patient accepts Privacy Policy *</AppText>
            </Pressable>
            <Pressable style={[styles.checkboxRow, { marginTop: spacing.sm }]} onPress={() => setConsentData(!consentData)}>
              <View style={[styles.checkbox, consentData && styles.checkboxActive]}>
                {consentData && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>Patient consents to health data access *</AppText>
            </Pressable>
          </>
        )}

        <View style={{ height: spacing.xxl }} />
        <Button label={isEdit ? 'Update Patient' : 'Register Patient'} onPress={handleSave} />
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
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.lightGrey,
    borderStyle: 'dashed',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: '38%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionLabel: {
    letterSpacing: 1,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  genderPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  genderPillActive: {
    backgroundColor: colors.navyBlue,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  commRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: spacing.base,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  otherInsurerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  removeInsurerBtn: {
    marginTop: 12,
    padding: 8,
  },
  addInsurerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B4B8A',
    borderStyle: 'dashed',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
});
