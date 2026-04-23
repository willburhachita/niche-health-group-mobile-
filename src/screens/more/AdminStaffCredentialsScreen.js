import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Divider } from '../../components/common/Divider';
import { SearchBar } from '../../components/common/SearchBar';
import { Badge } from '../../components/common/Badge';
import { ROLES } from '../../data/mockAuth';

export default function AdminStaffCredentialsScreen({ navigation }) {
  const allAccounts = useQuery(api.auth.getAllStaffAccounts) || [];
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  const accounts = allAccounts
    .filter((a) => a.isActive)
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.email.toLowerCase().includes(q) ||
        (a.displayName || '').toLowerCase().includes(q) ||
        (a.fullName || '').toLowerCase().includes(q) ||
        a.role.toLowerCase().includes(q)
      );
    });

  const handleCopy = async () => {
    if (!selectedAccount) return;
    const text = `Email: ${selectedAccount.email}\nVerification Code: ${selectedAccount.verificationCode}\nPassword: ${selectedAccount.password}\nRole: ${ROLES[selectedAccount.role]?.label || selectedAccount.role}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const roleColor = (role) => {
    if (role === 'admin') return colors.error;
    if (role === 'moderator') return colors.warning;
    return colors.navyBlue;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Staff Credentials</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search by email, name or role..." value={search} onChangeText={setSearch} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.countText}>
          {accounts.length} active account{accounts.length !== 1 ? 's' : ''}
        </AppText>

        {accounts.map((account) => (
          <Pressable
            key={account.id || account.email}
            style={styles.card}
            onPress={() => { setSelectedAccount(account); setCopied(false); }}
          >
            <View style={styles.cardTop}>
              <View style={[styles.avatarCircle, { backgroundColor: roleColor(account.role) + '18' }]}>
                <Feather
                  name={account.role === 'admin' ? 'shield' : account.role === 'moderator' ? 'star' : 'user'}
                  size={18}
                  color={roleColor(account.role)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" numberOfLines={1}>
                  {account.displayName || account.fullName || account.email}
                </AppText>
                <AppText variant="caption" color={colors.mediumGrey} numberOfLines={1}>
                  {account.email}
                </AppText>
              </View>
              <Badge
                label={ROLES[account.role]?.label || account.role}
                variant={account.role === 'admin' ? 'error' : account.role === 'moderator' ? 'warning' : 'default'}
              />
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Feather name="key" size={13} color={colors.mediumGrey} />
                <AppText variant="small" color={colors.darkGrey} style={{ marginLeft: 4 }}>
                  {account.role === 'admin' ? 'Active' : account.isOnboarded ? 'Onboarded' : 'Pending onboarding'}
                </AppText>
              </View>
              <Feather name="chevron-right" size={16} color={colors.lightGrey} />
            </View>
          </Pressable>
        ))}

        {accounts.length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={40} color={colors.lightGrey} />
            <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>
              No accounts match your search
            </AppText>
          </View>
        )}

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* ── Credential Detail Modal ─────────────────────────────── */}
      <Modal visible={!!selectedAccount} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => setSelectedAccount(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            {selectedAccount && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalIcon, { backgroundColor: roleColor(selectedAccount.role) + '18' }]}>
                    <Feather
                      name={selectedAccount.role === 'admin' ? 'shield' : selectedAccount.role === 'moderator' ? 'star' : 'user'}
                      size={22}
                      color={roleColor(selectedAccount.role)}
                    />
                  </View>
                  <Pressable onPress={() => setSelectedAccount(null)} hitSlop={8}>
                    <Feather name="x" size={22} color={colors.mediumGrey} />
                  </Pressable>
                </View>

                <AppText variant="h2" style={styles.modalName}>
                  {selectedAccount.displayName || selectedAccount.fullName || selectedAccount.email}
                </AppText>
                <AppText variant="caption" color={colors.mediumGrey} style={styles.modalEmail}>
                  {selectedAccount.email}
                </AppText>

                <View style={styles.credBox}>
                  <View style={styles.credRow}>
                    <AppText variant="small" color={colors.mediumGrey}>Email</AppText>
                    <AppText variant="bodyBold" style={styles.credVal}>{selectedAccount.email}</AppText>
                  </View>
                  <Divider />
                  <View style={styles.credRow}>
                    <AppText variant="small" color={colors.mediumGrey}>Verification Code</AppText>
                    <AppText variant="h3" color={colors.navyBlue} style={styles.credVal}>
                      {selectedAccount.verificationCode}
                    </AppText>
                  </View>
                  <Divider />
                  <View style={styles.credRow}>
                    <AppText variant="small" color={colors.mediumGrey}>Password</AppText>
                    <AppText variant="bodyBold" style={styles.credVal}>{selectedAccount.password}</AppText>
                  </View>
                  <Divider />
                  <View style={styles.credRow}>
                    <AppText variant="small" color={colors.mediumGrey}>Role</AppText>
                    <AppText variant="bodyBold" color={roleColor(selectedAccount.role)} style={styles.credVal}>
                      {ROLES[selectedAccount.role]?.label || selectedAccount.role}
                    </AppText>
                  </View>
                  <Divider />
                  <View style={styles.credRow}>
                    <AppText variant="small" color={colors.mediumGrey}>Status</AppText>
                    <AppText variant="bodyBold" color={selectedAccount.role === 'admin' || selectedAccount.isOnboarded ? colors.success : colors.warning} style={styles.credVal}>
                      {selectedAccount.role === 'admin' ? 'Active' : selectedAccount.isOnboarded ? 'Onboarded' : 'Pending Onboarding'}
                    </AppText>
                  </View>
                </View>

                <Pressable style={styles.copyBtn} onPress={handleCopy}>
                  <Feather name={copied ? 'check-circle' : 'copy'} size={18} color={copied ? colors.success : colors.navyBlue} />
                  <AppText variant="bodyBold" color={copied ? colors.success : colors.navyBlue} style={{ marginLeft: spacing.sm }}>
                    {copied ? 'Copied' : 'Copy Credentials'}
                  </AppText>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, height: 56,
    borderBottomWidth: 1, borderBottomColor: colors.lightGrey,
  },
  searchWrap: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  list: { paddingHorizontal: spacing.base },
  countText: { marginBottom: spacing.md },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    backgroundColor: colors.white,
    padding: spacing.base,
    marginBottom: spacing.sm,
    ...shadows.subtle,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.offWhite,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.strong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  modalName: { marginBottom: 2 },
  modalEmail: { marginBottom: spacing.lg },
  credBox: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  credRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
  },
  credVal: { marginTop: 2 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.navyBlue,
  },
});
