import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
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
import { ROLES } from '../../utils/authHelpers';
import { useAuth } from '../../hooks/useAuth';

export default function AdminStaffCredentialsScreen({ navigation }) {
  const { currentUserId } = useAuth();
  const allAccounts = useQuery(api.auth.getAllStaffAccounts) || [];
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Active'); // 'Active' | 'Inactive' | 'All'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const deactivateStaff = useMutation(api.auth.deactivateStaffAccount);
  const reactivateStaff = useMutation(api.auth.reactivateStaffAccount);

  const selectedAccountDetails = selectedAccount
    ? allAccounts.find(a => a._id === selectedAccount._id)
    : null;

  const accounts = allAccounts
    .filter((a) => {
      if (filter === 'Active') return a.isActive;
      if (filter === 'Inactive') return !a.isActive;
      return true;
    })
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
    const acc = selectedAccountDetails || selectedAccount;
    if (!acc) return;
    const text = `Email: ${acc.email}\nVerification Code: ${acc.verificationCode}\nPassword: ${acc.password}\nRole: ${ROLES[acc.role]?.label || acc.role}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySingle = async (field, value) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleActive = (account) => {
    if (!currentUserId || !account) return;
    const action = account.isActive ? 'Deactivate' : 'Reactivate';
    
    Alert.alert(
      `${action} Account`,
      `Are you sure you want to ${action.toLowerCase()} the staff account for ${account.displayName || account.fullName || account.email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action, 
          style: account.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (account.isActive) {
                await deactivateStaff({ accountId: account._id, adminId: currentUserId });
              } else {
                await reactivateStaff({ accountId: account._id, adminId: currentUserId });
              }
            } catch (e) {
              Alert.alert('Error', e.message || 'Failed to update account status');
            }
          }
        }
      ]
    );
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

      <View style={styles.filterBar}>
        {['Active', 'Inactive', 'All'].map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <AppText
              variant="smallBold"
              color={filter === f ? colors.white : colors.mediumGrey}
            >
              {f}
            </AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <AppText variant="caption" color={colors.mediumGrey} style={styles.countText}>
          {accounts.length} {filter.toLowerCase()} account{accounts.length !== 1 ? 's' : ''}
        </AppText>

        {accounts.map((account) => (
          <Pressable
            key={account.id || account.email}
            style={styles.card}
            onPress={() => { setSelectedAccount(account); setCopied(false); setCopiedField(null); }}
          >
            <View style={styles.cardTop}>
              <View style={[
                styles.avatarCircle, 
                { backgroundColor: account.isActive ? (roleColor(account.role) + '18') : '#E5E7EB' }
              ]}>
                <Feather
                  name={!account.isActive ? 'lock' : account.role === 'admin' ? 'shield' : account.role === 'moderator' ? 'star' : 'user'}
                  size={18}
                  color={account.isActive ? roleColor(account.role) : '#6B7280'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText 
                  variant="bodyBold" 
                  numberOfLines={1}
                  style={!account.isActive && { color: '#6B7280' }}
                >
                  {account.displayName || account.fullName || account.email}
                </AppText>
                <AppText variant="caption" color={colors.mediumGrey} numberOfLines={1}>
                  {account.email}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                {!account.isActive && (
                  <Badge label="Inactive" variant="unread" style={{ backgroundColor: '#EF4444' }} />
                )}
                <Badge
                  label={ROLES[account.role]?.label || account.role}
                  variant={account.role === 'admin' ? 'unread' : account.role === 'moderator' ? 'warning' : 'role'}
                />
              </View>
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Feather name="key" size={13} color={colors.mediumGrey} />
                <AppText variant="small" color={colors.darkGrey} style={{ marginLeft: 4 }}>
                  {!account.isActive ? 'Archived' : account.role === 'admin' ? 'Active' : account.isOnboarded ? 'Onboarded' : 'Pending onboarding'}
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
            {selectedAccountDetails && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[
                    styles.modalIcon, 
                    { backgroundColor: selectedAccountDetails.isActive ? (roleColor(selectedAccountDetails.role) + '18') : '#E5E7EB' }
                  ]}>
                    <Feather
                      name={!selectedAccountDetails.isActive ? 'lock' : selectedAccountDetails.role === 'admin' ? 'shield' : selectedAccountDetails.role === 'moderator' ? 'star' : 'user'}
                      size={22}
                      color={selectedAccountDetails.isActive ? roleColor(selectedAccountDetails.role) : '#6B7280'}
                    />
                  </View>
                  <Pressable onPress={() => setSelectedAccount(null)} hitSlop={8}>
                    <Feather name="x" size={22} color={colors.mediumGrey} />
                  </Pressable>
                </View>

                <AppText 
                  variant="h2" 
                  style={[styles.modalName, !selectedAccountDetails.isActive && { color: '#6B7280' }]}
                >
                  {selectedAccountDetails.displayName || selectedAccountDetails.fullName || selectedAccountDetails.email}
                </AppText>
                <AppText variant="caption" color={colors.mediumGrey} style={styles.modalEmail}>
                  {selectedAccountDetails.email}
                </AppText>

                <View style={styles.credBox}>
                  <Pressable style={styles.credRow} onPress={() => handleCopySingle('Email', selectedAccountDetails.email)}>
                    <View style={styles.credRowHeader}>
                      <AppText variant="small" color={colors.mediumGrey}>
                        Email{copiedField === 'Email' && <AppText variant="small" color={colors.success}> (Copied!)</AppText>}
                      </AppText>
                      <Feather name="copy" size={12} color={copiedField === 'Email' ? colors.success : colors.mediumGrey} />
                    </View>
                    <AppText variant="bodyBold" style={styles.credVal}>{selectedAccountDetails.email}</AppText>
                  </Pressable>
                  <Divider />
                  <Pressable style={styles.credRow} onPress={() => handleCopySingle('Code', selectedAccountDetails.verificationCode)}>
                    <View style={styles.credRowHeader}>
                      <AppText variant="small" color={colors.mediumGrey}>
                        Verification Code{copiedField === 'Code' && <AppText variant="small" color={colors.success}> (Copied!)</AppText>}
                      </AppText>
                      <Feather name="copy" size={12} color={copiedField === 'Code' ? colors.success : colors.mediumGrey} />
                    </View>
                    <AppText variant="h3" color={colors.navyBlue} style={styles.credVal}>
                      {selectedAccountDetails.verificationCode}
                    </AppText>
                  </Pressable>
                  <Divider />
                  <Pressable style={styles.credRow} onPress={() => handleCopySingle('Password', selectedAccountDetails.password)}>
                    <View style={styles.credRowHeader}>
                      <AppText variant="small" color={colors.mediumGrey}>
                        Password{copiedField === 'Password' && <AppText variant="small" color={colors.success}> (Copied!)</AppText>}
                      </AppText>
                      <Feather name="copy" size={12} color={copiedField === 'Password' ? colors.success : colors.mediumGrey} />
                    </View>
                    <AppText variant="bodyBold" style={styles.credVal}>{selectedAccountDetails.password}</AppText>
                  </Pressable>
                  <Divider />
                  <View style={styles.credRow}>
                    <View style={styles.credRowHeader}>
                      <AppText variant="small" color={colors.mediumGrey}>Role</AppText>
                    </View>
                    <AppText variant="bodyBold" color={roleColor(selectedAccountDetails.role)} style={styles.credVal}>
                      {ROLES[selectedAccountDetails.role]?.label || selectedAccountDetails.role}
                    </AppText>
                  </View>
                  <Divider />
                  <View style={styles.credRow}>
                    <View style={styles.credRowHeader}>
                      <AppText variant="small" color={colors.mediumGrey}>Status</AppText>
                    </View>
                    <AppText variant="bodyBold" color={!selectedAccountDetails.isActive ? '#EF4444' : selectedAccountDetails.role === 'admin' || selectedAccountDetails.isOnboarded ? colors.success : colors.warning} style={styles.credVal}>
                      {!selectedAccountDetails.isActive ? 'Inactive / Archived' : selectedAccountDetails.role === 'admin' ? 'Active' : selectedAccountDetails.isOnboarded ? 'Onboarded' : 'Pending Onboarding'}
                    </AppText>
                  </View>
                </View>

                <View style={{ gap: spacing.sm }}>
                  <Pressable style={styles.copyBtn} onPress={handleCopy}>
                    <Feather name={copied ? 'check-circle' : 'copy'} size={18} color={copied ? colors.success : colors.navyBlue} />
                    <AppText variant="bodyBold" color={copied ? colors.success : colors.navyBlue} style={{ marginLeft: spacing.sm }}>
                      {copied ? 'Copied All' : 'Copy All Credentials'}
                    </AppText>
                  </Pressable>

                  <Pressable 
                    style={[
                      styles.actionBtn, 
                      selectedAccountDetails.isActive ? styles.deactivateBtn : styles.reactivateBtn
                    ]} 
                    onPress={() => handleToggleActive(selectedAccountDetails)}
                  >
                    <Feather 
                      name={selectedAccountDetails.isActive ? 'user-x' : 'user-check'} 
                      size={18} 
                      color={colors.white} 
                    />
                    <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.sm }}>
                      {selectedAccountDetails.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                    </AppText>
                  </Pressable>
                </View>
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
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  filterTabActive: {
    backgroundColor: colors.navyBlue,
    ...shadows.subtle,
  },
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
  credRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  deactivateBtn: {
    backgroundColor: '#EF4444',
  },
  reactivateBtn: {
    backgroundColor: '#10B981',
  },
});
