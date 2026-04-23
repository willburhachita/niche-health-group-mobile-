import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { mockUsers, CURRENT_USER_ID } from '../../data/mockUsers';

const EVENT_TYPES = ['Shift', 'Training', 'Meeting', 'Other'];

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Meeting');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const staff = mockUsers.filter(u => u.id !== CURRENT_USER_ID);

  const toggleAttendee = (id) => {
    setSelectedAttendees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
        <AppText variant="h3">New Event</AppText>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Create</AppText>
        </Pressable>
      </View>

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

        <Input label="Date" value="Tap to select" editable={false} icon="calendar" />
        <Input label="Start Time" value="09:00" editable={false} icon="clock" />
        <Input label="End Time" value="10:00" editable={false} icon="clock" />
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Add location" icon="map-pin" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Add description..." multiline icon="align-left" />

        <AppText variant="caption" color={colors.darkGrey} style={styles.label}>Attendees</AppText>
        <View style={styles.attendeesList}>
          {staff.map(u => {
            const selected = selectedAttendees.includes(u.id);
            return (
              <Pressable key={u.id} onPress={() => toggleAttendee(u.id)} style={styles.attendeeRow}>
                <Avatar name={u.displayName} size={32} />
                <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{u.displayName}</AppText>
                <View style={[styles.checkbox, selected && styles.checkboxActive]}>
                  {selected && <Feather name="check" size={14} color={colors.white} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  label: { marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.base },
  typePill: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: radius.full, backgroundColor: colors.offWhite },
  typePillActive: { backgroundColor: colors.navyBlue },
  attendeesList: { marginTop: spacing.sm },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lightGrey, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.navyBlue, borderColor: colors.navyBlue },
});
