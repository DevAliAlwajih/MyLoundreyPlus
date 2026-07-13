import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../stores/authStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.myloundreyplus.com/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type'              : 'application/json',
    'ngrok-skip-browser-warning': 'true', // يتجاوز صفحة تحذير ngrok المجاني
  },
});

// ── Request Interceptor ─────────────────────────────────────
// يُلحق الـ Access Token بكل طلب تلقائياً
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('[Axios] Error reading token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ────────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    // ── 1. خطأ شبكة: لا يوجد response أصلاً (السيرفر متوقف / Airplane mode)
    if (!error.response) {
      return Promise.reject({
        isNetworkError: true,
        errorCode      : 'NETWORK_ERROR',
        message        : 'لا يوجد اتصال بالإنترنت، تحقق من الشبكة',
      });
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const errorCode       = (error.response.data as any)?.errorCode as string | undefined;
    const status          = error.response.status;

    // ── 2. تجديد الـ Token عند انتهاء صلاحية الجلسة
    //    يُعالج: status 401 أو errorCode TOKEN_EXPIRED
    //    ما عدا: مسارات المصادقة ذاتها (لتجنب الحلقة اللانهائية)
    const isAuthRoute = originalRequest?.url?.includes('/auth/login')
      || originalRequest?.url?.includes('/auth/register')
      || originalRequest?.url?.includes('/auth/refresh');

    const shouldRefresh =
      (status === 401 || errorCode === 'TOKEN_EXPIRED')
      && originalRequest
      && !originalRequest._retry
      && !isAuthRoute;

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        const { refreshAccessToken } = useAuthStore.getState();
        await refreshAccessToken();

        const newToken = await SecureStore.getItemAsync('accessToken');
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // فشل التجديد → أخرج المستخدم وأعد الخطأ الأصلي
        const { logout } = useAuthStore.getState();
        await logout();
        return Promise.reject(refreshError);
      }
    }

    // ── 3. أي خطأ آخر — أعده كما هو للـ hook
    return Promise.reject(error);
  },
);

export default api;

