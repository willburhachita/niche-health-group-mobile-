import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

export const Input = ({ label, value, onChangeText, placeholder, error, icon, secureTextEntry, multiline, editable = true, style, keyboardType, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, multiline && styles.multilineWrapper, error && styles.errorBorder, !editable && styles.disabled]}>
        {icon && <Feather name={icon} size={20} color={colors.mediumGrey} style={styles.icon} />}
        <TextInput
          style={[styles.input, multiline && styles.multiline, icon && { paddingLeft: 0 }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mediumGrey}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          keyboardType={keyboardType}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: { ...typography.caption, color: colors.darkGrey, marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.white,
  },
  icon: { marginRight: spacing.md },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.black,
    height: '100%',
  },
  multilineWrapper: { height: 'auto', minHeight: 100 },
  multiline: { height: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  errorBorder: { borderColor: colors.error },
  errorText: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
  disabled: { backgroundColor: colors.offWhite },
});
