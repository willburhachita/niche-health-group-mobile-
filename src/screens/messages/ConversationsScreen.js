import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';
import { ConversationItem } from '../../components/chat/ConversationItem';

const FILTERS = ['All', 'Unread', 'Groups'];

export default function ConversationsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const conversations = useQuery(api.messages.listConversations);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  let filtered = conversations || [];
  if (filter === 'Unread') filtered = filtered.filter(c => c.unreadBy?.[currentUserId] === true);
  if (filter === 'Groups') filtered = filtered.filter(c => c.type === 'group');
  // Sort by most recent message
  filtered = [...filtered].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h1">Messages</AppText>
        <Pressable onPress={() => navigation.navigate('NewMessage')} hitSlop={8}>
          <Feather name="edit" size={22} color={colors.navyBlue} />
        </Pressable>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search conversations..." />

      <View style={styles.filters}>
        {FILTERS.map(f => (
          <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filterPill, filter === f && styles.filterActive]}>
            <AppText variant="caption" color={filter === f ? colors.white : colors.darkGrey}>{f}</AppText>
          </Pressable>
        ))}
      </View>

      {!conversations ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={{ ...item, id: item._id }}
              currentUserId={currentUserId}
              onPress={() => navigation.navigate('Chat', { conversationId: item._id })}
            />
          )}
          ItemSeparatorComponent={() => <Divider type="avatarInset" />}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 64 }}
        />
      )}

      <Pressable style={styles.fab} onPress={() => navigation.navigate('NewMessage')}>
        <Feather name="edit" size={24} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.xl, paddingVertical: spacing.base,
  },
  filters: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm },
  filterPill: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm - 2,
    borderRadius: radius.full, backgroundColor: colors.offWhite,
  },
  filterActive: { backgroundColor: colors.navyBlue },
  fab: {
    position: 'absolute', bottom: TAB_BAR_HEIGHT + 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.navyBlue, alignItems: 'center', justifyContent: 'center',
    ...shadows.medium,
  },
});
