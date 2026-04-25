import React from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { shadows } from '../../constants/shadows';

export const MessageActionBar = ({ message, isOwn, onClose, onEdit, onDeleteForMe, onUnsend }) => {
  const isEditable = isOwn && message?.type === 'text';

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {isEditable && (
          <Pressable style={styles.action} onPress={onEdit}>
            <Feather name="edit-2" size={20} color={colors.navyBlue} />
            <Text style={styles.label}>Edit</Text>
          </Pressable>
        )}
        <Pressable style={styles.action} onPress={onDeleteForMe}>
          <Feather name="trash" size={20} color={colors.warning} />
          <Text style={[styles.label, { color: colors.warning }]}>Delete for me</Text>
        </Pressable>
        {isOwn && (
          <Pressable style={styles.action} onPress={onUnsend}>
            <Feather name="trash-2" size={20} color={colors.error} />
            <Text style={[styles.label, { color: colors.error }]}>Unsend</Text>
          </Pressable>
        )}
        <Pressable style={styles.action} onPress={onClose}>
          <Feather name="x" size={20} color={colors.mediumGrey} />
          <Text style={[styles.label, { color: colors.mediumGrey }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
    ...shadows.card,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  action: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: colors.navyBlue,
    fontWeight: '500',
  },
});
