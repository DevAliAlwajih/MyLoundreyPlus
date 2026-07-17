import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { initI18n } from '../i18n'; // Bootstrap i18n

// Use existing colors if present or define primary
const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa'
};

const queryClient = new QueryClient();

export default function RootLayout() {
  const checkAuthStatus = useAuthStore((s) => s.checkAuthStatus);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const init = async () => {
      await initI18n();
      // Check auth logic on boot
      await checkAuthStatus();
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    console.log('[RootLayout Auth Check] isReady:', isReady, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'segments:', segments);
    if (!isReady || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isIndex = segments.length === 0 || segments[0] === 'index';

    console.log('[RootLayout Auth Check] inAuthGroup:', inAuthGroup, 'isIndex:', isIndex);

    if (isAuthenticated && (inAuthGroup || isIndex)) {
      console.log('[RootLayout Auth Check] -> Redirecting to /(app)/dashboard');
      router.replace('/(app)/dashboard');
    } else if (!isAuthenticated && !inAuthGroup) {
      console.log('[RootLayout Auth Check] -> Redirecting to /(auth)/welcome');
      router.replace('/(auth)/welcome');
    } else {
      console.log('[RootLayout Auth Check] -> No action taken');
    }
  }, [isAuthenticated, isReady, isLoading, segments]);

  if (!isReady || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </QueryClientProvider>
  );
}
