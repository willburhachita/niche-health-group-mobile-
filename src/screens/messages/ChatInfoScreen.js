import React from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { useAlert } from '../../components/common/CustomAlert';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Divider } from '../../components/common/Divider';

const ACTIONS = [
  { icon: 'search', label: 'Search in Conversation' },
  { icon: 'image', label: 'Media & Files' },
  { icon: 'bell-off', label: 'Mute Notifications' },
];

export default function ChatInfoScreen({ navigation, route }) {
  const alert = useAlert();
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const { conversationId } = route.params || {};
  const conversation = useQuery(api.messages.getConversation, conversationId ? { conversationId } : 'skip');
  const allUsers = useQuery(api.users.listUsers) || [];
  const userMap = React.useMemo(() => {
    const m = {};
    for (const u of allUsers) m[u.externalId] = u;
    return m;
  }, [allUsers]);
  const isGroup = conversation?.type === 'group';
  const otherMemberId = !isGroup ? conversation?.members?.find(m => m !== currentUserId) : null;
  const otherUser = otherMemberId ? userMap[otherMemberId] : null;
  const title = isGroup ? conversation?.name : otherUser?.displayName;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">{isGroup ? 'Group Info' : 'Contact Info'}</AppText>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <Avatar name={title} size={80} showOnline={!isGroup} onlineStatus={otherUser?.onlineStatus} />
          <AppText variant="h1" style={styles.name}>{title}</AppText>
          {otherUser && (
            <View>
              <Badge label={otherUser.staffRole.charAt(0).toUpperCase() + otherUser.staffRole.slice(1)} variant="role" />
              <AppText variant="caption" color={colors.mediumGrey} style={{ marginTop: spacing.xs, textAlign: 'center' }}>{otherUser.department}</AppText>
            </View>
          )}
          {isGroup && <AppText variant="caption" color={colors.mediumGrey}>{conversation?.members?.length} members</AppText>}
        </View>

        <Divider style={{ marginVertical: spacing.xl }} />

        {ACTIONS.map((a, i) => (
          <View key={a.label}>
            <Pressable style={styles.actionRow}>
              <Feather name={a.icon} size={20} color={colors.navyBlue} style={{ marginRight: spacing.md, width: 24 }} />
              <AppText variant="body" style={{ flex: 1 }}>{a.label}</AppText>
              <Feather name="chevron-right" size={16} color={colors.lightGrey} />
            </Pressable>
            {i < ACTIONS.length - 1 && <Divider type="inset" />}
          </View>
        ))}

        {isGroup && (
          <View>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>MEMBERS ({conversation?.members?.length})</AppText>
            {conversation?.members?.map(mId => {
              const user = userMap[mId];
              return (
                <View key={mId} style={styles.memberRow}>
                  <Avatar name={user?.displayName || mId} size={36} showOnline onlineStatus={user?.onlineStatus} />
                  <AppText variant="body" style={{ flex: 1, marginLeft: spacing.md }}>{user?.displayName || 'Unknown staff'}</AppText>
                  {mId === currentUserId && <AppText variant="caption" color={colors.mediumGrey}>You</AppText>}
                </View>
              );
            })}
          </View>
        )}

        <Pressable style={styles.destructiveAction} onPress={() => alert({ type: 'warning', title: isGroup ? 'Leave Group' : 'Block User', message: isGroup ? 'Are you sure you want to leave this group?' : 'Are you sure you want to block this user?', buttons: [{ label: 'Cancel', style: 'cancel' }, { label: isGroup ? 'Leave' : 'Block', style: 'destructive' }] })}>
          <Feather name="x-circle" size={20} color={colors.error} style={{ marginRight: spacing.md }} />
          <AppText variant="body" color={colors.error}>{isGroup ? 'Leave Group' : 'Block User'}</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  profileSection: { alignItems: 'center', paddingBottom: spacing.base },
  name: { marginTop: spacing.md, marginBottom: spacing.sm },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  sectionLabel: { letterSpacing: 1, marginTop: spacing.xl, marginBottom: spacing.md },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  destructiveAction: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: spacing.base },
});
