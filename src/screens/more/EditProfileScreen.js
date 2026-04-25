import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { getCurrentUser } from '../../data/mockUsers';
import { useAuth } from '../../hooks/useAuth';

export default function EditProfileScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const mockUser = getCurrentUser();
  const displayName = currentAccount?.displayName || mockUser.displayName;
  // Parse surname/firstName from fullName ("Surname FirstName") or fall back to mockUser
  const nameParts = currentAccount?.fullName?.split(' ') || [];
  const [firstName, setFirstName] = useState(nameParts[1] || mockUser.firstName);
  const [lastName, setLastName] = useState(nameParts[0] || mockUser.lastName);
  const [customStatus, setCustomStatus] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
        <AppText variant="h3">Edit Profile</AppText>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.navyBlue}>Save</AppText>
        </Pressable>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.avatarSection}>
          <Avatar name={displayName} size={80} />
          <AppText variant="bodyBold" color={colors.navyBlue} style={{ marginTop: spacing.md }}>Change Photo</AppText>
        </Pressable>

        <Input label="First Name" value={firstName} onChangeText={setFirstName} placeholder="First name" />
        <Input label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Last name" />
        <Input label="Custom Status" value={customStatus} onChangeText={setCustomStatus} placeholder="Set a status message..." icon="smile" />
        <Input label="Email" value={currentAccount?.email || mockUser.email} editable={false} icon="mail" />
        <Input label="Phone" value={currentAccount?.phone || mockUser.phone} editable={false} icon="phone" />
        <Input label="Department" value={mockUser.department} editable={false} icon="briefcase" />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  content: { padding: spacing.xl },
  avatarSection: { alignItems: 'center', marginBottom: spacing.xxl },
});
