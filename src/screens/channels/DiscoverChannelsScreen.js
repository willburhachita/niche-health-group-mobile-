import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { SearchBar } from '../../components/common/SearchBar';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';

export default function DiscoverChannelsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const [search, setSearch] = useState('');
  const [joiningId, setJoiningId] = useState(null);

  const allChannels = useQuery(api.channels.listChannels) || [];
  const joinChannel = useMutation(api.channels.joinChannel);

  // Show public channels not yet joined by current user
  const discoverChannels = allChannels.filter(ch =>
    ch.type === 'public' &&
    !ch.members?.includes(currentUserId) &&
    (search === '' || ch.displayName.toLowerCase().includes(search.toLowerCase()))
  );

  const handleJoin = async (channelId) => {
    setJoiningId(channelId);
    try {
      await joinChannel({ channelId, userId: currentUserId });
      navigation.replace('ChannelThread', { channelId });
    } catch (e) {
      console.warn('Join failed', e);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Discover Channels</AppText>
        <View style={{ width: 24 }} />
      </View>
      <SearchBar placeholder="Search channels..." value={search} onChangeText={setSearch} />
      {allChannels === undefined ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={discoverChannels}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: spacing.base }}
          ListEmptyComponent={
            <AppText variant="body" color={colors.mediumGrey} style={{ textAlign: 'center', marginTop: spacing.xxxl }}>
              {search ? 'No channels match your search.' : 'You have joined all available public channels!'}
            </AppText>
          }
          renderItem={({ item }) => (
            <View style={styles.channelCard}>
              <View style={styles.iconCircle}><Feather name="hash" size={20} color={colors.navyBlue} /></View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold">{item.displayName}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{item.description}</AppText>
                <AppText variant="small" color={colors.mediumGrey}>{item.memberCount} members</AppText>
              </View>
              <Pressable
                style={styles.joinBtn}
                onPress={() => handleJoin(item._id)}
                disabled={joiningId === item._id}
              >
                <AppText variant="bodyBold" color={joiningId === item._id ? colors.mediumGrey : colors.navyBlue}>
                  {joiningId === item._id ? '...' : 'Join'}
                </AppText>
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  channelCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  joinBtn: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, borderRadius: 20, borderWidth: 1.5, borderColor: colors.navyBlue },
});
