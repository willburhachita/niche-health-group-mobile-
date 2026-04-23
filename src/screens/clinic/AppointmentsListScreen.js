import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { EmptyState } from '../../components/common/EmptyState';
import { AppointmentCard } from '../../components/clinic/AppointmentCard';
import {
  getTodaysAppointments,
  getUpcomingAppointments,
  getPastAppointments,
  getAppointmentsForDate,
} from '../../data/mockAppointments';
import { formatDateShort } from '../../utils/dateHelpers';

const FILTERS = ['Today', 'Upcoming', 'Past'];

export default function AppointmentsListScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState('Today');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getFilteredAppointments = () => {
    switch (activeFilter) {
      case 'Today': return getTodaysAppointments();
      case 'Upcoming': return getUpcomingAppointments();
      case 'Past': return getPastAppointments();
      default: return getTodaysAppointments();
    }
  };

  const appointments = getFilteredAppointments();

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Appointments</AppText>
        <Pressable onPress={() => navigation.navigate('BookAppointment')} hitSlop={8}>
          <Feather name="plus" size={24} color={colors.navyBlue} />
        </Pressable>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <AppText
              variant="caption"
              color={activeFilter === f ? colors.white : colors.navyBlue}
            >
              {f}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Date Banner (for Today filter) */}
      {activeFilter === 'Today' && (
        <View style={styles.dateBanner}>
          <Pressable onPress={() => navigateDay(-1)} hitSlop={8}>
            <Feather name="chevron-left" size={20} color={colors.navyBlue} />
          </Pressable>
          <AppText variant="bodyBold">{formatDateShort(selectedDate.getTime())}</AppText>
          <Pressable onPress={() => navigateDay(1)} hitSlop={8}>
            <Feather name="chevron-right" size={20} color={colors.navyBlue} />
          </Pressable>
        </View>
      )}

      {/* Appointments List */}
      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.id })}
          />
        )}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT, paddingTop: spacing.sm }}
        ListEmptyComponent={
          <EmptyState
            icon="calendar"
            title="No appointments"
            message={`No ${activeFilter.toLowerCase()} appointments found`}
          />
        }
      />

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('BookAppointment')}
      >
        <Feather name="plus" size={24} color={colors.white} />
      </Pressable>
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  filterPillActive: {
    backgroundColor: colors.navyBlue,
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.offWhite,
    marginHorizontal: spacing.base,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: TAB_BAR_HEIGHT + spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.navyBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.navyBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
