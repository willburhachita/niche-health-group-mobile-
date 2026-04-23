import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { typography } from '../../constants/typography';
import { colors } from '../../constants/colors';

export const AppText = ({ children, variant = 'body', color, style, numberOfLines, ...props }) => {
  const typeStyle = typography[variant] || typography.body;
  return (
    <Text
      style={[typeStyle, { color: color || colors.black }, style]}
      numberOfLines={numberOfLines}
      {...props}
    >
      {children}
    </Text>
  );
};
