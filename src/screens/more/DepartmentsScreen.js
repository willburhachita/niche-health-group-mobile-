import React from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { mockDepartments } from '../../data/mockAnnouncements';
import { getUserById } from '../../data/mockUsers';

export default function DepartmentsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Departments</AppText>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={mockDepartments}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.base }}
        renderItem={({ item }) => {
          const lead = getUserById(item.lead);
          return (
            <Card onPress={() => {}}>
              <View style={styles.row}>
                <View style={styles.iconCircle}>
                  <Feather name="grid" size={20} color={colors.navyBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{item.name}</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>{item.description}</AppText>
                  <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                    Lead: {lead?.displayName} | {item.memberCount} members
                  </AppText>
                </View>
                <Feather name="chevron-right" size={16} color={colors.lightGrey} />
              </View>
            </Card>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
});
