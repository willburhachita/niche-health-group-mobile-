import React, { useState, useMemo } from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { Divider } from '../../components/common/Divider';
import { PatientCard } from '../../components/clinic/PatientCard';

const FILTERS = ['All', 'Active', 'Dialysis', 'Recent'];

export default function PatientDirectoryScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const searchResults = useQuery(api.patients.search, { query: query });
  const allPatients = useQuery(api.patients.list, {});

  const patients = useMemo(() => {
    let list = query.length > 0 ? (searchResults ?? []) : (allPatients ?? []);

    switch (activeFilter) {
      case 'Active':
        list = list.filter(p => p.status === 'active');
        break;
      case 'Dialysis':
        list = list.filter(p => p.department === 'Dialysis');
        break;
      case 'Recent':
        list = list
          .filter(p => p.status === 'active')
          .sort((a, b) => (b.lastVisit ?? 0) - (a.lastVisit ?? 0));
        break;
    }

    return list;
  }, [searchResults, allPatients, activeFilter, query]);

  // Group by first letter
  const grouped = patients.reduce((acc, p) => {
    const letter = (p.lastName?.[0] ?? '?').toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(p);
    return acc;
  }, {});

  const sections = Object.keys(grouped).sort().map(letter => ({
    letter,
    patients: grouped[letter],
  }));

  const flatData = sections.flatMap(s => [
    { type: 'header', letter: s.letter, id: `header-${s.letter}` },
    ...s.patients.map(p => ({ type: 'patient', id: p._id, ...p })),
  ]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h2" style={styles.headerTitle}>Patients</AppText>
        <Pressable onPress={() => navigation.navigate('AddEditPatient')} hitSlop={8}>
          <Feather name="plus" size={24} color={colors.navyBlue} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.base }}>
        <SearchBar
          placeholder="Search by name, ID, or phone..."
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}
          >
            <AppText variant="caption" color={activeFilter === f ? colors.white : colors.navyBlue}>
              {f}
            </AppText>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={flatData}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <AppText variant="bodyBold" color={colors.navyBlue} style={styles.sectionLetter}>
                {item.letter}
              </AppText>
            );
          }
          return (
            <>
              <PatientCard
                patient={item}
                onPress={() => navigation.navigate('PatientProfile', { patientId: item._id })}
              />
              <Divider type="inset" />
            </>
          );
        }}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT }}
        ListEmptyComponent={
          <EmptyState icon="users" title="No patients found" message="Try adjusting your search or filters" />
        }
        ListFooterComponent={
          patients.length > 0 ? (
            <AppText variant="caption" color={colors.mediumGrey} style={styles.count}>
              {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </AppText>
          ) : null
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddEditPatient')}
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
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.navyLight,
  },
  filterPillActive: {
    backgroundColor: colors.navyBlue,
  },
  sectionLetter: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  count: {
    textAlign: 'center',
    paddingVertical: spacing.xl,
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
