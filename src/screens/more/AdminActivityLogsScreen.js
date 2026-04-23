import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';

const CATEGORIES = ['all', 'auth', 'staff', 'channel', 'announcement', 'device', 'system'];

const CATEGORY_CONFIG = {
  auth: { icon: 'log-in', color: colors.navyBlue },
  staff: { icon: 'users', color: colors.success },
  channel: { icon: 'hash', color: colors.navyBlue },
  announcement: { icon: 'bell', color: colors.peach },
  device: { icon: 'smartphone', color: colors.warning },
  system: { icon: 'activity', color: colors.mediumGrey },
};

const formatTimeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function AdminActivityLogsScreen({ navigation }) {
  const allLogs = useQuery(api.activityLogs.listActivityLogs, { limit: 200 });
  const [activeCategory, setActiveCategory] = useState('all');

  const logs = activeCategory === 'all'
    ? (allLogs || [])
    : (allLogs || []).filter(l => l.category === activeCategory);

  const getConfig = (cat) => CATEGORY_CONFIG[cat] || { icon: 'activity', color: colors.mediumGrey };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Activity Logs</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filters}>
        {CATEGORIES.map(cat => (
          <Pressable key={cat} onPress={() => setActiveCategory(cat)} style={[styles.filterPill, activeCategory === cat && styles.filterActive]}>
            <AppText variant="small" color={activeCategory === cat ? colors.white : colors.darkGrey}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </AppText>
          </Pressable>
        ))}
      </View>

      {!allLogs ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.md }}>
              {logs.length} {activeCategory === 'all' ? 'total' : activeCategory} log{logs.length !== 1 ? 's' : ''}
            </AppText>
          }
          renderItem={({ item }) => {
            const cfg = getConfig(item.category);
            return (
              <View style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: cfg.color + '20' }]}>
                  <Feather name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.info}>
                  <AppText variant="bodyBold">{item.action}</AppText>
                  {item.target ? <AppText variant="caption" color={colors.darkGrey}>{item.target}</AppText> : null}
                  {item.details ? <AppText variant="small" color={colors.mediumGrey} numberOfLines={2}>{item.details}</AppText> : null}
                  <View style={styles.metaRow}>
                    <View style={[styles.catBadge, { backgroundColor: cfg.color + '14' }]}>
                      <AppText variant="small" color={cfg.color}>{item.category}</AppText>
                    </View>
                    <AppText variant="small" color={colors.mediumGrey}>{formatTimeAgo(item.timestamp)}</AppText>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={{ padding: spacing.xxxl, alignItems: 'center' }}>
              <Feather name="clipboard" size={40} color={colors.lightGrey} />
              <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>No activity logs yet</AppText>
              <AppText variant="caption" color={colors.mediumGrey}>Actions by staff will appear here</AppText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  filters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.xs },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.white },
  filterActive: { backgroundColor: colors.navyBlue },
  list: { padding: spacing.base, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.base, marginBottom: spacing.sm, ...shadows.subtle },
  iconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  info: { flex: 1, justifyContent: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm },
  catBadge: { paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: radius.full },
});
