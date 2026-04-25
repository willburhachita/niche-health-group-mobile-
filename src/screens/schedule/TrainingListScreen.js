import React from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { formatDateShort } from '../../utils/dateHelpers';

export default function TrainingListScreen({ navigation }) {
  const trainingSessions = useQuery(api.scheduleEvents.listTraining) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Training Sessions</AppText>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={trainingSessions}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: spacing.base }}
        renderItem={({ item }) => (
          <Card onPress={() => {}}>
            <View style={styles.row}>
              <View style={styles.iconCircle}>
                <Feather name="book-open" size={20} color={colors.peach} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{item.title}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{formatDateShort(item.startTime)}</AppText>
                <AppText variant="small" color={colors.mediumGrey}>Organiser: {item.createdBy || 'Unknown'}</AppText>
              </View>
              {item.isRegistered ? (
                <Badge label="Registered" variant="success" />
              ) : (
                <Pressable style={styles.registerBtn}>
                  <AppText variant="caption" color={colors.navyBlue}>Register</AppText>
                </Pressable>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.peachLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  registerBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.navyBlue },
});
