import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Divider } from '../../components/common/Divider';
import { formatTimestamp } from '../../utils/dateHelpers';
import { useAlert } from '../../components/common/CustomAlert';

export default function AdminDeviceApprovalsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const deviceRequests = useQuery(api.auth.listDeviceRequests);
  const approveRequest = useMutation(api.auth.approveDeviceRequest);
  const rejectRequest = useMutation(api.auth.rejectDeviceRequest);

  const alert = useAlert();

  const pending = (deviceRequests || []).filter(d => d.status === 'pending');
  const history = (deviceRequests || []).filter(d => d.status !== 'pending')
    .sort((a, b) => (b.reviewedAt || b.requestedAt) - (a.reviewedAt || a.requestedAt));

  const handleApprove = async (requestId) => {
    try {
      await approveRequest({ requestId, adminId: currentAccount?.userId || 'admin' });
      alert({ type: 'success', title: 'Device Approved', message: 'Device has been approved and added to trusted devices.' });
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Failed to approve device.' });
    }
  };

  const handleReject = (requestId) => {
    alert({
      type: 'warning',
      title: 'Reject Device',
      message: 'Are you sure you want to reject this device request?',
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        {
          label: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectRequest({ requestId, adminId: currentAccount?.userId || 'admin' });
            } catch (e) {
              alert({ type: 'error', title: 'Error', message: 'Failed to reject device.' });
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Device Approvals</AppText>
        <View style={{ width: 24 }} />
      </View>
      
      {!deviceRequests ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryBox}>
          <Feather name="shield" size={32} color={colors.navyBlue} style={{ marginBottom: spacing.sm }} />
          <AppText variant="h2">Security Center</AppText>
          <AppText variant="body" color={colors.darkGrey} style={{ textAlign: 'center', marginTop: spacing.xs }}>
            Review new devices attempting to connect to the Niche Healthcare network.
          </AppText>
        </View>

        <AppText variant="h3" style={styles.sectionTitle}>Pending Review ({pending.length})</AppText>
        {pending.length === 0 ? (
          <Card style={styles.deviceCard}>
            <AppText variant="body" color={colors.mediumGrey} style={{ textAlign: 'center', paddingVertical: spacing.base }}>
              No pending device requests
            </AppText>
          </Card>
        ) : (
          pending.map(d => (
            <Card key={d._id} variant="highlighted" style={styles.deviceCard}>
              <View style={styles.row}>
                <View style={styles.iconBoxWarning}>
                  <Feather name="smartphone" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{d.deviceName || 'Unknown Device'}</AppText>
                  <AppText variant="caption" color={colors.darkGrey}>
                    Requested by {d.staffName} • {formatTimestamp(d.requestedAt)}
                  </AppText>
                  {d.staffEmail ? <AppText variant="small" color={colors.mediumGrey}>{d.staffEmail}</AppText> : null}
                </View>
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.approveBtn} onPress={() => handleApprove(d._id)}>
                  <Feather name="check" size={16} color={colors.white} />
                  <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.xs }}>Approve</AppText>
                </Pressable>
                <Pressable style={styles.rejectBtn} onPress={() => handleReject(d._id)}>
                  <Feather name="x" size={16} color={colors.error} />
                  <AppText variant="bodyBold" color={colors.error} style={{ marginLeft: spacing.xs }}>Reject</AppText>
                </Pressable>
              </View>
            </Card>
          ))
        )}

        <AppText variant="h3" style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Recent History</AppText>
        {history.length === 0 ? (
          <Card style={styles.historyCard}>
            <AppText variant="body" color={colors.mediumGrey} style={{ textAlign: 'center', paddingVertical: spacing.base }}>
              No history yet
            </AppText>
          </Card>
        ) : (
          <Card style={styles.historyCard}>
            {history.map((d, i, arr) => (
              <View key={d._id}>
                <View style={styles.historyRow}>
                  <View style={[styles.statusDot, { backgroundColor: d.status === 'approved' ? colors.success : colors.error }]} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold">{d.deviceName || 'Unknown Device'}</AppText>
                    <AppText variant="caption" color={colors.darkGrey}>{d.staffName} • {formatTimestamp(d.reviewedAt || d.requestedAt)}</AppText>
                  </View>
                  <AppText variant="caption" color={d.status === 'approved' ? colors.success : colors.error}>
                    {d.status.toUpperCase()}
                  </AppText>
                </View>
                {i < arr.length - 1 && <Divider type="inset" />}
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  summaryBox: { alignItems: 'center', backgroundColor: colors.white, padding: spacing.xl, borderRadius: radius.xl, ...shadows.subtle, marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  deviceCard: { padding: spacing.base, marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBoxWarning: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.warning + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  approveBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.navyBlue, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.error, paddingVertical: spacing.sm, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  historyCard: { padding: spacing.base, backgroundColor: colors.white, borderRadius: radius.xl, ...shadows.subtle },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.md },
});
