import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Divider } from '../../components/common/Divider';
import { mockSchedule } from '../../data/mockSchedule';
import { getUserById } from '../../data/mockUsers';
import { formatTime, formatDate } from '../../utils/dateHelpers';

export default function EventDetailScreen({ navigation, route }) {
  const { eventId } = route.params || {};
  const event = mockSchedule.find(e => e.id === eventId) || mockSchedule[0];
  const organizer = getUserById(event.organizer);

  const typeColors = {
    shift: colors.navyBlue,
    training: colors.peach,
    meeting: colors.success,
    other: colors.mediumGrey,
  };

  const info = [
    { icon: 'clock', label: 'Time', value: event.isAllDay ? 'All Day' : `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` },
    { icon: 'calendar', label: 'Date', value: formatDate(event.startTime) },
    { icon: 'map-pin', label: 'Location', value: event.location || 'No location set' },
    { icon: 'user', label: 'Organiser', value: organizer?.displayName || 'Admin' },
  ];

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
          <AppText variant="caption" color={colors.mediumGrey} style={styles.label}>ATTENDEES ({event.attendees.length})</AppText>
          {event.attendees.map(aId => {
            const user = getUserById(aId);
            const acknowledged = event.acknowledgedBy.includes(aId);
            return user ? (
              <View key={aId} style={styles.attendeeRow}>
                <Avatar name={user.displayName} size={36} showOnline onlineStatus={user.onlineStatus} />
                <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{user.displayName}</AppText>
                {acknowledged && (
                  <Badge label="Acknowledged" variant="success" />
                )}
              </View>
            ) : null;
          })}
        </View>

        <Button label="Acknowledge Event" icon="check" onPress={() => {}} style={styles.ackBtn} />
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
