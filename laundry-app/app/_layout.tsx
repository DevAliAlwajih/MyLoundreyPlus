import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { initI18n } from '../i18n'; // Bootstrap i18n

import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Use existing colors if present or define primary
const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa'
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Keep cached data fresh for 5 mins
      gcTime: 1000 * 60 * 60 * 24, // Keep cached data in memory for offline use
      networkMode: 'offlineFirst',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

export default function RootLayout() {
  const checkAuthStatus = useAuthStore((s) => s.checkAuthStatus);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();


  useEffect(() => {
    const init = async () => {
      try {
        await initI18n();
        await useThemeStore.getState().initTheme();
        await checkAuthStatus();
      } catch (error) {
        console.error('[RootLayout] Error during initialization:', error);
        useAuthStore.setState({ isLoading: false, isAuthenticated: false });
      } finally {
        setIsReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    console.log('[RootLayout Auth Check] isReady:', isReady, 'isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'segments:', segments);
    if (!isReady || isLoading) return;

    const stringSegments = segments as string[];
    const inAuthGroup = stringSegments[0] === '(auth)';
    const isIndex = stringSegments.length === 0 || stringSegments[0] === 'index';

    const isPreviewMode = useAuthStore.getState().isPreviewMode;

    console.log('[RootLayout Auth Check] inAuthGroup:', inAuthGroup, 'isIndex:', isIndex, 'isPreviewMode:', isPreviewMode);

    // Clear preview mode when user navigates away from auth group
    if (!inAuthGroup && isPreviewMode) {
      useAuthStore.getState().setPreviewMode(false);
    }

    if (isAuthenticated && (inAuthGroup || isIndex) && !isPreviewMode) {
      console.log('[RootLayout Auth Check] -> Redirecting to /(app)/dashboard');
      router.replace('/(app)/dashboard');
    } else if (!isAuthenticated && !inAuthGroup) {
      console.log('[RootLayout Auth Check] -> Redirecting to /(auth)/login');
      router.replace('/(auth)/login');
    } else {
      console.log('[RootLayout Auth Check] -> No action taken', isPreviewMode ? '(preview mode)' : '');
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="conversation-modal/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
