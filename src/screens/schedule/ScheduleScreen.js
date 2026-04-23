import React, { useState } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { mockSchedule } from '../../data/mockSchedule';
import { formatTime, formatDateShort } from '../../utils/dateHelpers';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleScreen({ navigation }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  const getDatesForMonth = () => {
    const year = today.getFullYear();
    const month = today.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let d = 1; d <= daysInMonth; d++) dates.push(new Date(year, month, d));
    return dates;
  };

  const dates = getDatesForMonth();
  const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const getEventsForDay = (date) => {
    if (!date) return [];
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return mockSchedule.filter(e => e.startTime >= dayStart.getTime() && e.startTime <= dayEnd.getTime());
  };

  const selectedEvents = getEventsForDay(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h1">Schedule</AppText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="h2" style={styles.monthLabel}>{monthName}</AppText>

        <View style={styles.dayLabels}>
          {DAYS.map(d => <AppText key={d} variant="small" color={colors.mediumGrey} style={styles.dayLabel}>{d}</AppText>)}
        </View>

        <View style={styles.calGrid}>
          {dates.map((date, i) => {
            const isToday = date && date.toDateString() === today.toDateString();
            const isSelected = date && date.toDateString() === selectedDate?.toDateString();
            const hasEvents = getEventsForDay(date).length > 0;

            return (
              <Pressable
                key={i}
                style={[styles.calCell, isSelected && styles.calCellSelected]}
                onPress={() => date && setSelectedDate(date)}
              >
                {date ? (
                  <View style={styles.calCellContent}>
                    <View style={[styles.dateCircle, isToday && styles.todayCircle]}>
                      <AppText variant="body" color={isToday ? colors.white : colors.black}>{date.getDate()}</AppText>
                    </View>
                    {hasEvents && <View style={styles.eventDot} />}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.eventsSection}>
          <AppText variant="h3" style={styles.eventsTitle}>
            {selectedDate ? formatDateShort(selectedDate.getTime()) : 'Select a day'}
          </AppText>
          {selectedEvents.length === 0 ? (
            <AppText variant="body" color={colors.mediumGrey} style={{ paddingHorizontal: spacing.base }}>No events</AppText>
          ) : selectedEvents.map(e => (
            <Card key={e.id} onPress={() => navigation.navigate('EventDetail', { eventId: e.id })} style={{ marginHorizontal: spacing.base }}>
              <View style={styles.eventRow}>
                <View style={[styles.eventBar, { backgroundColor: e.type === 'training' ? colors.peach : e.type === 'meeting' ? colors.success : colors.navyBlue }]} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{e.title}</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>
                    {e.isAllDay ? 'All day' : `${formatTime(e.startTime)} - ${formatTime(e.endTime)}`}
                  </AppText>
                  {e.location && <AppText variant="caption" color={colors.mediumGrey}>{e.location}</AppText>}
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
  monthLabel: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  dayLabels: { flexDirection: 'row', paddingHorizontal: spacing.sm },
  dayLabel: { flex: 1, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: colors.navyLight, borderRadius: radius.md },
  calCellContent: { alignItems: 'center' },
  dateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: colors.navyBlue },
  eventDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.navyBlue, marginTop: 2 },
  eventsSection: { marginTop: spacing.xl, paddingBottom: TAB_BAR_HEIGHT + 16 },
  eventsTitle: { paddingHorizontal: spacing.base, marginBottom: spacing.md },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventBar: { width: 4, height: 44, borderRadius: 2, marginRight: spacing.md },
});
