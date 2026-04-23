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
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen({ navigation, route }) {
  const { currentAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const displayName = currentAccount?.displayName || currentAccount?.email || 'User';
  const roleDisplay = (currentAccount?.role || 'member').charAt(0).toUpperCase() + (currentAccount?.role || 'member').slice(1);

  const handleBack = () => {
    const originTab = route?.params?.originTab;
    const parentNav = navigation.getParent();

    // Opened from another tab (e.g. Home → Profile): reset More stack and return to origin
    if (originTab && parentNav) {
      navigation.reset({ index: 0, routes: [{ name: 'MoreMain' }] });
      parentNav.navigate(originTab);
      return;
    }

    // Normal back within More stack
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MoreMain');
  };

  const info = [
    { icon: 'mail', label: 'Email', value: currentAccount?.email || 'Not set' },
    { icon: 'phone', label: 'Phone', value: currentAccount?.phone || 'Not set' },
    { icon: 'calendar', label: 'Joined', value: currentAccount?.createdAt ? new Date(currentAccount.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'Unknown' },
  ];

  return (
    <View style={styles.container}>
      {/* Cover Photo */}
      <View style={styles.coverPhotoContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80' }} 
          style={styles.coverPhoto} 
        />
        <View style={styles.coverOverlay} />
      </View>

      <View style={[styles.topActions, { paddingTop: insets.top }]}> 
        <Pressable onPress={handleBack} style={styles.circleBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.black} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Settings')} style={styles.circleBtn} hitSlop={8}>
          <Feather name="settings" size={20} color={colors.black} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Overlapping Cover */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarWrapper}>
            <Avatar name={displayName} size={110} showOnline onlineStatus="online" style={styles.avatar} />
          </View>
          
          <AppText variant="h1" style={styles.name}>{displayName}</AppText>
          <AppText variant="body" color={colors.mediumGrey} style={styles.department}>
            {roleDisplay}
          </AppText>

          <View style={styles.badgeRow}>
            <Badge label="Active" variant="success" />
            <Badge label={currentAccount?.role || 'Staff'} variant="department" style={{ marginLeft: spacing.sm }} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('EditProfile')}>
              <Feather name="edit-3" size={18} color={colors.white} />
              <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.sm }}>Edit Profile</AppText>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Files')}>
              <Feather name="folder" size={20} color={colors.navyBlue} />
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
  },
  topActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
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
    marginBottom: spacing.md,
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
