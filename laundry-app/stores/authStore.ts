import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.myloundreyplus.com/api/v1';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'laundry' | 'customer' | 'admin';
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (userData: User, access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateFullName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while we check SecureStore

  login: async (userData: User, access: string, refresh: string) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));

    set({
      user: userData,
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  refreshAccessToken: async () => {
    try {
      const currentRefreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!currentRefreshToken) throw new Error('No refresh token available');

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: currentRefreshToken,
      });

      if (response.data?.success && response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        await SecureStore.setItemAsync('accessToken', accessToken);
        // Sometimes APIs don't return a new refresh token if the old one is still valid
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }

        set({
          accessToken,
          refreshToken: newRefreshToken || currentRefreshToken,
        });
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Failed to refresh access token', error);
      get().logout();
      throw error;
    }
  },

  setTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('accessToken', access);
    await SecureStore.setItemAsync('refreshToken', refresh);
    set({ accessToken: access, refreshToken: refresh });
  },

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      const [accessToken, refreshToken, userStr] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('user'),
      ]);

      if (accessToken && userStr) {
        const user = JSON.parse(userStr) as User;
        set({
          accessToken,
          refreshToken,
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error checking auth status', error);
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  updateFullName: async (name: string) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, fullName: name };
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  updateEmail: async (email: string) => {
    const { user } = get();
    if (!user) return;
    const updatedUser = { ...user, email };
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));
