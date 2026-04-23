import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import DevicePendingScreen from '../screens/auth/DevicePendingScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import { colors } from '../constants/colors';

export default function RootNavigator() {
  const { isAuthenticated, isLoading, isDevicePending, needsOnboarding } = useAuth();

  const getContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.navyBlue} />
        </View>
      );
    }
    if (isDevicePending) return <DevicePendingScreen />;
    if (isAuthenticated && needsOnboarding) return <OnboardingScreen />;
    if (isAuthenticated) return <TabNavigator />;
    return <AuthNavigator />;
  };

  return (
    <NavigationContainer>
      {getContent()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
});
