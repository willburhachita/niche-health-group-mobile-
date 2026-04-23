import React from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, TAB_BAR_HEIGHT } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { SectionHeader } from '../../components/common/SectionHeader';
import { Divider } from '../../components/common/Divider';
import { ChannelItem } from '../../components/channels/ChannelItem';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function ChannelsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const channels = useQuery(api.channels.listChannels) || [];

  const starred = channels.filter(c => c.isStarred);
  const yours = channels.filter(c => !c.isStarred);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <AppText variant="h1">Channels</AppText>
        <Pressable onPress={() => navigation.navigate('CreateChannel')} hitSlop={8}>
          <Feather name="plus" size={22} color={colors.navyBlue} />
        </Pressable>
      </View>
      <SearchBar placeholder="Search channels..." />

      <FlatList
        data={[{ type: 'section', title: 'Starred Channels', items: starred }, { type: 'section', title: 'Your Channels', items: yours }]}
        keyExtractor={(item, i) => String(i)}
        renderItem={({ item: section }) => (
          <View>
            <SectionHeader title={section.title} />
            {section.items.map(ch => (
              <View key={ch._id}>
                <ChannelItem channel={{ ...ch, id: ch._id }} onPress={() => navigation.navigate('ChannelThread', { channelId: ch._id })} />
                <Divider />
              </View>
            ))}
          </View>
        )}
        ListFooterComponent={
          <Pressable style={styles.discoverRow} onPress={() => navigation.navigate('DiscoverChannels')}>
            <Feather name="compass" size={20} color={colors.navyBlue} />
            <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.md, flex: 1 }}>Discover Channels</AppText>
            <Feather name="chevron-right" size={16} color={colors.lightGrey} />
          </Pressable>
        }
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 64 }}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateChannel')}>
        <Feather name="plus" size={24} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
  discoverRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, marginTop: spacing.base },
  fab: {
    position: 'absolute', bottom: TAB_BAR_HEIGHT + 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.navyBlue, alignItems: 'center', justifyContent: 'center',
    ...shadows.medium,
  },
});
