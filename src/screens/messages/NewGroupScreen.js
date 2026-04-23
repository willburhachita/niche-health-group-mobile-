import React, { useState } from 'react';
import { View, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../hooks/useAuth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Avatar } from '../../components/common/Avatar';
import { SearchBar } from '../../components/common/SearchBar';
import { Divider } from '../../components/common/Divider';

export default function NewGroupScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const currentUserId = currentAccount?.userId;
  const createConversation = useMutation(api.messages.createConversation);
  const allUsers = useQuery(api.users.listUsers) || [];
  const [groupName, setGroupName] = useState('');
  const [selected, setSelected] = useState([]);
  const staff = allUsers.filter(u => u.externalId !== currentUserId);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <AppText variant="bodyBold" color={colors.mediumGrey}>Cancel</AppText>
        </Pressable>
        <AppText variant="h3">New Group</AppText>
        <Pressable onPress={async () => {
          if (selected.length < 2) return;
          const convId = await createConversation({
            type: 'group',
            name: groupName || 'New Group',
            members: [currentUserId, ...selected],
          });
          navigation.replace('Chat', { conversationId: convId });
        }}>
          <AppText variant="bodyBold" color={selected.length >= 2 ? colors.navyBlue : colors.mediumGrey}>Create</AppText>
        </Pressable>
      </View>

      <View style={styles.nameInput}>
        <Feather name="users" size={20} color={colors.navyBlue} style={{ marginRight: spacing.md }} />
        <View style={styles.nameField}>
          <AppText variant="caption" color={colors.mediumGrey}>Group Name</AppText>
          <AppText variant="body">{groupName || 'Enter group name...'}</AppText>
        </View>
      </View>

      {selected.length > 0 && (
        <View style={styles.selectedRow}>
          {selected.map(id => {
            const u = staff.find(x => x.externalId === id);
            return u ? (
              <Pressable key={id} onPress={() => toggle(id)} style={styles.selectedChip}>
                <Avatar name={u.displayName} size={28} />
                <AppText variant="small" style={{ marginLeft: 4 }}>{u.firstName}</AppText>
                <Feather name="x" size={12} color={colors.mediumGrey} style={{ marginLeft: 2 }} />
              </Pressable>
            ) : null;
          })}
        </View>
      )}

      <SearchBar placeholder="Search staff..." />

      <FlatList
        data={staff}
        keyExtractor={item => item.externalId}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.externalId);
          return (
            <Pressable onPress={() => toggle(item.externalId)} style={styles.contactRow}>
              <Avatar name={item.displayName} size={40} showOnline onlineStatus={item.onlineStatus} />
              <View style={styles.contactInfo}>
                <AppText variant="bodyBold">{item.displayName}</AppText>
                <AppText variant="caption" color={colors.mediumGrey}>{item.department || item.staffRole}</AppText>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && <Feather name="check" size={14} color={colors.white} />}
              </View>
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <Divider type="avatarInset" />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: spacing.xxxl }}>
            <AppText variant="body" color={colors.mediumGrey}>No other staff available</AppText>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, height: 56, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  nameInput: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.lightGrey },
  nameField: { flex: 1 },
  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: spacing.sm },
  selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navyLight, borderRadius: radius.full, paddingRight: spacing.sm, paddingLeft: 2, paddingVertical: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  contactInfo: { flex: 1, marginLeft: spacing.md },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.lightGrey, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.navyBlue, borderColor: colors.navyBlue },
});
