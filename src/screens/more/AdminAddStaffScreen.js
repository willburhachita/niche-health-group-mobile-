import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { shadows } from '../../constants/shadows';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Divider } from '../../components/common/Divider';
import { useAlert } from '../../components/common/CustomAlert';
import {
  ROLES,
  generateStrongPassword,
  generateVerificationCode,
} from '../../data/mockAuth';

const ROLE_OPTIONS = [
  { key: 'admin', icon: 'shield', color: colors.error },
  { key: 'moderator', icon: 'star', color: colors.warning },
  { key: 'member', icon: 'user', color: colors.navyBlue },
];

export default function AdminAddStaffScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const alert = useAlert();
  const createStaffAccount = useMutation(api.auth.createStaffAccount);
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const isValid = email.includes('@') && email.includes('.');

  const handleCreateAccount = async () => {
    const pw = generateStrongPassword(14);
    const code = generateVerificationCode();
    setGeneratedPassword(pw);
    setGeneratedCode(code);
    setIsCreating(true);
    try {
      const result = await createStaffAccount({
        email: email.trim().toLowerCase(),
        role: selectedRole,
        password: pw,
        verificationCode: code,
        createdBy: currentAccount?.email || 'admin',
      });
      if (result.success) {
        setShowModal(true);
      } else {
        alert({ type: 'error', title: 'Error', message: result.error || 'Failed to create account' });
      }
    } catch (e) {
      alert({ type: 'error', title: 'Error', message: 'Something went wrong. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async () => {
    const text = `Email: ${email}\nVerification Code: ${generatedCode}\nPassword: ${generatedPassword}\nRole: ${ROLES[selectedRole].label}`;
    await Clipboard.setStringAsync(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('Your NHL Connect Login Credentials');
    const body = encodeURIComponent(
      `Welcome to NHL Connect!\n\n` +
      `Here are your login credentials:\n\n` +
      `Email: ${email}\n` +
      `Verification Code: ${generatedCode}\n` +
      `Password: ${generatedPassword}\n` +
      `Role: ${ROLES[selectedRole].label}\n\n` +
      `Please download the app and sign in. You will be asked to complete your profile on first login.\n\n` +
      `— Niche Healthcare Administration`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleDone = () => {
    setShowModal(false);
    setEmail('');
    setSelectedRole('member');
    setGeneratedPassword('');
    setGeneratedCode('');
    setCopied(false);
  };

  const handleAddAnother = () => {
    setShowModal(false);
    setEmail('');
    setSelectedRole('member');
    setGeneratedPassword('');
    setGeneratedCode('');
    setCopied(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Add Staff</AppText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Staff Details */}
        <AppText variant="h2" style={styles.sectionTitle}>Staff Details</AppText>
        <AppText variant="caption" color={colors.darkGrey} style={styles.sectionSub}>
          Only an email is needed. The staff member will complete their profile during onboarding.
        </AppText>

        <AppText variant="bodyBold" style={styles.label}>Email Address</AppText>
        <Input
          placeholder="youremail@gmail.com"
          value={email}
          onChangeText={setEmail}
          icon="mail"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Divider style={styles.divider} />

        {/* Role Selection */}
        <AppText variant="h2" style={styles.sectionTitle}>Permission Level</AppText>
        <AppText variant="caption" color={colors.darkGrey} style={styles.sectionSub}>
          Choose the access level for this staff member
        </AppText>

        {ROLE_OPTIONS.map((opt) => {
          const role = ROLES[opt.key];
          const isSelected = selectedRole === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.roleCard, isSelected && styles.roleCardSelected]}
              onPress={() => setSelectedRole(opt.key)}
            >
              <View style={[styles.roleIcon, { backgroundColor: opt.color + '15' }]}>
                <Feather name={opt.icon} size={20} color={opt.color} />
              </View>
              <View style={styles.roleInfo}>
                <AppText variant="bodyBold">{role.label}</AppText>
                <AppText variant="caption" color={colors.darkGrey}>{role.description}</AppText>
              </View>
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          );
        })}

        <Divider style={styles.divider} />

        <Button
          label={isCreating ? 'Creating...' : 'Create Account'}
          onPress={handleCreateAccount}
          disabled={!isValid || isCreating}
          style={styles.createBtn}
        />

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      {/* ── Success Modal ─────────────────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.backdrop} onPress={() => {}}>
          <View style={styles.modalCard}>
            {/* Success Header */}
            <View style={styles.modalIconWrap}>
              <View style={styles.modalIconCircle}>
                <Feather name="check" size={28} color={colors.white} />
              </View>
            </View>
            <AppText variant="h2" style={styles.modalTitle}>Account Created</AppText>
            <AppText variant="caption" color={colors.darkGrey} style={styles.modalSub}>
              Share these credentials securely with the staff member
            </AppText>

            {/* Credentials */}
            <View style={styles.credentialBox}>
              <View style={styles.credRow}>
                <AppText variant="small" color={colors.mediumGrey}>Email</AppText>
                <AppText variant="bodyBold" style={styles.credValue}>{email}</AppText>
              </View>
              <Divider />
              <View style={styles.credRow}>
                <AppText variant="small" color={colors.mediumGrey}>Verification Code</AppText>
                <AppText variant="h3" color={colors.navyBlue} style={styles.credValue}>{generatedCode}</AppText>
              </View>
              <Divider />
              <View style={styles.credRow}>
                <AppText variant="small" color={colors.mediumGrey}>Password</AppText>
                <AppText variant="bodyBold" style={styles.credValue}>{generatedPassword}</AppText>
              </View>
              <Divider />
              <View style={styles.credRow}>
                <AppText variant="small" color={colors.mediumGrey}>Role</AppText>
                <AppText variant="bodyBold" color={colors.navyBlue} style={styles.credValue}>
                  {ROLES[selectedRole].label}
                </AppText>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalActionBtn} onPress={handleCopy}>
                <Feather name={copied ? 'check-circle' : 'copy'} size={20} color={copied ? colors.success : colors.navyBlue} />
                <AppText variant="bodyBold" color={copied ? colors.success : colors.navyBlue} style={{ marginLeft: spacing.sm }}>
                  {copied ? 'Copied' : 'Copy All'}
                </AppText>
              </Pressable>

              <Pressable style={[styles.modalActionBtn, styles.emailBtn]} onPress={handleSendEmail}>
                <Feather name="mail" size={20} color={colors.white} />
                <AppText variant="bodyBold" color={colors.white} style={{ marginLeft: spacing.sm }}>
                  Send via Email
                </AppText>
              </Pressable>
            </View>

            {/* Bottom */}
            <View style={styles.modalBottom}>
              <Pressable style={styles.modalSecondaryBtn} onPress={handleAddAnother}>
                <Feather name="plus" size={18} color={colors.navyBlue} />
                <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginLeft: spacing.xs }}>
                  Add Another
                </AppText>
              </Pressable>

              <Pressable style={styles.modalDoneBtn} onPress={handleDone}>
                <AppText variant="bodyBold" color={colors.darkGrey}>Done</AppText>
              </Pressable>
            </View>
          </View>
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
  scrollContent: { padding: spacing.base },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.xs },
  sectionSub: { marginBottom: spacing.base },
  label: { marginTop: spacing.md, marginBottom: spacing.xs },
  divider: { marginVertical: spacing.lg },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  roleCardSelected: {
    borderColor: colors.navyBlue,
    backgroundColor: colors.navyLight,
  },
  roleIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  roleInfo: { flex: 1 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: colors.lightGrey,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.navyBlue },
  radioDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: colors.navyBlue,
  },
  createBtn: { marginTop: spacing.sm },

  // ── Modal ──────────────────────────────────────────────────
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
  modalIconWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  modalSub: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  credentialBox: {
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
  credValue: { marginTop: 2 },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.navyBlue,
    backgroundColor: colors.white,
  },
  emailBtn: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  modalBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  modalDoneBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
