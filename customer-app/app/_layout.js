import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useAuthStore from '../src/store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const { bootstrapAsync } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Load token on app start safely
  useEffect(() => {
    const init = async () => {
      await bootstrapAsync();
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
