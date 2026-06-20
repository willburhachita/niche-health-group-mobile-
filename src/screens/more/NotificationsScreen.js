import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { AppText } from '../../components/common/AppText';

export default function NotificationsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Feather name="chevron-left" size={24} color={colors.black} />
        </Pressable>
        <AppText variant="h3">Notifications</AppText>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.empty}>
        <Feather name="bell-off" size={40} color={colors.lightGrey} />
        <AppText variant="body" color={colors.mediumGrey} style={{ marginTop: spacing.md }}>
          No notifications yet
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGrey,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
