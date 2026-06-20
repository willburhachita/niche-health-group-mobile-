import React, { useState, useRef } from 'react';
import { View, Pressable, StyleSheet, Image, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { typography } from '../../constants/typography';
import { AppText } from '../../components/common/AppText';
import { Button } from '../../components/common/Button';
import { TITLE_OPTIONS } from '../../utils/authHelpers';
import { COUNTRY_CODES, DEFAULT_COUNTRY } from '../../data/countryCodes';
import { useAuth } from '../../hooks/useAuth';

export default function OnboardingScreen() {
  const { completeOnboarding, currentAccount } = useAuth();

  // Pre-fill from existing account data
  const nameParts = currentAccount?.fullName?.split(' ') || [];
  const [selectedTitle, setSelectedTitle] = useState(currentAccount?.title || '');
  const [surname, setSurname] = useState(nameParts[0] || '');
  const [firstName, setFirstName] = useState(nameParts[1] || '');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [error, setError] = useState('');
  const firstNameRef = useRef(null);
  const phoneRef = useRef(null);

  // Determine which fields are still missing
  const needsTitle = !currentAccount?.title;
  const needsName = !currentAccount?.fullName;
  const needsPhone = !currentAccount?.phone;

  const fullPhone = `${selectedCountry.dial}${phoneNumber.trim()}`;
  const isValid = selectedTitle && surname.trim().length >= 2 && firstName.trim().length >= 1 && phoneNumber.trim().length >= 6;

  // Display format: "Dr. Hachita W."
  const getDisplayName = () => {
    const s = surname.trim();
    const f = firstName.trim();
    if (!selectedTitle || !s) return '';
    const initial = f ? ` ${f.charAt(0).toUpperCase()}.` : '';
    return `${selectedTitle}. ${s}${initial}`;
  };

  const handleContinue = () => {
    if (!selectedTitle) {
      setError('Please select a title');
      return;
    }
    if (surname.trim().length < 2) {
      setError('Please enter your surname');
      return;
    }
    if (firstName.trim().length < 1) {
      setError('Please enter your first name');
      return;
    }
    if (phoneNumber.trim().length < 6) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    const fullName = `${surname.trim()} ${firstName.trim()}`;
    completeOnboarding(selectedTitle, fullName, fullPhone);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <AppText variant="h1" style={styles.title}>
            Complete Your Profile
          </AppText>
          <AppText variant="body" color={colors.darkGrey} style={styles.subtitle}>
            {needsTitle || needsName
              ? 'Let us know how you would like to be addressed. This will be shown on your profile.'
              : 'Just a few more details to complete your profile.'}
          </AppText>

          {/* Title Selection — only show if missing */}
          {needsTitle ? (
            <>
              <AppText variant="bodyBold" style={styles.label}>Title</AppText>
              <View style={styles.titleGrid}>
                {TITLE_OPTIONS.map((t) => {
                  const isSelected = selectedTitle === t;
                  return (
                    <Pressable
                      key={t}
                      style={[styles.titlePill, isSelected && styles.titlePillSelected]}
                      onPress={() => { setSelectedTitle(t); setError(''); }}
                    >
                      <AppText
                        variant="bodyBold"
                        color={isSelected ? colors.white : colors.navyBlue}
                      >
                        {t}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {/* Surname — only show if name is missing */}
          {needsName ? (
            <>
              <AppText variant="bodyBold" style={styles.label}>Surname</AppText>
              <TextInput
                style={styles.underlineInput}
                placeholder="e.g. Hachita"
                placeholderTextColor={colors.mediumGrey}
                value={surname}
                onChangeText={(t) => { setSurname(t); setError(''); }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => firstNameRef.current?.focus()}
              />

              <AppText variant="bodyBold" style={styles.label}>First Name</AppText>
              <TextInput
                ref={firstNameRef}
                style={styles.underlineInput}
                placeholder="e.g. Wilbur"
                placeholderTextColor={colors.mediumGrey}
                value={firstName}
                onChangeText={(t) => { setFirstName(t); setError(''); }}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
            </>
          ) : null}

          {/* Phone Number — only show if missing */}
          {needsPhone ? (
            <>
              <AppText variant="bodyBold" style={styles.label}>Phone Number</AppText>
              <View style={styles.phoneRow}>
                <Pressable
                  style={styles.countryCodeBtn}
                  onPress={() => { setShowCountryPicker(true); setCountrySearch(''); }}
                >
                  <AppText variant="bodyBold" color={colors.navyBlue}>{selectedCountry.code}</AppText>
                  <AppText variant="body" style={{ marginLeft: spacing.xs }}>{selectedCountry.dial}</AppText>
                  <Feather name="chevron-down" size={16} color={colors.mediumGrey} style={{ marginLeft: spacing.xs }} />
                </Pressable>
                <TextInput
                  ref={phoneRef}
                  style={styles.phoneInput}
                  placeholder="97 1234567"
                  placeholderTextColor={colors.mediumGrey}
                  value={phoneNumber}
                  onChangeText={(t) => { setPhoneNumber(t); setError(''); }}
                  keyboardType="phone-pad"
                  returnKeyType="done"
                />
              </View>
            </>
          ) : null}

          {/* Country Code Picker Modal */}
          <Modal visible={showCountryPicker} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <AppText variant="h2">Select Country</AppText>
                <Pressable onPress={() => setShowCountryPicker(false)} hitSlop={12}>
                  <Feather name="x" size={24} color={colors.black} />
                </Pressable>
              </View>
              <View style={styles.modalSearch}>
                <Feather name="search" size={18} color={colors.mediumGrey} />
                <TextInput
                  style={styles.modalSearchInput}
                  placeholder="Search country..."
                  placeholderTextColor={colors.mediumGrey}
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  autoFocus
                />
              </View>
              <FlatList
                data={COUNTRY_CODES.filter((c) => {
                  if (!countrySearch) return true;
                  const q = countrySearch.toLowerCase();
                  return c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
                })}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.countryRow, item.code === selectedCountry.code && styles.countryRowSelected]}
                    onPress={() => { setSelectedCountry(item); setShowCountryPicker(false); }}
                  >
                    <AppText variant="bodyBold" style={styles.countryCode}>{item.code}</AppText>
                    <AppText variant="body" style={{ flex: 1 }}>{item.name}</AppText>
                    <AppText variant="body" color={colors.mediumGrey}>{item.dial}</AppText>
                    {item.code === selectedCountry.code && (
                      <Feather name="check" size={18} color={colors.success} style={{ marginLeft: spacing.sm }} />
                    )}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                keyboardShouldPersistTaps="handled"
              />
            </SafeAreaView>
          </Modal>

          {error ? (
            <AppText variant="caption" color={colors.error} style={styles.error}>
              {error}
            </AppText>
          ) : null}

          {/* Preview */}
          {getDisplayName() ? (
            <View style={styles.previewBox}>
              <AppText variant="caption" color={colors.mediumGrey}>
                You will appear as
              </AppText>
              <AppText variant="h2" color={colors.navyBlue} style={styles.previewName}>
                {getDisplayName()}
              </AppText>
            </View>
          ) : null}

          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!isValid}
            style={styles.continueBtn}
          />

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  logo: { width: 200, height: 200, marginBottom: spacing.sm, marginTop: spacing.base },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { textAlign: 'center', marginBottom: spacing.xxl, maxWidth: 300 },
  label: { alignSelf: 'flex-start', marginBottom: spacing.xs, marginTop: spacing.md },
  titleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    width: '100%',
  },
  titlePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.navyBlue,
    backgroundColor: colors.white,
  },
  titlePillSelected: {
    backgroundColor: colors.navyBlue,
    borderColor: colors.navyBlue,
  },
  underlineInput: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lightGrey,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.black,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.sm,
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lightGrey,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    marginRight: spacing.sm,
  },
  phoneInput: {
    flex: 1,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.lightGrey,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.black,
    fontSize: 17,
  },
  modalContainer: { flex: 1, backgroundColor: colors.white },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.base,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.black,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  countryRowSelected: {
    backgroundColor: colors.navyLight,
  },
  countryCode: {
    width: 36,
    marginRight: spacing.md,
    color: colors.navyBlue,
  },
  separator: {
    height: 1,
    backgroundColor: colors.offWhite,
    marginHorizontal: spacing.xl,
  },
  error: { marginTop: spacing.xs, alignSelf: 'flex-start' },
  previewBox: {
    width: '100%',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.navyLight,
    borderRadius: radius.lg,
    marginTop: spacing.md,
  },
  previewName: { marginTop: spacing.xs },
  continueBtn: { width: '100%', marginTop: spacing.xl },
});
