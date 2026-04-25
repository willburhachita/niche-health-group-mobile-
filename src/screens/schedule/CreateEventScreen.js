import React, { useState } from 'react';
import { View, ScrollView, Pressable, Switch, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CalendarDatePicker } from '../../components/common/CalendarDatePicker';

const EVENT_TYPES = ['Shift', 'Training', 'Meeting', 'Other'];
const RECURRING_PATTERNS = ['daily', 'weekly', 'biweekly', 'monthly'];

export default function CreateEventScreen({ navigation }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const createEvent = useMutation(api.scheduleEvents.create);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Meeting');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState('weekly');
  const [recurringEndDateStr, setRecurringEndDateStr] = useState('');
  const [attendeesStr, setAttendeesStr] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      alert({ type: 'warning', title: 'Required', message: 'Title is required.' });
      return;
    }
    try {
      const [year, month, day] = (date || '').split('-');
      const d = year && month && day ? new Date(parseInt(year), parseInt(month) - 1, parseInt(day)) : new Date();
      const [sh, sm] = startTimeStr.split(':');
      const [eh, em] = endTimeStr.split(':');
      const start = new Date(d); start.setHours(parseInt(sh) || 9, parseInt(sm) || 0, 0, 0);
      const end = new Date(d); end.setHours(parseInt(eh) || 10, parseInt(em) || 0, 0, 0);

      let recurringEndDate;
      if (isRecurring && recurringEndDateStr) {
        const [ry, rm, rd] = recurringEndDateStr.split('-');
        if (ry && rm && rd) recurringEndDate = new Date(parseInt(ry), parseInt(rm) - 1, parseInt(rd)).getTime();
      }

      const attendees = attendeesStr ? attendeesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

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
      alert({ type: 'success', title: 'Event Created', message: isRecurring ? `Recurring ${recurringPattern} event created.` : 'Event has been scheduled.', buttons: [{ label: 'OK', onPress: () => navigation.goBack() }] });
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
        <AppText variant="h3">New Event</AppText>
        <Pressable onPress={handleCreate}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Create</AppText>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" icon="type" />

        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Type</AppText>
        <View style={styles.typeRow}>
          {EVENT_TYPES.map(t => (
            <Pressable key={t} onPress={() => setType(t)} style={[styles.typePill, type === t && styles.typePillActive]}>
              <AppText variant="caption" color={type === t ? colors.white : colors.darkGrey}>{t}</AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Date</AppText>
        <Pressable style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
          <Feather name="calendar" size={18} color={colors.navyBlue} style={{ marginRight: spacing.sm }} />
          <AppText variant="body" color={date ? colors.black : colors.mediumGrey} style={{ flex: 1 }}>
            {date || 'Select event date'}
          </AppText>
          <Feather name="chevron-down" size={16} color={colors.mediumGrey} />
        </Pressable>
        <CalendarDatePicker
          visible={showDatePicker}
          selectedDate={date}
          onSelect={(d) => { setDate(d); setShowDatePicker(false); }}
          onClose={() => setShowDatePicker(false)}
        />
        <Input label="Start Time" value={startTimeStr} onChangeText={setStartTimeStr} placeholder="09:00" icon="clock" />
        <Input label="End Time" value={endTimeStr} onChangeText={setEndTimeStr} placeholder="10:00" icon="clock" />

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">All Day Event</AppText>
          </View>
          <Switch value={isAllDay} onValueChange={setIsAllDay} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
        </View>

        <View style={styles.toggleRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="body">Recurring Event</AppText>
            <AppText variant="small" color={colors.mediumGrey}>Schedule repeating events for staff</AppText>
          </View>
          <Switch value={isRecurring} onValueChange={setIsRecurring} trackColor={{ true: colors.navyBlue, false: colors.lightGrey }} thumbColor={colors.white} />
        </View>

        {isRecurring && (
          <>
            <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Repeat Pattern</AppText>
            <View style={styles.typeRow}>
              {RECURRING_PATTERNS.map(p => (
                <Pressable key={p} onPress={() => setRecurringPattern(p)} style={[styles.typePill, recurringPattern === p && styles.typePillActive]}>
                  <AppText variant="caption" color={recurringPattern === p ? colors.white : colors.darkGrey}>{p.charAt(0).toUpperCase() + p.slice(1)}</AppText>
                </Pressable>
              ))}
            </View>
            <AppText variant="caption" color={colors.darkGrey} style={styles.label}>End Date</AppText>
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

        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Add location" icon="map-pin" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Add description..." multiline icon="align-left" />
        <Input label="Attendees (comma-separated user IDs)" value={attendeesStr} onChangeText={setAttendeesStr} placeholder="user1, user2" icon="users" />

        <View style={{ height: spacing.xxl }} />
        <Button label={isRecurring ? 'Create Recurring Event' : 'Create Event'} onPress={handleCreate} />
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  label: { marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  typePill: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  typePillActive: { backgroundColor: colors.navyBlue },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
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
