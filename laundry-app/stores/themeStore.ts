import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { lightColors, darkColors, ThemeColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isInitialized: boolean;
  initTheme: () => Promise<void>;
  toggleTheme: () => Promise<void>;
  setTheme: (mode: ThemeMode) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeMode: 'light',
  colors: lightColors,
  isInitialized: false,

  initTheme: async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync('appTheme');
      if (storedTheme === 'dark' || storedTheme === 'light') {
        set({
          themeMode: storedTheme as ThemeMode,
          colors: storedTheme === 'dark' ? darkColors : lightColors,
          isInitialized: true,
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize theme', error);
      set({ isInitialized: true }); // Still mark as initialized to prevent blocking app load
    }
  },

  toggleTheme: async () => {
    const newMode = get().themeMode === 'light' ? 'dark' : 'light';
    const newColors = newMode === 'dark' ? darkColors : lightColors;
    
    // Optimistically update state
    set({ themeMode: newMode, colors: newColors });
    
    // Persist to storage
    try {
      await SecureStore.setItemAsync('appTheme', newMode);
    } catch (error) {
      console.error('Failed to save theme to SecureStore', error);
    }
  },

  setTheme: async (mode: ThemeMode) => {
    const newColors = mode === 'dark' ? darkColors : lightColors;
    set({ themeMode: mode, colors: newColors });
    try {
      await SecureStore.setItemAsync('appTheme', mode);
    } catch (error) {
      console.error('Failed to save theme to SecureStore', error);
    }
  },
}));
