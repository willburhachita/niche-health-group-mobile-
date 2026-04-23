import React from 'react';
import { View, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';

export default function NewMessageScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const createConversation = useMutation(api.messages.createConversation);
  const conversations = useQuery(api.messages.listConversations) || [];
  const allUsers = useQuery(api.users.listUsers) || [];
  const staff = allUsers.filter(u => u.externalId !== currentUserId);

  const handleContact = async (user) => {
    const existing = conversations.find(
      (c) => c.type === 'direct' && c.members.includes(currentUserId) && c.members.includes(user.externalId)
    );
    if (existing) {
      navigation.replace('Chat', { conversationId: existing._id });
      return;
    }
    const convId = await createConversation({
      type: 'direct',
      members: [currentUserId, user.externalId],
    });
    navigation.replace('Chat', { conversationId: convId });
  };

  const renderContact = ({ item }) => (
    <Pressable style={styles.contactRow} onPress={() => handleContact(item)}>
      <Avatar name={item.displayName} size={40} showOnline onlineStatus={item.onlineStatus} />
      <View style={styles.contactInfo}>
        <AppText variant="bodyBold">{item.displayName}</AppText>
        <AppText variant="caption" color={colors.mediumGrey}>{item.department || item.staffRole}</AppText>
      </View>
      <Badge label={item.staffRole.charAt(0).toUpperCase() + item.staffRole.slice(1)} variant="role" />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h3">New Message</AppText>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Cancel</AppText>
        </Pressable>
      </View>
      <SearchBar placeholder="Search staff..." />
      <FlatList
        data={staff}
        keyExtractor={item => item.externalId}
        renderItem={renderContact}
        ItemSeparatorComponent={() => <Divider type="avatarInset" />}
        ListHeaderComponent={<AppText variant="caption" color={colors.mediumGrey} style={styles.sectionLabel}>ALL STAFF</AppText>}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: spacing.xxxl }}>
            <AppText variant="body" color={colors.mediumGrey}>No other staff to message yet</AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.lightGrey,
  },
  sectionLabel: { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm, letterSpacing: 1 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  contactInfo: { flex: 1, marginLeft: spacing.md },
});
