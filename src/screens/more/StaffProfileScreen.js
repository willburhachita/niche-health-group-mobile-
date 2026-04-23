import React from 'react';
import { View, ScrollView, Pressable, StyleSheet, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Divider } from '../../components/common/Divider';
import { getUserById } from '../../data/mockUsers';

export default function StaffProfileScreen({ navigation, route }) {
  const { userId } = route.params || {};
  const user = getUserById(userId);
  const insets = useSafeAreaInsets();

  if (!user) return null;

  const roleDisplay = user.staffRole.charAt(0).toUpperCase() + user.staffRole.slice(1);
  const info = [
    { icon: 'mail', label: 'Email', value: user.email },
    { icon: 'phone', label: 'Phone', value: user.phone },
    { icon: 'calendar', label: 'Joined', value: new Date(user.joinedAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) },
  ];

  const statusLabel = user.onlineStatus === 'online' ? 'Online' 
    : user.onlineStatus === 'away' ? 'Away' 
    : 'Offline';

  return (
    <View style={styles.container}>
      {/* Cover Photo */}
      <View style={styles.coverPhotoContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000' }} 
          style={styles.coverPhoto} 
        />
        <View style={[styles.coverOverlay, { paddingTop: insets.top }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.circleBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.black} />
          </Pressable>
          <Pressable onPress={() => {}} style={styles.circleBtn} hitSlop={8}>
            <Feather name="more-horizontal" size={24} color={colors.black} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Overlapping Cover */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <Avatar name={user.displayName} size={110} showOnline onlineStatus={user.onlineStatus} style={styles.avatar} />
          </View>
          
          <AppText variant="h1" style={styles.name}>{user.displayName}</AppText>
          <AppText variant="body" color={colors.mediumGrey} style={styles.department}>
            {roleDisplay} • {user.department}
          </AppText>

          {user.bio ? (
            <AppText variant="body" color={colors.darkGrey} style={styles.bioText} numberOfLines={3}>
              "{user.bio}"
            </AppText>
          ) : null}

          <View style={styles.badgeRow}>
            <Badge label={statusLabel} variant={user.onlineStatus === 'online' ? 'success' : 'default'} />
            <Badge label={user.department} variant="department" style={{ marginLeft: spacing.sm }} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable 
              style={styles.primaryBtn} 
              onPress={() => navigation.navigate('MessagesTab', { screen: 'Chat', params: { conversationId: 'conv-new-' + user.id } })}
            >
              <Feather name="message-circle" size={18} color={colors.white} />
              <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.sm }}>Message</AppText>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => {}}>
              <Feather name="phone-call" size={20} color={colors.navyBlue} />
            </Pressable>
          </View>
        </View>

        {/* Contact Info Card */}
        <View style={styles.sectionCard}>
          <AppText variant="h2" style={styles.sectionTitle}>Contact & Info</AppText>
          {info.map((item, i) => (
            <View key={item.label}>
              <View style={styles.infoRow}>
                <View style={styles.iconBox}>
                  <Feather name={item.icon} size={20} color={colors.navyBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="caption" color={colors.mediumGrey}>{item.label}</AppText>
                  <AppText variant="bodyBold" style={{ marginTop: 2 }}>{item.value}</AppText>
                </View>
              </View>
              {i < info.length - 1 && <Divider type="inset" />}
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  coverPhotoContainer: {
    height: 190,
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 0,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    ...shadows.subtle,
  },
  scrollContent: {
    paddingTop: 130, // Pushes card down so Avatar perfectly overlaps the cover
    paddingHorizontal: spacing.base,
  },
  profileHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.medium,
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    marginTop: -80, // Negative margin to overlap the cover photo
    marginBottom: spacing.md,
    padding: 6,
    backgroundColor: colors.white,
    borderRadius: 70,
    ...shadows.subtle,
  },
  name: {
    textAlign: 'center',
    marginBottom: 4,
  },
  department: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bioText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.sm,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.navyBlue,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  secondaryBtn: {
    width: 52,
    height: 52,
    backgroundColor: colors.navyLight,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadows.subtle,
  },
  sectionTitle: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
});
