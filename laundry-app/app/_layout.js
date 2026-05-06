import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import useLaundryStore from '../src/store/useLaundryStore';
import { COLORS } from '../src/constants/theme';

export default function RootLayout() {
  const { bootstrapAsync } = useLaundryStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await bootstrapAsync();
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
