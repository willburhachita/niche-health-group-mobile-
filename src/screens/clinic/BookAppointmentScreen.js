import React, { useState } from 'react';
import { View, ScrollView, Pressable, Switch, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { APPOINTMENT_TYPES } from '../../data/mockAppointments';
import { mockPatients, searchPatients } from '../../data/mockPatients';
import { mockUsers } from '../../data/mockUsers';
import { hasValidConsent } from '../../data/mockPatientExtras';
import { Badge } from '../../components/common/Badge';

const doctors = mockUsers.filter(u => u.staffRole === 'doctor' || u.staffRole === 'admin');

export default function BookAppointmentScreen({ navigation }) {
  const alert = useAlert();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentPhone, setConsentPhone] = useState(false);

  const filteredPatients = patientSearch.length > 0
    ? searchPatients(patientSearch)
    : mockPatients.filter(p => p.status === 'active');

  const patientHasConsent = selectedPatient ? hasValidConsent(selectedPatient.id) : false;

  const handleSave = () => {
    if (!selectedPatient) {
      alert({ type: 'warning', title: 'Required', message: 'Please select a patient.' });
      return;
    }
    if (!patientHasConsent) {
      setShowConsentModal(true);
      return;
    }
    alert({ type: 'success', title: 'Appointment Booked', message: `Appointment for ${selectedPatient.displayName} has been booked.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
  };

  const handleConsentAccept = () => {
    if (!consentPrivacy || !consentData) {
      alert({ type: 'warning', title: 'Required', message: 'Privacy policy and data access consent are required.' });
      return;
    }
    setShowConsentModal(false);
    alert({ type: 'success', title: 'Consent Recorded & Booked', message: `Appointment for ${selectedPatient.displayName} has been booked.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="x" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Book Appointment</AppText>
        <Pressable onPress={handleSave} hitSlop={8}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Save</AppText>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Patient Selection */}
        <AppText variant="bodyBold" style={styles.label}>Patient</AppText>
        {selectedPatient ? (
          <View>
            <Pressable style={styles.selectedPatient} onPress={() => { setSelectedPatient(null); setShowPatientList(true); }}>
              <Avatar name={selectedPatient.displayName} size={36} />
              <View style={styles.selectedInfo}>
                <AppText variant="bodyBold">{selectedPatient.displayName}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{selectedPatient.patientId}</AppText>
              </View>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
            {!patientHasConsent && (
              <View style={styles.consentWarning}>
                <Feather name="alert-circle" size={14} color={colors.warning} />
                <AppText variant="small" color={colors.warning} style={{ marginLeft: 4, flex: 1 }}>Consent not on file. Will be requested on save.</AppText>
              </View>
            )}
          </View>
        ) : (
          <>
            <SearchBar
              placeholder="Search patient by name or ID..."
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

        {/* Appointment Type */}
        <AppText variant="bodyBold" style={styles.label}>Appointment Type</AppText>
        <View style={styles.typePills}>
          {APPOINTMENT_TYPES.filter(t => t !== 'Other').map(type => (
            <Pressable
              key={type}
              style={[styles.typePill, selectedType === type && styles.typePillActive]}
              onPress={() => setSelectedType(type)}
            >
              <AppText variant="caption" color={selectedType === type ? colors.white : colors.navyBlue}>
                {type}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Divider type="section" />

        {/* Date & Time */}
        <AppText variant="bodyBold" style={styles.label}>Date & Time</AppText>
        <Input
          placeholder="e.g. 25/03/2026"
          value={date}
          onChangeText={setDate}
          icon="calendar"
        />
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Input placeholder="Start (e.g. 09:00)" value={startTime} onChangeText={setStartTime} icon="clock" />
          </View>
          <AppText variant="body" color={colors.mediumGrey} style={styles.timeSep}>to</AppText>
          <View style={{ flex: 1 }}>
            <Input placeholder="End (e.g. 10:00)" value={endTime} onChangeText={setEndTime} icon="clock" />
          </View>
        </View>

        <Divider type="section" />

        {/* Provider */}
        <AppText variant="bodyBold" style={styles.label}>Provider</AppText>
        <View style={styles.providerList}>
          {doctors.map(doc => (
            <Pressable
              key={doc.id}
              style={[styles.providerChip, selectedProvider === doc.id && styles.providerChipActive]}
              onPress={() => setSelectedProvider(doc.id)}
            >
              <Avatar name={doc.displayName} size={24} />
              <AppText
                variant="caption"
                color={selectedProvider === doc.id ? colors.white : colors.darkGrey}
                style={{ marginLeft: spacing.xs }}
              >
                {doc.displayName}
              </AppText>
            </Pressable>
          ))}
        </View>

        <Divider type="section" />

        {/* Location & Notes */}
        <Input label="Location" placeholder="e.g. Consultation Room 1" value={location} onChangeText={setLocation} icon="map-pin" />
        <Input label="Notes" placeholder="Any additional notes..." value={notes} onChangeText={setNotes} multiline />

        <Divider type="section" />

        {/* Toggles */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Send SMS Reminder</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Patient will receive a reminder</AppText>
          </View>
          <Switch
            value={sendReminder}
            onValueChange={setSendReminder}
            trackColor={{ true: colors.navyBlue, false: colors.lightGrey }}
            thumbColor={colors.white}
          />
        </View>
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Recurring Appointment</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Repeat on a schedule</AppText>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ true: colors.navyBlue, false: colors.lightGrey }}
            thumbColor={colors.white}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
        <Button label="Book Appointment" onPress={handleSave} />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* Consent Modal */}
      <Modal visible={showConsentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText variant="h2">Patient Consent</AppText>
              <Pressable onPress={() => setShowConsentModal(false)} hitSlop={8}>
                <Feather name="x" size={24} color={colors.black} />
              </Pressable>
            </View>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.md }}>
              {selectedPatient?.displayName} must accept the following before booking.
            </AppText>

            <Pressable style={styles.consentRow} onPress={() => setConsentPrivacy(!consentPrivacy)}>
              <View style={[styles.checkbox, consentPrivacy && styles.checkboxActive]}>
                {consentPrivacy && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>I have read and accept the Privacy Policy *</AppText>
            </Pressable>

            <Pressable style={styles.consentRow} onPress={() => setConsentData(!consentData)}>
              <View style={[styles.checkbox, consentData && styles.checkboxActive]}>
                {consentData && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.sm }}>I consent to my health data being accessed *</AppText>
            </Pressable>

            <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.md, marginBottom: spacing.sm, letterSpacing: 1 }}>COMMUNICATION PREFERENCES</AppText>

            <Pressable style={styles.consentRow} onPress={() => setConsentSms(!consentSms)}>
              <View style={[styles.checkbox, consentSms && styles.checkboxActive]}>
                {consentSms && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ marginLeft: spacing.sm }}>SMS</AppText>
            </Pressable>
            <Pressable style={styles.consentRow} onPress={() => setConsentEmail(!consentEmail)}>
              <View style={[styles.checkbox, consentEmail && styles.checkboxActive]}>
                {consentEmail && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ marginLeft: spacing.sm }}>Email</AppText>
            </Pressable>
            <Pressable style={styles.consentRow} onPress={() => setConsentPhone(!consentPhone)}>
              <View style={[styles.checkbox, consentPhone && styles.checkboxActive]}>
                {consentPhone && <Feather name="check" size={14} color={colors.white} />}
              </View>
              <AppText variant="body" style={{ marginLeft: spacing.sm }}>Phone Calls</AppText>
            </Pressable>

            <View style={{ marginTop: spacing.xl }}>
              <Button label="Accept & Book" onPress={handleConsentAccept} />
            </View>
          </View>
        </View>
      </Modal>
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
  typePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  typePillActive: {
    backgroundColor: colors.navyBlue,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeSep: { paddingTop: spacing.sm },
  providerList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  providerChipActive: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  consentWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginTop: spacing.xs,
    backgroundColor: colors.warning + '14',
    borderRadius: radius.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
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
});
