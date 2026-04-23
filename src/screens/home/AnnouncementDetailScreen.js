import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Card } from '../../components/common/Card';
import { formatTimestamp } from '../../utils/dateHelpers';
import { formatFileSize } from '../../utils/formatters';

export default function AnnouncementDetailScreen({ navigation, route }) {
  const { announcementId } = route.params || {};
  const ann = useQuery(api.announcements.getAnnouncement, announcementId ? { announcementId } : 'skip');
  const authorProfile = useQuery(api.users.getUserByExternalId, ann?.author ? { externalId: ann.author } : 'skip');
  const authorDisplayName = ann?.authorName || authorProfile?.displayName || 'Admin';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}><Feather name="chevron-left" size={24} color={colors.black} /></Pressable>
        <AppText variant="h3">Announcement</AppText>
        <View style={{ width: 24 }} />
      </View>
      {!ann ? (
        <ActivityIndicator size="large" color={colors.navyBlue} style={{ marginTop: spacing.xxxl }} />
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.authorRow}>
          <Avatar name={authorDisplayName} size={36} />
          <View style={{ marginLeft: spacing.md }}>
            <AppText variant="bodyBold">{authorDisplayName}</AppText>
            <AppText variant="caption" color={colors.mediumGrey}>{formatTimestamp(ann.createdAt)}</AppText>
          </View>
        </View>

        <AppText variant="h1" style={styles.title}>{ann.title}</AppText>
        <AppText variant="body" color={colors.darkGrey} style={styles.body}>{ann.body}</AppText>

        {ann.attachments && ann.attachments.length > 0 && (
          <View style={styles.attachments}>
            <AppText variant="caption" color={colors.mediumGrey} style={styles.attachLabel}>ATTACHMENTS</AppText>
            {ann.attachments.map((file, i) => (
              <Card key={i} style={styles.fileCard}>
                <View style={styles.fileRow}>
                  <View style={styles.fileIcon}><Feather name="file-text" size={20} color={colors.navyBlue} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodyBold" numberOfLines={1}>{file.name}</AppText>
                    <AppText variant="caption" color={colors.mediumGrey}>{formatFileSize(file.size)}</AppText>
                  </View>
                  <Feather name="download" size={18} color={colors.navyBlue} />
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={styles.ackRow}>
          <Feather name="check-circle" size={16} color={colors.success} />
          <AppText variant="caption" color={colors.darkGrey} style={{ marginLeft: spacing.xs }}>
            Acknowledged by {ann.acknowledgedBy.length} / {ann.totalStaff} staff
          </AppText>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  title: { marginBottom: spacing.base },
  body: { lineHeight: 24 },
  attachments: { marginTop: spacing.xl },
  attachLabel: { letterSpacing: 1, marginBottom: spacing.sm },
  fileCard: { padding: spacing.md },
  fileRow: { flexDirection: 'row', alignItems: 'center' },
  fileIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.navyLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  ackRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl, paddingTop: spacing.base, borderTopWidth: 1, borderTopColor: colors.lightGrey },
});
