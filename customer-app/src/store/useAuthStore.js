import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isSignout: false,
  error: null,

  // Load token on startup
  bootstrapAsync: async () => {
    let token;
    try {
      token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        // Optionally verify token or fetch user details here
        const response = await api.get('/auth/me');
        set({ user: response.data.data, token, isLoading: false });
        return;
      }
    } catch (e) {
      // Restoring token failed
    }
    set({ isLoading: false, isSignout: true, token: null, user: null });
  },

  // Login (Step 1: Request OTP)
  requestOtp: async (phoneNumber) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/login', { phone_number: phoneNumber });
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'فشل الاتصال' });
      return false;
    }
  },

  // Verify OTP (Step 2: Login)
  verifyOtp: async (phoneNumber, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { phone_number: phoneNumber, otp });
      const { user, tokens } = response.data.data;
      
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      }
      
      set({ user, token: tokens.accessToken, isLoading: false, isSignout: false });
      return true;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.message || 'رمز التحقق غير صحيح' });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {} // ignore if offline
    
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    set({ user: null, token: null, isSignout: true });
  },
}));

export default useAuthStore;
