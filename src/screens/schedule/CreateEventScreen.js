import React, { useState, useMemo } from 'react';
import { View, ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { CalendarDatePicker } from '../../components/common/CalendarDatePicker';

const EVENT_TYPES = ['Shift', 'Training', 'Meeting', 'Other'];
const RECURRING_PATTERNS = ['daily', 'weekly', 'biweekly', 'monthly'];

export default function CreateEventScreen({ route, navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const createEvent = useMutation(api.scheduleEvents.create);

  // Pre-populate date if navigated from calendar with a date selected
  const preselectedDate = route?.params?.preselectedDate || '';

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Shift');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(preselectedDate);
  const [startTimeStr, setStartTimeStr] = useState('07:00');
  const [endTimeStr, setEndTimeStr] = useState('15:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('weekly');
  const [recurringEndDateStr, setRecurringEndDateStr] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStaffPicker, setShowStaffPicker] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');

  // Load all staff accounts for attendee picker
  const allStaff = useQuery(api.auth.getAllStaffAccounts) ?? [];
  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return allStaff.filter(s => s.isActive);
    const q = staffSearch.toLowerCase();
    return allStaff.filter(s =>
      s.isActive && (
        (s.displayName || '').toLowerCase().includes(q) ||
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      )
    );
  }, [staffSearch, allStaff]);

  const toggleAttendee = (staffMember) => {
    setSelectedAttendees(prev => {
      const exists = prev.find(a => a.userId === staffMember.userId);
      if (exists) return prev.filter(a => a.userId !== staffMember.userId);
      return [...prev, staffMember];
    });
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Event title is required.' });
      return;
    }
    try {
      const [year, month, day] = (date || '').split('-');
      const d = year && month && day ? new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) : new Date();
      const [sh, sm] = startTimeStr.split(':');
      const [eh, em] = endTimeStr.split(':');
      const start = new Date(d); start.setHours(parseInt(sh) || 7, parseInt(sm) || 0, 0, 0);
      const end = new Date(d); end.setHours(parseInt(eh) || 15, parseInt(em) || 0, 0, 0);

      let recurringEndDate;
      if (isRecurring && recurringEndDateStr) {
        const [ry, rm, rd] = recurringEndDateStr.split('-');
        if (ry && rm && rd) recurringEndDate = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd)).getTime();
      }

      const attendees = selectedAttendees.map(a => a.userId);

      await createEvent({
        title: title.trim(),
        type: type.toLowerCase(),
        description: description || undefined,
        location: location || undefined,
        startTime: start.getTime(),
        endTime: end.getTime(),
        isAllDay,
        organizer: currentAccount?.userId || 'unknown',
        attendees,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : undefined,
        recurringEndDate: isRecurring ? recurringEndDate : undefined,
        createdBy: currentAccount?.userId || 'unknown',
      });

      alert({
        type: 'success',
        title: 'Event Created',
        message: isRecurring
          ? `Recurring ${recurringPattern} event scheduled for ${selectedAttendees.length > 0 ? selectedAttendees.length + ' staff member(s).' : 'all staff.'}`
          : `"${title}" has been added to the schedule.`,
        buttons: [{ label: 'OK', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message || 'Failed to create event.' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
        <AppText variant="h3">New Schedule Event</AppText>
        <Pressable onPress={handleCreate}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Create</AppText>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Event Type */}
        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Event Type</AppText>
        <View style={styles.typeRow}>
          {EVENT_TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.typePill, type === t && styles.typePillActive]}>
              <AppText variant="caption" color={type === t ? colors.white : colors.darkGrey}>{t}</AppText>
            </Pressable>
          ))}
        </View>

        <Input label="Title" value={title} onChangeText={setTitle} placeholder={`e.g. ${type} - Morning`} icon="type" />

        {/* Date */}
        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Date</AppText>
        <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={date ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
            {date || 'Select date'}
          </AppText>
          <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
        </Pressable>
        <CalendarDatePicker
          visible={showDatePicker}
          selectedDate={date}
          onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />

        {/* Times */}
        {!isAllDay && (
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Input label="Start Time" value={startTimeStr} onChangeText={setStartTimeStr} placeholder="07:00" icon="clock" />
            </View>
            <AppText variant="body" style={styles.timeSeparator}>→</AppText>
            <View style={{ flex: 1 }}>
              <Input label="End Time" value={endTimeStr} onChangeText={setEndTimeStr} placeholder="15:00" icon="clock" />
            </View>
          </View>
        )}

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">All Day</AppText>
          </View>
          <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
        </View>

        {/* Staff Attendees */}
        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Assign Staff</AppText>
        <Pressable style={styles.staffPickerBtn} onPress={() => setShowStaffPicker(true)}>
          <Feather name="users" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={selectedAttendees.length > 0 ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
            {selectedAttendees.length > 0
              ? selectedAttendees.map(a => a.displayName || a.fullName || a.email).join(', ')
              : 'Select staff members'}
          </AppText>
          <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
        </Pressable>

        {/* Recurring */}
        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Recurring Event</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Repeat for multiple weeks</AppText>
          </View>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
        </View>

        {isRecurring && (
          <>
            <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Repeat</AppText>
            <View style={styles.typeRow}>
              {RECURRING_PATTERNS.map(p => (
                <Pressable key={p} onPress={() => setRecurringPattern(p)} style={[styles.typePill, recurringPattern === p && styles.typePillActive]}>
                  <AppText variant="caption" color={recurringPattern === p ? colors.white : colors.darkGrey}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Repeat Until</AppText>
            <Pressable style={styles.dateBtn} onPress={() => setShowEndDatePicker(true)}>
              <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
              <AppText variant="body" color={recurringEndDateStr ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
                {recurringEndDateStr || 'Select end date'}
              </AppText>
              <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
            </Pressable>
            <CalendarDatePicker
              visible={showEndDatePicker}
              selectedDate={recurringEndDateStr}
              onSelect={(d) => { setRecurringEndDateStr(d); setShowEndDatePicker(false); }}
              onClose={() => setShowEndDatePicker(false)}
            />
          </>
        )}

        <Input label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Ward 3, ICU" icon="map-pin" />
        <Input label="Notes" value={description} onChangeText={setDescription} placeholder="Any additional details..." multiline icon="align-left" />

        <View style={{ height: spacing.xxl }} />
        <Button label={isRecurring ? 'Create Recurring Event' : 'Create Event'} onPress={handleCreate} />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Staff Picker Modal */}
      <Modal visible={showStaffPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <AppText variant="h2">Assign Staff</AppText>
            <Pressable onPress={() => { setShowStaffPicker(false); setStaffSearch(''); }} hitSlop={12}>
              <Feather name="x" size={24} color={colors.black} />
            </Pressable>
          </View>
          <View style={styles.searchWrap}>
            <Feather name="search" size={16} color={colors.mediumGrey} />
            <Input
              value={staffSearch}
              onChangeText={setStaffSearch}
              placeholder="Search staff..."
              style={{ flex: 1, marginBottom: 0, marginLeft: spacing.sm }}
            />
          </View>
          <FlatList
            data={filteredStaff}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = selectedAttendees.some(a => a.userId === item.userId);
              const name = item.displayName || item.fullName || item.email;
              return (
                <Pressable
                  style={[styles.staffRow, isSelected && styles.staffRowSelected]}
                  onPress={() => toggleAttendee(item)}
                >
                  <Avatar name={name} size={40} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <AppText variant="bodyBold">{name}</AppText>
                    <AppText variant="caption" color={colors.mediumGrey}>
                      {(item.role || 'member').charAt(0).toUpperCase() + (item.role || 'member').slice(1)}
                    </AppText>
                  </View>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Feather name="check" size={14} color={colors.white} />}
                  </View>
                </Pressable>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.offWhite }} />}
            ListEmptyComponent={
              <AppText variant="body" color={colors.mediumGrey} style={{ textAlign: 'center', marginTop: spacing.xxl }}>
                No staff found
              </AppText>
            }
          />
          <View style={styles.modalFooter}>
            <Button
              label={selectedAttendees.length > 0 ? `Confirm ${selectedAttendees.length} Staff` : 'Confirm (All Staff)'}
              onPress={() => { setShowStaffPicker(false); setStaffSearch(''); }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  label: { marginBottom: spacing.sm, marginTop: spacing.xs },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  typePill: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  typePillActive: { backgroundColor: colors.navyBlue },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  timeSeparator: { marginTop: spacing.base, color: colors.mediumGrey },
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
  staffPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
  },
  // Staff picker modal
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.base, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  searchWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite },
  staffRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  staffRowSelected: { backgroundColor: colors.navyLight },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.lightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  modalFooter: { padding: spacing.xl, borderTopWidth: 1, borderTopColor: colors.lightGrey },
});
