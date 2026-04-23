import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { getInitials } from '../../utils/formatters';

export const Avatar = ({ name, size = 40, imageUrl, showOnline, onlineStatus = 'offline', style }) => {
  const initials = getInitials(name || '?');

  const sizeStyles = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const fontSize = size < 32 ? 10 : size < 48 ? 13 : size < 64 ? 17 : 22;
  const dotSize = size < 40 ? 8 : 10;
  const dotOffset = size < 40 ? 0 : 2;

  const statusColor =
    onlineStatus === 'online' ? colors.success :
    onlineStatus === 'away' ? colors.warning :
    onlineStatus === 'dnd' ? colors.error :
    colors.lightGrey;

  return (
    <View style={[styles.container, sizeStyles, style]}>
      <View style={[styles.circle, sizeStyles, { backgroundColor: colors.navyLight }]}>
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>
      {showOnline && onlineStatus !== 'offline' && (
        <View style={[styles.dot, {
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: statusColor,
          right: dotOffset,
          bottom: dotOffset,
        }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: colors.navyBlue, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  dot: { position: 'absolute', borderWidth: 2, borderColor: colors.white },
});
