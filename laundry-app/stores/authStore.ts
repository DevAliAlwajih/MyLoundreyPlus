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

export interface RememberedAccount {
  email: string;
  fullName: string;
  laundryName?: string;
  phone?: string;
  logoUrl?: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  rememberedAccount: RememberedAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPreviewMode: boolean;

  // Actions
  login: (userData: User, access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  setTokens: (access: string, refresh: string) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateFullName: (name: string) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updateRememberedAccount: (data: Partial<RememberedAccount>) => Promise<void>;
  removeRememberedAccount: () => Promise<void>;
  setPreviewMode: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  rememberedAccount: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while we check SecureStore
  isPreviewMode: false,

  login: async (userData: User, access: string, refresh: string) => {
    try {
      await SecureStore.setItemAsync('accessToken', access);
      await SecureStore.setItemAsync('refreshToken', refresh);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      const remAcc: RememberedAccount = {
        email: userData.email,
        fullName: userData.fullName,
        // laundryName and logoUrl might be added here later if returned by backend
      };
      await SecureStore.setItemAsync('remembered_account', JSON.stringify(remAcc));
      set({ rememberedAccount: remAcc });
    } catch (error) {
      console.error('[authStore.login] SecureStore save FAILED:', error);
      throw error; // Re-throw so the caller (useAuth) can catch it
    }

    set({
      user: userData,
      accessToken: access,
      refreshToken: refresh,
      isAuthenticated: true,
      isPreviewMode: false, // Always clear preview mode on real login
    });
    console.log('[authStore.login] SecureStore save complete, isAuthenticated set to true');
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('biometric_enabled');
    // Note: We intentionally do NOT delete 'remembered_account' here
    
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

      // الباكند يُرجع {accessToken, refreshToken, user} مباشرة من الجذر — بدون غلاف {success, data}
      const { accessToken, refreshToken: newRefreshToken } = response.data;

      if (!accessToken) {
        throw new Error('No accessToken in refresh response');
      }

      await SecureStore.setItemAsync('accessToken', accessToken);
      if (newRefreshToken) {
        await SecureStore.setItemAsync('refreshToken', newRefreshToken);
      }

      set({
        accessToken,
        refreshToken: newRefreshToken || currentRefreshToken,
      });
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
      const [accessToken, refreshToken, userStr, rememberedAccountStr] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('refreshToken'),
        SecureStore.getItemAsync('user'),
        SecureStore.getItemAsync('remembered_account'),
      ]);

      if (rememberedAccountStr) {
        try {
          set({ rememberedAccount: JSON.parse(rememberedAccountStr) });
        } catch (e) {
          console.error('Failed to parse remembered_account', e);
        }
      }

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

  updateRememberedAccount: async (data: Partial<RememberedAccount>) => {
    const { rememberedAccount } = get();
    if (!rememberedAccount) return;
    
    const updated = { ...rememberedAccount, ...data };
    await SecureStore.setItemAsync('remembered_account', JSON.stringify(updated));
    set({ rememberedAccount: updated });
  },

  removeRememberedAccount: async () => {
    await SecureStore.deleteItemAsync('remembered_account');
    set({ rememberedAccount: null });
  },

  setPreviewMode: (val: boolean) => {
    set({ isPreviewMode: val });
  },
}));
