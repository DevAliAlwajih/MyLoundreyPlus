import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { getDeviceInfo } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isReady: false,
  error: null,

  // ─── Load saved session on app start ────────────────────────────
  bootstrapAsync: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Try fetching current user with saved token
        const response = await api.get('/auth/me');
        set({ user: response.data.data, token, isReady: true });
        return;
      }
    } catch (e) {
      // Token expired or invalid — clear it
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    }
    set({ isReady: true, token: null, user: null });
  },

  // ─── LOGIN with email + password ────────────────────────────────
  loginAsync: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, tokens, deviceId } = response.data.data;

      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

      set({ user, token: tokens.accessToken, isLoading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── REGISTER with email + password ─────────────────────────────
  registerAsync: async ({ full_name, phone_number, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', {
        full_name,
        phone_number: phone_number || undefined,
        email,
        password,
        role: 'customer',
      });
      const { user, tokens } = response.data.data;

      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);

      set({ user, token: tokens.accessToken, isLoading: false, error: null });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'فشل إنشاء الحساب';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // ─── LOGOUT ─────────────────────────────────────────────────────
  logout: async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
