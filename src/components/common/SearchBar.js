import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { radius } from '../../constants/radius';

export const SearchBar = ({ value, onChangeText, placeholder = 'Search...', onFocus, onBlur, style }) => {
  const [text, setText] = useState(value || '');

  const handleChange = (val) => {
    setText(val);
    onChangeText && onChangeText(val);
  };

  const handleClear = () => {
    setText('');
    onChangeText && onChangeText('');
  };

  return (
    <View style={[styles.container, style]}>
      <Feather name="search" size={16} color={colors.mediumGrey} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mediumGrey}
        onFocus={onFocus}
        onBlur={onBlur}
        returnKeyType="search"
      />
      {text.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <Feather name="x-circle" size={16} color={colors.mediumGrey} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.black,
    height: '100%',
  },
});
