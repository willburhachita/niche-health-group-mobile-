import React from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { mockDevices } from '../../data/mockAnnouncements';
import { formatTimestamp } from '../../utils/dateHelpers';

export default function TrustedDevicesScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Trusted Devices</AppText>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={mockDevices}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.base }}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <Feather name="smartphone" size={22} color={colors.navyBlue} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText variant="bodyBold">{item.deviceName}</AppText>
                  {item.isCurrentDevice && <Badge label="Current" variant="success" style={{ marginLeft: spacing.sm }} />}
                </View>
                <AppText variant="caption" color={colors.mediumGrey}>{item.platform}</AppText>
                <AppText variant="small" color={colors.mediumGrey}>Last active: {formatTimestamp(item.lastActiveAt)}</AppText>
              </View>
              <Badge
                label={item.trustStatus.charAt(0).toUpperCase() + item.trustStatus.slice(1)}
                variant={item.trustStatus === 'trusted' ? 'success' : item.trustStatus === 'pending' ? 'warning' : 'role'}
              />
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
  titleRow: { flexDirection: 'row', alignItems: 'center' },
});
