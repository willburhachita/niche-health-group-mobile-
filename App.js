import React from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { AuthProvider } from './src/hooks/useAuth';
import { AlertProvider } from './src/components/common/CustomAlert';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/constants/colors';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL);

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.navyBlue} />
      </View>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <AlertProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
