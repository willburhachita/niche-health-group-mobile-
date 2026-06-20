import React from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { formatTimestamp } from '../../utils/dateHelpers';

export default function TrustedDevicesScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const staffAccount = useQuery(
    api.auth.getStaffByUserId,
    currentAccount?.userId ? { userId: currentAccount.userId } : 'skip'
  );
  const trustedDevices = staffAccount?.trustedDevices ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Trusted Devices</AppText>
        <View style={{ width: 24 }} />
      </View>

      {trustedDevices.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="smartphone" size={40} color={colors.lightGrey} />
          <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>
            No trusted devices registered
          </AppText>
        </View>
      ) : (
        <FlatList
          data={trustedDevices}
          keyExtractor={(item, idx) => item?.deviceId ?? String(idx)}
          contentContainerStyle={{ padding: spacing.base }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <View style={styles.row}>
                <Feather name="smartphone" size={22} color={colors.navyBlue} style={{ marginRight: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{item.deviceName || item.deviceId || 'Device'}</AppText>
                  <AppText variant="caption" color={colors.mediumGrey}>{item.platform || 'Unknown platform'}</AppText>
                </View>
                <Badge label="Trusted" variant="success" />
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
