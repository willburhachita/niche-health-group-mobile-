import React, { useState } from 'react';
import {
  View, FlatList, Pressable, StyleSheet, Modal,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../hooks/useAuth';

export default function DepartmentsScreen({ navigation }) {
  const { currentAccount } = useAuth();
  const canManage = currentAccount?.role === 'admin' || currentAccount?.role === 'moderator';

  const departments = useQuery(api.departments.list) ?? [];
  const allStaff = useQuery(api.departments.listAllStaff) ?? [];

  const createDept = useMutation(api.departments.create);
  const removeDept = useMutation(api.departments.remove);
  const assignUser = useMutation(api.departments.assignUser);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [selectedDept, setSelectedDept] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) { setCreateError('Department name is required.'); return; }
    setCreating(true);
    setCreateError('');
    try {
      await createDept({
        name: newName.trim(),
        description: newDesc.trim() || undefined,
        createdBy: currentAccount?.userId || 'unknown',
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (e) {
      setCreateError(e.message || 'Failed to create department.');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignMember = async (externalId) => {
    if (!selectedDept) return;
    await assignUser({ externalId, department: selectedDept.name });
  };

  const membersInSelected = selectedDept
    ? allStaff.filter(s => s.department === selectedDept.name)
    : [];

  const staffNotInSelected = selectedDept
    ? allStaff.filter(s => s.department !== selectedDept.name)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Departments</AppText>
        {canManage ? (
          <Pressable onPress={() => setShowCreate(true)} hitSlop={12}>
            <Feather name="plus" size={22} color={colors.navyBlue} />
          </Pressable>
        ) : <View style={{ width: 24 }} />}
      </View>

      {departments.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="grid" size={36} color={colors.lightGrey} />
          <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md, textAlign: 'center' }}>
            No departments yet.{canManage ? '\nTap + to create one.' : ''}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={item => item._id}
          contentContainerStyle={{ padding: spacing.base }}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.sm }}>
              <Pressable
                style={styles.row}
                onPress={() => { setSelectedDept(item); setShowMembers(true); }}
              >
                <View style={styles.iconCircle}>
                  <Feather name="grid" size={18} color={colors.navyBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold">{item.name}</AppText>
                  {item.description ? (
                    <AppText variant="caption" color={colors.darkGrey}>{item.description}</AppText>
                  ) : null}
                  <AppText variant="small" color={colors.mediumGrey} style={{ marginTop: spacing.xs }}>
                    {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
                    {item.headName ? ` · Lead: ${item.headName}` : ''}
                  </AppText>
                </View>
                <Feather name="chevron-right" size={16} color={colors.lightGrey} />
              </Pressable>
            </Card>
          )}
        />
      )}

      {/* Create Department Modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">New Department</AppText>
              <Pressable onPress={() => setShowCreate(false)} hitSlop={12}>
                <Feather name="x" size={20} color={colors.darkGrey} />
              </Pressable>
            </View>
            <AppText variant="small" color={colors.mediumGrey} style={{ marginBottom: spacing.sm }}>Name</AppText>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="e.g. Dialysis, ICU, General"
              placeholderTextColor={colors.lightGrey}
            />
            <AppText variant="small" color={colors.mediumGrey} style={{ marginBottom: spacing.sm }}>Description (optional)</AppText>
            <TextInput
              style={[styles.input, { height: 72 }]}
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Brief description"
              placeholderTextColor={colors.lightGrey}
              multiline
            />
            {createError ? <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.sm }}>{createError}</AppText> : null}
            <Button label={creating ? 'Creating...' : 'Create Department'} disabled={creating} onPress={handleCreate} />
          </View>
        </View>
      </Modal>

      {/* Members Modal */}
      <Modal visible={showMembers} transparent animationType="slide" onRequestClose={() => setShowMembers(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">{selectedDept?.name}</AppText>
              <Pressable onPress={() => setShowMembers(false)} hitSlop={12}>
                <Feather name="x" size={20} color={colors.darkGrey} />
              </Pressable>
            </View>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.base }}>
              {membersInSelected.length} member{membersInSelected.length !== 1 ? 's' : ''}
            </AppText>
            <ScrollView style={{ flex: 1 }}>
              {membersInSelected.length === 0 ? (
                <AppText variant="body" color={colors.mediumGrey} style={{ marginBottom: spacing.base }}>No members yet.</AppText>
              ) : membersInSelected.map(m => (
                <View key={m.externalId} style={styles.memberRow}>
                  <Avatar name={m.displayName} size={36} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <AppText variant="bodyBold">{m.displayName}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>{m.staffRole}</AppText>
                  </View>
                  {canManage && (
                    <Pressable
                      hitSlop={8}
                      onPress={() => assignUser({ externalId: m.externalId, department: 'General' })}
                    >
                      <Feather name="user-minus" size={16} color={colors.error} />
                    </Pressable>
                  )}
                </View>
              ))}
            </ScrollView>
            {canManage && (
              <Button
                label="Add Member"
                variant="secondary"
                style={{ marginTop: spacing.base }}
                onPress={() => { setShowMembers(false); setShowAddMember(true); }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showAddMember} transparent animationType="slide" onRequestClose={() => setShowAddMember(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Add to {selectedDept?.name}</AppText>
              <Pressable onPress={() => { setShowAddMember(false); setShowMembers(true); }} hitSlop={12}>
                <Feather name="x" size={20} color={colors.darkGrey} />
              </Pressable>
            </View>
            <AppText variant="caption" color={colors.mediumGrey} style={{ marginBottom: spacing.base }}>
              Select staff to add
            </AppText>
            <ScrollView>
              {staffNotInSelected.map(s => (
                <Pressable
                  key={s.externalId}
                  style={styles.memberRow}
                  onPress={async () => {
                    await handleAssignMember(s.externalId);
                    setShowAddMember(false);
                    setShowMembers(true);
                  }}
                >
                  <Avatar name={s.displayName} size={36} />
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <AppText variant="bodyBold">{s.displayName}</AppText>
                    <AppText variant="small" color={colors.mediumGrey}>{s.staffRole} · {s.department}</AppText>
                  </View>
                  <Feather name="plus" size={16} color={colors.navyBlue} />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxxl },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.navyLight, alignItems: 'center',
    justifyContent: 'center', marginRight: spacing.md,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white, borderRadius: radius.xl,
    padding: spacing.xl, marginHorizontal: spacing.sm,
    marginBottom: spacing.base,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.base,
  },
  input: {
    borderWidth: 1, borderColor: colors.lightGrey, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    fontSize: 14, color: colors.black, marginBottom: spacing.base,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.offWhite,
  },
});
