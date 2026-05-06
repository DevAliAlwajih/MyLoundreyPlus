import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api, { DEVICE_ID } from '../services/api';

const useLaundryStore = create((set, get) => ({
  user:      null,
  laundry:   null,
  token:     null,
  isLoading: false,
  isReady:   false,
  error:     null,

  // ─── Bootstrap on app start ─────────────────────────────────────
  bootstrapAsync: async () => {
    try {
      const token = await SecureStore.getItemAsync('laundry_accessToken');
      if (token) {
        const res = await api.get('/auth/me');
        const userData = res.data.data;
        if (userData.role !== 'laundry') {
          throw new Error('ليس لديك صلاحية الوصول');
        }
        // Fetch laundry info
        let laundry = null;
        try {
          const lRes = await api.get('/laundries/my');
          laundry = lRes.data.data;
        } catch (_) {}
        set({ user: userData, laundry, token, isReady: true });
        return;
      }
    } catch {
      await SecureStore.deleteItemAsync('laundry_accessToken');
      await SecureStore.deleteItemAsync('laundry_refreshToken');
    }
    set({ isReady: true, token: null, user: null });
  },

  // ─── Login ──────────────────────────────────────────────────────
  loginAsync: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data.data;

      // Handle device approval request (202)
      // This happens when the device is new — we auto-activate it for the POS
      if (data.requiresDeviceApproval) {
        // Activate the POS device immediately (admin bypass for laundry POS)
        try {
          await api.patch(`/users/${data.userId}/devices/${DEVICE_ID}`, { is_active: true });
          // Retry login after activation
          return await get().loginAsync(email, password);
        } catch (_) {
          set({ isLoading: false, error: 'الجهاز يحتاج موافقة المدير، تواصل مع الدعم' });
          return { success: false };
        }
      }

      const { user, tokens } = data;

      if (!user || !tokens) {
        set({ isLoading: false, error: 'استجابة غير متوقعة من الخادم' });
        return { success: false };
      }

      if (user.role !== 'laundry') {
        set({ isLoading: false, error: 'هذا الحساب غير مخصص لأصحاب المغاسل' });
        return { success: false };
      }

      await SecureStore.setItemAsync('laundry_accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('laundry_refreshToken', tokens.refreshToken);

      // Fetch laundry record
      let laundry = null;
      try {
        const lRes = await api.get('/laundries/my');
        laundry = lRes.data.data;
      } catch (_) {}

      set({ user, laundry, token: tokens.accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تسجيل الدخول، تأكد من بيانات الاتصال بالخادم';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ─── Google Login ────────────────────────────────────────────────
  googleLoginAsync: async (googleToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/google', { token: googleToken });
      const { user, tokens } = res.data.data;

      if (user.role !== 'laundry') {
        set({ isLoading: false, error: 'هذا الحساب غير مخصص لأصحاب المغاسل' });
        return { success: false };
      }

      await SecureStore.setItemAsync('laundry_accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('laundry_refreshToken', tokens.refreshToken);

      let laundry = null;
      try {
        const lRes = await api.get('/laundries/my');
        laundry = lRes.data.data;
      } catch (_) {}

      set({ user, laundry, token: tokens.accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل الدخول بـ Google';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ─── Register ────────────────────────────────────────────────────
  registerAsync: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', formData, {
        headers: formData instanceof FormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
      });
      const { user, tokens } = res.data.data;

      await SecureStore.setItemAsync('laundry_accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('laundry_refreshToken', tokens.refreshToken);

      set({ user, token: tokens.accessToken, isLoading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل إنشاء الحساب';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // ─── Logout ─────────────────────────────────────────────────────
  logout: async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    await SecureStore.deleteItemAsync('laundry_accessToken');
    await SecureStore.deleteItemAsync('laundry_refreshToken');
    set({ user: null, token: null, laundry: null });
  },

  clearError: () => set({ error: null }),
}));

export default useLaundryStore;
