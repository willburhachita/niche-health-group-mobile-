import React, { useState, useMemo } from 'react';
import { View, ScrollView, FlatList, Pressable, Switch, Modal, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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
import { Avatar } from '../../components/common/Avatar';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { Badge } from '../../components/common/Badge';

const APPOINTMENT_TYPES = ['Consultation', 'Follow-up', 'Dialysis', 'Lab Work', 'Telehealth', 'Emergency'];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function TimePicker({ visible, value, onSelect, onClose }) {
  const [h, m] = (value || '09:00').split(':');
  const [selHour, setSelHour] = useState(h || '09');
  const [selMin, setSelMin] = useState(() => {
    const min = parseInt(m) || 0;
    const rounded = Math.round(min / 5) * 5;
    return String(rounded >= 60 ? 55 : rounded).padStart(2, '0');
  });

  React.useEffect(() => {
    if (visible) {
      const [hh, mm] = (value || '09:00').split(':');
      setSelHour(hh || '09');
      const min = parseInt(mm) || 0;
      const rounded = Math.round(min / 5) * 5;
      setSelMin(String(rounded >= 60 ? 55 : rounded).padStart(2, '0'));
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={tpStyles.overlay} onPress={onClose}>
        <Pressable style={tpStyles.sheet} onPress={e => e.stopPropagation()}>
          <View style={tpStyles.header}>
            <AppText variant="h3">Select Time</AppText>
            <Pressable onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.black} />
            </Pressable>
          </View>

          <View style={tpStyles.display}>
            <AppText variant="h1" color={colors.navyBlue}>{selHour}:{selMin}</AppText>
          </View>

          <View style={tpStyles.columns}>
            <View style={tpStyles.col}>
              <AppText variant="caption" color={colors.mediumGrey} style={tpStyles.colLabel}>HOUR</AppText>
              <ScrollView style={tpStyles.scroll} showsVerticalScrollIndicator={false}>
                {HOURS.map(hr => (
                  <Pressable
                    key={hr}
                    style={[tpStyles.cell, selHour === hr && tpStyles.cellActive]}
                    onPress={() => setSelHour(hr)}
                  >
                    <AppText variant={selHour === hr ? 'bodyBold' : 'body'} color={selHour === hr ? colors.white : colors.black}>{hr}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={tpStyles.divider} />

            <View style={tpStyles.col}>
              <AppText variant="caption" color={colors.mediumGrey} style={tpStyles.colLabel}>MINUTE</AppText>
              <ScrollView style={tpStyles.scroll} showsVerticalScrollIndicator={false}>
                {MINUTES.map(mn => (
                  <Pressable
                    key={mn}
                    style={[tpStyles.cell, selMin === mn && tpStyles.cellActive]}
                    onPress={() => setSelMin(mn)}
                  >
                    <AppText variant={selMin === mn ? 'bodyBold' : 'body'} color={selMin === mn ? colors.white : colors.black}>{mn}</AppText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={tpStyles.footer}>
            <Pressable onPress={onClose}>
              <AppText variant="body" color={colors.mediumGrey}>Cancel</AppText>
            </Pressable>
            <Pressable onPress={() => onSelect(`${selHour}:${selMin}`)}>
              <AppText variant="bodyBold" color={colors.navyBlue}>Confirm</AppText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const tpStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  sheet: { width: '100%', maxWidth: 300, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  display: { alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.offWhite, marginBottom: spacing.sm },
  columns: { flexDirection: 'row', height: 200 },
  col: { flex: 1, alignItems: 'center' },
  colLabel: { letterSpacing: 1, marginBottom: spacing.xs },
  scroll: { flex: 1, width: '100%' },
  cell: { height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: radius.md, marginVertical: 1, marginHorizontal: spacing.sm },
  cellActive: { backgroundColor: colors.navyBlue, borderRadius: radius.md },
  divider: { width: 1, backgroundColor: colors.offWhite, marginHorizontal: spacing.sm },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.offWhite },
});

export default function BookAppointmentScreen({ route, navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const preselectedPatientId = route?.params?.patientId;

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showProviderList, setShowProviderList] = useState(false);
  const [showAttendeeList, setShowAttendeeList] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [sendReminder, setSendReminder] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState([]);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [showRecurDatePicker, setShowRecurDatePicker] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [consentSms, setConsentSms] = useState(false);
  const [consentEmail, setConsentEmail] = useState(false);
  const [consentPhone, setConsentPhone] = useState(false);

  const searchResults = useQuery(api.patients.search, { query: patientSearch });
  const allPatients = useQuery(api.patients.list, { status: 'active' });
  const preselectedPatient = useQuery(
    api.patients.get,
    preselectedPatientId && !selectedPatient ? { id: preselectedPatientId } : 'skip'
  );
  const allStaff = useQuery(api.auth.getAllStaffAccounts) ?? [];
  const activeStaff = useMemo(() => allStaff.filter(s => s.isActive), [allStaff]);
  const createAppointment = useMutation(api.appointments.create);

  // Auto-select patient when navigated from patient profile
  React.useEffect(() => {
    if (preselectedPatient && !selectedPatient) {
      setSelectedPatient(preselectedPatient);
    }
  }, [preselectedPatient]);

  const filteredPatients = useMemo(() =>
    patientSearch.length > 0 ? (searchResults ?? []) : (allPatients ?? []),
    [patientSearch, searchResults, allPatients]
  );

  const calculatedDates = useMemo(() => {
    if (!isRecurring || !date) return [];
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    if (isNaN(startDate.getTime())) return [];

    const dates = [];
    const daysSet = new Set(recurringDays);
    if (daysSet.size === 0) return [];

    let currentStart = new Date(startDate);
    
    // Find the first matching day of the week
    let found = false;
    for (let i = 0; i < 7; i++) {
      if (daysSet.has(currentStart.getDay())) {
        found = true;
        break;
      }
      currentStart.setDate(currentStart.getDate() + 1);
    }
    if (!found) return [];

    const limitOccurrences = 100;
    const maxCheckedDays = 365;
    let count = 0;
    let daysCheck = 0;
    
    let endLimitTime = null;
    if (recurringEndDate) {
      const [ey, em, ed] = recurringEndDate.split('-').map(Number);
      endLimitTime = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
    }
    
    if (endLimitTime && currentStart.getTime() > endLimitTime) {
      return [];
    }
    
    dates.push(new Date(currentStart));
    count++;

    while (count < limitOccurrences && daysCheck < maxCheckedDays) {
      currentStart.setDate(currentStart.getDate() + 1);
      daysCheck++;
      
      if (endLimitTime && currentStart.getTime() > endLimitTime) {
        break;
      }
      
      if (daysSet.has(currentStart.getDay())) {
        dates.push(new Date(currentStart));
        count++;
      }
    }
    return dates;
  }, [isRecurring, date, recurringDays, recurringEndDate]);

  const formatPreviewDate = (d) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const parseDateTime = () => {
    const [year, month, day] = (date || '').split('-');
    const [sh, sm] = (startTime || '09:00').split(':');
    const [eh, em] = (endTime || '10:00').split(':');
    const d = year && month && day ? new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) : new Date();
    const start = new Date(d); start.setHours(parseInt(sh) || 9, parseInt(sm) || 0, 0, 0);
    const end = new Date(d); end.setHours(parseInt(eh) || 10, parseInt(em) || 0, 0, 0);
    return { startMs: start.getTime(), endMs: end.getTime(), duration: Math.round((end - start) / 60000) };
  };

  const handleConsentAccept = () => {
    if (!consentPrivacy || !consentData) {
      alert({ type: 'warning', title: 'Consent Required', message: 'Please accept the privacy policy and data access consent to proceed.' });
      return;
    }
    setShowConsentModal(false);
    handleSave();
  };

  const handleSave = async () => {
    if (!selectedPatient) {
      alert({ type: 'warning', title: 'Required', message: 'Please select a patient.' });
      return;
    }
    try {
      const { startMs, endMs, duration } = parseDateTime();
      
      let parsedRecurEnd = undefined;
      if (isRecurring) {
        if (recurringEndDate) {
          const [ry, rm, rd] = recurringEndDate.split('-');
          parsedRecurEnd = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd), 23, 59, 59, 999).getTime();
        } else {
          parsedRecurEnd = startMs + 90 * 86400000;
        }
      }

      await createAppointment({
        patientId: selectedPatient._id,
        providerId: selectedProvider?.userId || currentAccount?.userId || '',
        type: selectedType || undefined,
        startTime: startMs,
        endTime: endMs,
        duration,
        location: location || undefined,
        status: 'pending',
        notes: notes || undefined,
        reasonForVisit: reasonForVisit || undefined,
        isRecurring,
        recurringPattern: isRecurring ? 'weekly' : undefined,
        recurringEndDate: parsedRecurEnd,
        recurringDays: isRecurring && recurringDays.length > 0 ? recurringDays : undefined,
        createdBy: currentAccount?.userId || 'unknown',
      });
      alert({ type: 'success', title: 'Appointment Booked', message: `Appointment for ${selectedPatient.displayName} has been booked.`, buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to book appointment.' });
    }
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                    key={p._id}
                    style={({ pressed }) => [styles.patientOption, pressed && styles.pressed]}
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

        {/* Appointment Type */}
        <AppText variant="bodyBold" style={styles.label}>Appointment Type</AppText>
        <View style={styles.typePills}>
          {APPOINTMENT_TYPES.map(type => (
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
        <AppText variant="bodyBold" style={styles.label}>Date</AppText>
        <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={date ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
            {date || 'Select appointment date'}
          </AppText>
          <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
        </Pressable>
        <CalendarDatePicker
          visible={showDatePicker}
          selectedDate={date}
          onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />
        <AppText variant="bodyBold" style={[styles.label, { marginTop: spacing.sm }]}>Time</AppText>
        <View style={styles.timeRow}>
          <Pressable style={[styles.dateBtn, { flex: 1, marginBottom: 0 }]} onPress={() => setShowStartTimePicker(true)}>
            <Feather name="clock" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
            <AppText variant="body" color={colors.black} style={{ flex: 1 }}>{startTime || '09:00'}</AppText>
            <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
          </Pressable>
          <AppText variant="body" color={colors.mediumGrey} style={styles.timeSep}>to</AppText>
          <Pressable style={[styles.dateBtn, { flex: 1, marginBottom: 0 }]} onPress={() => setShowEndTimePicker(true)}>
            <Feather name="clock" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
            <AppText variant="body" color={colors.black} style={{ flex: 1 }}>{endTime || '10:00'}</AppText>
            <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
          </Pressable>
        </View>
        <TimePicker visible={showStartTimePicker} value={startTime} onSelect={(t) => { setStartTime(t); setShowStartTimePicker(false); }} onClose={() => setShowStartTimePicker(false)} />
        <TimePicker visible={showEndTimePicker} value={endTime} onSelect={(t) => { setEndTime(t); setShowEndTimePicker(false); }} onClose={() => setShowEndTimePicker(false)} />

        <Divider type="section" />

        {/* Provider */}
        <AppText variant="bodyBold" style={styles.label}>Provider (Doctor/Nurse)</AppText>
        {selectedProvider ? (
          <Pressable style={styles.selectedPatient} onPress={() => { setSelectedProvider(null); setShowProviderList(true); }}>
            <Avatar name={selectedProvider.displayName || selectedProvider.fullName || selectedProvider.email} size={36} />
            <View style={styles.selectedInfo}>
              <AppText variant="bodyBold">{selectedProvider.displayName || selectedProvider.fullName || selectedProvider.email}</AppText>
              <AppText variant="caption" color={colors.darkGrey}>{selectedProvider.role} {selectedProvider.title ? `· ${selectedProvider.title}` : ''}</AppText>
            </View>
            <Pressable hitSlop={8} onPress={() => setSelectedProvider(null)}>
              <Feather name="x" size={16} color={colors.mediumGrey} />
            </Pressable>
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.dateBtn} onPress={() => setShowProviderList(!showProviderList)}>
              <Feather name="user" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
              <AppText variant="body" color={colors.mediumGrey} style={{ flex: 1 }}>Select provider</AppText>
              <Feather name={showProviderList ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mediumGrey} />
            </Pressable>
            {showProviderList && (
              <View style={styles.patientList}>
                {activeStaff.map(s => (
                  <Pressable
                    key={s._id}
                    style={({ pressed }) => [styles.patientOption, pressed && styles.pressed]}
                    onPress={() => { setSelectedProvider(s); setShowProviderList(false); }}
                  >
                    <Avatar name={s.displayName || s.fullName || s.email} size={32} />
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <AppText variant="body">{s.displayName || s.fullName || s.email}</AppText>
                      <AppText variant="small" color={colors.mediumGrey}>{s.role}{s.title ? ` · ${s.title}` : ''}</AppText>
                    </View>
                  </Pressable>
                ))}
                {activeStaff.length === 0 && (
                  <View style={{ padding: spacing.lg, alignItems: 'center' }}>
                    <AppText variant="body" color={colors.mediumGrey}>No staff found</AppText>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <Divider type="section" />

        {/* Attendees */}
        <AppText variant="bodyBold" style={styles.label}>Attendees (optional)</AppText>
        {selectedAttendees.length > 0 && (
          <View style={styles.attendeeChips}>
            {selectedAttendees.map(a => (
              <View key={a._id} style={styles.attendeeChip}>
                <AppText variant="caption" color={colors.navyBlue}>{a.displayName || a.fullName || a.email}</AppText>
                <Pressable hitSlop={6} onPress={() => setSelectedAttendees(prev => prev.filter(x => x._id !== a._id))} style={{ marginLeft: spacing.xs }}>
                  <Feather name="x" size={12} color={colors.navyBlue} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <Pressable style={styles.dateBtn} onPress={() => setShowAttendeeList(!showAttendeeList)}>
          <Feather name="users" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={colors.mediumGrey} style={{ flex: 1 }}>Add staff attendees</AppText>
          <Feather name={showAttendeeList ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mediumGrey} />
        </Pressable>
        {showAttendeeList && (
          <View style={styles.patientList}>
            {activeStaff
              .filter(s => !selectedAttendees.some(a => a._id === s._id) && s._id !== selectedProvider?._id)
              .map(s => (
                <Pressable
                  key={s._id}
                  style={({ pressed }) => [styles.patientOption, pressed && styles.pressed]}
                  onPress={() => { setSelectedAttendees(prev => [...prev, s]); setShowAttendeeList(false); }}
                >
                  <Avatar name={s.displayName || s.fullName || s.email} size={32} />
                  <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                    <AppText variant="body">{s.displayName || s.fullName || s.email}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>{s.role}{s.title ? ` · ${s.title}` : ''}</AppText>
                  </View>
                </Pressable>
              ))}
          </View>
        )}

        <Divider type="section" />

        {/* Location & Notes */}
        <Input label="Reason for Visit" placeholder="e.g. Hemodialysis, Consultation" value={reasonForVisit} onChangeText={setReasonForVisit} icon="activity" />
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
            onValueChange={(checked) => {
              setIsRecurring(checked);
              if (checked && recurringDays.length === 0 && date) {
                const [year, month, day] = date.split('-').map(Number);
                const parsedDate = new Date(year, month - 1, day);
                if (!isNaN(parsedDate.getTime())) {
                  setRecurringDays([parsedDate.getDay()]);
                }
              }
            }}
            trackColor={{ true: colors.navyBlue, false: colors.lightGrey }}
            thumbColor={colors.white}
          />
        </View>

        {isRecurring && (
          <View style={styles.recurrenceSection}>
            <AppText variant="bodyBold" style={[styles.label, { marginTop: 0 }]}>Repeat Weekly On</AppText>
            <View style={styles.daysRow}>
              {[
                { label: 'Sun', value: 0 },
                { label: 'Mon', value: 1 },
                { label: 'Tue', value: 2 },
                { label: 'Wed', value: 3 },
                { label: 'Thu', value: 4 },
                { label: 'Fri', value: 5 },
                { label: 'Sat', value: 6 }
              ].map(d => {
                const isSelected = recurringDays.includes(d.value);
                return (
                  <Pressable
                    key={d.value}
                    style={[styles.dayCircle, isSelected && styles.dayCircleActive]}
                    onPress={() => {
                      if (isSelected) {
                        setRecurringDays(prev => prev.filter(v => v !== d.value));
                      } else {
                        setRecurringDays(prev => [...prev, d.value]);
                      }
                    }}
                  >
                    <AppText variant="caption" color={isSelected ? colors.white : colors.navyBlue}>
                      {d.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            
            <AppText variant="bodyBold" style={[styles.label, { marginTop: spacing.sm }]}>Repeat Until</AppText>
            <Pressable style={[styles.dateBtn, { marginBottom: 0 }]} onPress={() => setShowRecurDatePicker(true)}>
              <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
              <AppText variant="body" color={recurringEndDate ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
                {recurringEndDate || 'Select end date'}
              </AppText>
              <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
            </Pressable>
            <CalendarDatePicker
              visible={showRecurDatePicker}
              selectedDate={recurringEndDate}
              onSelect={(d) => { setRecurringEndDate(d); setShowRecurDatePicker(false); }}
              onClose={() => setShowRecurDatePicker(false)}
            />

            {calculatedDates.length > 0 && (
              <View style={styles.previewContainer}>
                <AppText variant="caption" color={colors.mediumGrey} style={styles.previewTitle}>
                  CALCULATED APPOINTMENT DATES
                </AppText>
                <View style={styles.previewList}>
                  {calculatedDates.slice(0, 5).map((d, index) => (
                    <View key={index} style={styles.previewItem}>
                      <Feather name="calendar" size={12} color={colors.navyBlue} style={{ marginRight: spacing.xs }} />
                      <AppText variant="small" color={colors.darkGrey}>
                        {formatPreviewDate(d)}
                      </AppText>
                    </View>
                  ))}
                  {calculatedDates.length > 5 && (
                    <AppText variant="small" color={colors.mediumGrey} style={{ fontStyle: 'italic', marginTop: spacing.xs }}>
                      + {calculatedDates.length - 5} more appointments
                    </AppText>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
        <Button label="Book Appointment" onPress={handleSave} />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
      </KeyboardAvoidingView>

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
  attendeeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  attendeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  recurrenceSection: {
    padding: spacing.md,
    backgroundColor: colors.navyLight,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.navyBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: colors.navyBlue,
  },
  previewContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  previewTitle: {
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  previewList: {
    gap: spacing.xs,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
