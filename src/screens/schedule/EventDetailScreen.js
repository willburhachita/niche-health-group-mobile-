import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { formatTime, formatDate } from '../../utils/dateHelpers';

export default function EventDetailScreen({ navigation, route }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const { eventId } = route.params || {};
  const event = useQuery(api.scheduleEvents.get, eventId ? { id: eventId } : 'skip');
  const acknowledgeMutation = useMutation(api.scheduleEvents.acknowledge);
  const removeMutation = useMutation(api.scheduleEvents.remove);

  const typeColors = {
    shift: colors.navyBlue,
    training: colors.peach,
    meeting: colors.success,
    other: colors.mediumGrey,
  };

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
          <AppText variant="h3">Event</AppText>
          <View style={{ width: 24 }} />
        </View>
        <AppText variant="body" color={colors.mediumGrey} style={{ padding: spacing.xl }}>Loading...</AppText>
      </SafeAreaView>
    );
  }

  const info = [
    { icon: 'clock', label: 'Time', value: event.isAllDay ? 'All Day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` },
    { icon: 'calendar', label: 'Date', value: formatDate(event.startTime) },
    { icon: 'map-pin', label: 'Location', value: event.location || 'No location set' },
    { icon: 'user', label: 'Organiser', value: event.organizer || 'Admin' },
  ];

  const isAcknowledged = event.acknowledgedBy?.includes(currentAccount?.userId);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeMutation({ id: eventId, userId: currentAccount?.userId || '' });
    } catch (e) {
      alert({ type: 'warning', title: 'Error', message: e.message });
    }
  };

  const handleDelete = () => {
    alert({
      type: 'warning',
      title: 'Delete Event',
      message: 'Are you sure you want to delete this event?',
      buttons: [
        { label: 'No', style: 'cancel' },
        { label: 'Delete', style: 'destructive', onPress: async () => {
          await removeMutation({ id: eventId });
          navigation.goBack();
        }},
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Event</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topSection}>
          <View style={[styles.typePill, { backgroundColor: typeColors[event.type] + '20' }]}>
            <View style={[styles.typeDot, { backgroundColor: typeColors[event.type] }]} />
            <AppText variant="caption" color={typeColors[event.type]}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </AppText>
          </View>
          <AppText variant="h1" style={styles.title}>{event.title}</AppText>
        </View>

        {info.map((item, i) => (
          <View key={item.label}>
            <View style={styles.infoRow}>
              <Feather name={item.icon} size={18} color={colors.mediumGrey} style={{ marginRight: spacing.md, width: 24 }} />
              <View>
                <AppText variant="caption" color={colors.mediumGrey}>{item.label}</AppText>
                <AppText variant="body">{item.value}</AppText>
              </View>
            </View>
            <Divider type="inset" />
          </View>
        ))}

        {event.description && (
          <View style={styles.descBox}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>DESCRIPTION</AppText>
            <AppText variant="body" color={colors.darkGrey}>{event.description}</AppText>
          </View>
        )}

        <View style={styles.attendeesSection}>
          <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>ATTENDEES ({event.attendees?.length ?? 0})</AppText>
          {(event.attendees ?? []).map(aId => {
            const acknowledged = (event.acknowledgedBy ?? []).includes(aId);
            return (
              <View key={aId} style={styles.attendeeRow}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="user" size={16} color={colors.navyBlue} />
                </View>
                <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{aId}</AppText>
                {acknowledged && (
                  <Badge label="Acknowledged" variant="success" />
                )}
              </View>
            );
          })}
        </View>

        {event.isRecurring && (
          <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
            <Badge label={`Recurring: ${event.recurringPattern}`} variant="role" />
          </View>
        )}

        <Button label={isAcknowledged ? 'Acknowledged' : 'Acknowledge Event'} icon="check" onPress={handleAcknowledge} disabled={isAcknowledged} style={styles.ackBtn} />
        <Button label="Delete Event" variant="destructive" onPress={handleDelete} style={{ marginTop: spacing.sm, marginHorizontal: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  topSection: { marginBottom: spacing.xl },
  typePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: 20, marginBottom: spacing.md },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  title: { marginTop: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  label: { letterSpacing: 1, marginBottom: spacing.sm },
  descBox: { marginTop: spacing.xl },
  attendeesSection: { marginTop: spacing.xl },
  attendeeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  ackBtn: { marginTop: spacing.xxl },
});
