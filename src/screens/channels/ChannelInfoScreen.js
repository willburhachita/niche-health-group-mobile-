import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Avatar } from '../../components/common/Avatar';
import { Divider } from '../../components/common/Divider';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function ChannelInfoScreen({ navigation, route }) {
  const alert = useAlert();
  const { channelId } = route.params || {};
  const channel = useQuery(api.channels.getChannel, channelId ? { channelId } : 'skip');
  const allUsers = useQuery(api.users.listUsers) || [];
  const userMap = React.useMemo(() => {
    const m = {};
    for (const u of allUsers) m[u.externalId] = u;
    return m;
  }, [allUsers]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Channel Info</AppText>
        <Pressable hitSlop={12}><Feather name="edit" size={20} color={colors.navyBlue} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topSection}>
          <View style={styles.iconBig}><Feather name={channel?.type === 'private' ? 'lock' : 'hash'} size={32} color={colors.navyBlue} /></View>
          <AppText variant="h1">#{channel?.name}</AppText>
          <AppText variant="body" color={colors.darkGrey} style={styles.desc}>{channel?.description}</AppText>
        </View>

        <Divider style={{ marginVertical: spacing.xl }} />

        <Pressable style={styles.actionRow}>
          <Feather name="bell-off" size={20} color={colors.navyBlue} style={styles.actionIcon} />
          <AppText variant="body" style={{ flex: 1 }}>Mute Channel</AppText>
          <Feather name="chevron-right" size={16} color={colors.lightGrey} />
        </Pressable>
        <Pressable style={styles.actionRow}>
          <Feather name="bookmark" size={20} color={colors.navyBlue} style={styles.actionIcon} />
          <AppText variant="body" style={{ flex: 1 }}>Pinned Messages</AppText>
          <Feather name="chevron-right" size={16} color={colors.lightGrey} />
        </Pressable>

        <Divider style={{ marginVertical: spacing.base }} />

        <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>MEMBERS ({channel?.memberCount})</AppText>
        {channel?.members?.map(mId => {
          const user = userMap[mId];
          return (
            <View key={mId} style={styles.memberRow}>
              <Avatar name={user?.displayName || mId} size={36} showOnline onlineStatus={user?.onlineStatus} />
              <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{user?.displayName || 'Former staff'}</AppText>
              {channel?.admins?.includes(mId) && <AppText variant="small" color={colors.navyBlue}>Admin</AppText>}
            </View>
          );
        })}

        <Pressable style={styles.destructiveAction} onPress={() => alert({ type: 'warning', title: 'Leave Channel', message: 'Are you sure you want to leave this channel?', buttons: [{ label: 'Cancel', style: 'cancel' }, { label: 'Leave', style: 'destructive' }] })}>
          <Feather name="log-out" size={20} color={colors.error} style={styles.actionIcon} />
          <AppText variant="body" color={colors.error}>Leave Channel</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  topSection: { alignItems: 'center' },
  iconBig: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  desc: { textAlign: 'center', marginTop: spacing.sm, maxWidth: 280 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  actionIcon: { marginRight: spacing.md, width: 24 },
  sectionLabel: { letterSpacing: 1, marginBottom: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  destructiveAction: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.xxl },
});
