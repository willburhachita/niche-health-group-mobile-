import React, { useState } from 'react';
import { View, ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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
  const [allergies, setAllergies] = useState(existing?.allergies?.join(', ') || '');
  const [conditions, setConditions] = useState(existing?.conditions?.join(', ') || '');
  const [bloodType, setBloodType] = useState(existing?.bloodType || '');
  const [insuranceProvider, setInsuranceProvider] = useState(existing?.insuranceProvider || '');
  const [policyNumber, setPolicyNumber] = useState(existing?.policyNumber || '');
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
      if (isEdit) {
        await updatePatient({
          id: patientId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dob,
          gender,
          phone,
          email: email || undefined,
          allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          conditions: conditions ? conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          bloodType: bloodType || undefined,
          insuranceProvider: insuranceProvider || undefined,
          policyNumber: policyNumber || undefined,
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
          allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
          conditions: conditions ? conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
          medications: [],
          bloodType: bloodType || undefined,
          insuranceProvider: insuranceProvider || undefined,
          policyNumber: policyNumber || undefined,
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
            <Feather name="user" size={32} color={colors.mediumGrey} />
          </View>
          <Pressable style={styles.cameraBtn}>
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

        <Input label="Phone" placeholder="+260..." value={phone} onChangeText={setPhone} icon="phone" keyboardType="phone-pad" />
        <Input label="Email" placeholder="email@example.com" value={email} onChangeText={setEmail} icon="mail" keyboardType="email-address" />

        <Divider type="section" />

        {/* Medical */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>MEDICAL</AppText>
        <Input label="Allergies" placeholder="Comma-separated (e.g. Penicillin, Ibuprofen)" value={allergies} onChangeText={setAllergies} />
        <Input label="Conditions" placeholder="Comma-separated" value={conditions} onChangeText={setConditions} />
        <Input label="Blood Type" placeholder="e.g. O+" value={bloodType} onChangeText={setBloodType} />

        <Divider type="section" />

        {/* Insurance */}
        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>INSURANCE</AppText>
        <Input label="Provider" placeholder="e.g. NHIMA" value={insuranceProvider} onChangeText={setInsuranceProvider} />
        <Input label="Policy Number" placeholder="e.g. NHI-12345" value={policyNumber} onChangeText={setPolicyNumber} />

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
});
