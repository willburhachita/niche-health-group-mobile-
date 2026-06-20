import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { formatTime, formatDateShort } from '../../utils/dateHelpers';
import { useAuth } from '../../hooks/useAuth';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleScreen({ navigation }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeLegend, setActiveLegend] = useState('All'); // 'All' | 'appointment' | 'shift' | 'meeting'
  const { role } = useAuth();
  const canCreateEvents = role === 'admin' || role === 'moderator';

  const year = today.getFullYear();
  const month = today.getMonth();

  const monthEvents = useQuery(api.scheduleEvents.listByMonth, { year, month }) ?? [];

  const getDatesForMonth = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let d = 1; d <= daysInMonth; d++) dates.push(new Date(year, month, d));
    return dates;
  };

  const dates = getDatesForMonth();
  const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const getEventsForDay = (date, filterType = activeLegend) => {
    if (!date) return [];
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    
    let filtered = monthEvents.filter(e => e.startTime >= dayStart.getTime() && e.startTime <= dayEnd.getTime());
    if (filterType !== 'All') {
      filtered = filtered.filter(e => e.type === filterType);
    }
    return filtered;
  };

  const selectedEvents = getEventsForDay(selectedDate);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h1">Schedule</AppText>
        {canCreateEvents && (
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreateEvent', {
              preselectedDate: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
            })}
            hitSlop={8}
          >
            <Feather name="plus" size={22} color={colors.navyBlue} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <AppText variant="h2" style={styles.monthLabel}>{monthName}</AppText>

        {/* Legend Filter Bar */}
        <View style={styles.legendContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.legendScroll}>
            {[
              { label: 'All', value: 'All', color: colors.navyBlue },
              { label: 'Appointments', value: 'appointment', color: colors.navyBlue },
              { label: 'Shifts', value: 'shift', color: colors.peach },
              { label: 'Meetings', value: 'meeting', color: colors.success },
            ].map((item) => {
              const isActive = activeLegend === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[
                    styles.legendTab,
                    isActive && { backgroundColor: item.color + '18', borderColor: item.color }
                  ]}
                  onPress={() => setActiveLegend(item.value)}
                >
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <AppText
                    variant="smallBold"
                    color={isActive ? item.color : colors.darkGrey}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.dayLabels}>
          {DAYS.map(d => <AppText key={d} variant="small" color={colors.mediumGrey} style={styles.dayLabel}>{d}</AppText>)}
        </View>

        <View style={styles.calGrid}>
          {dates.map((date, i) => {
            const isToday = date && date.toDateString() === today.toDateString();
            const isSelected = date && date.toDateString() === selectedDate?.toDateString();
            const dayEvents = getEventsForDay(date);
            const hasEvents = dayEvents.length > 0;

            // Dot color based on events
            let dotColor = colors.navyBlue;
            if (hasEvents) {
              const primaryEvent = dayEvents[0];
              if (primaryEvent.type === 'shift') dotColor = colors.peach;
              else if (primaryEvent.type === 'meeting') dotColor = colors.success;
            }

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
                    {hasEvents && <View style={[styles.eventDot, { backgroundColor: dotColor }]} />}
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <AppText variant="h3" style={styles.eventsTitle}>
              {selectedDate ? formatDateShort(selectedDate.getTime()) : 'Select a day'}
            </AppText>
            {canCreateEvents && (
              <Pressable
                style={styles.newEventBtn}
                onPress={() => navigation.navigate('CreateEvent', {
                  preselectedDate: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
                })}
              >
                <Feather name="plus" size={14} color={colors.white} />
                <AppText variant="small" color={colors.white} style={{ marginLeft: 4 }}>New Event</AppText>
              </Pressable>
            )}
          </View>
          {selectedEvents.length === 0 ? (
            <AppText variant="body" color={colors.mediumGrey} style={{ paddingHorizontal: spacing.base }}>
              {activeLegend === 'All' 
                ? (canCreateEvents ? 'No events — tap New Event to schedule one' : 'No events')
                : `No ${activeLegend === 'appointment' ? 'appointments' : activeLegend + 's'} today`
              }
            </AppText>
          ) : selectedEvents.map(e => (
            <Card key={e._id} onPress={() => navigation.navigate('EventDetail', { eventId: e._id })} style={{ marginHorizontal: spacing.base }}>
              <View style={styles.eventRow}>
                <View style={[styles.eventBar, { backgroundColor: e.type === 'shift' ? colors.peach : e.type === 'meeting' ? colors.success : colors.navyBlue }]} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  legendContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  legendScroll: {
    gap: spacing.sm,
    paddingVertical: 2,
  },
  legendTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    backgroundColor: colors.white,
    marginRight: spacing.xs,
  },
  legendDot: {
    width: 8, height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  dayLabels: { flexDirection: 'row', paddingHorizontal: spacing.sm },
  dayLabel: { flex: 1, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
  calCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calCellSelected: { backgroundColor: colors.navyLight, borderRadius: radius.md },
  calCellContent: { alignItems: 'center' },
  dateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  todayCircle: { backgroundColor: colors.navyBlue },
  eventDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
  eventsSection: { marginTop: spacing.xl, paddingBottom: TAB_BAR_HEIGHT + 16 },
  eventsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  eventsTitle: {},
  newEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navyBlue,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventBar: { width: 4, height: 44, borderRadius: 2, marginRight: spacing.md },
});
