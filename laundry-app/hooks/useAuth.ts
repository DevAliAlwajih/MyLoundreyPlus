import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';
import api from '../lib/axios';
import { mapErrorToMessage } from '../lib/errorMapper';
import { useAuthStore } from '../stores/authStore';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// ── Device Info Helper ──────────────────────────────────────
const getDeviceInfo = async () => {
  let fcmToken = 'expo-go-placeholder';

  try {
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

    if (!isExpoGo) {
      const { default: Notifications } = await import('expo-notifications');
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        const token = await Notifications.getExpoPushTokenAsync();
        fcmToken = token.data;
      }
    }
  } catch {
    fcmToken = 'expo-go-placeholder';
  }

  return {
    deviceId   : Device.modelId    ?? 'unknown',
    deviceModel: Device.modelName  ?? 'unknown',
    os         : Device.osName     ?? 'unknown',
    osVersion  : Device.osVersion  ?? 'unknown',
    fcmToken,
  };
};

// ── useRegister ─────────────────────────────────────────────
export const useRegister = () => {
  const { login }   = useAuthStore();
  const { t }       = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/auth/register', {
        fullName   : data.fullName,
        laundryName: data.laundryName,
        email      : data.email,
        phone      : data.phone,
        countryCode: data.countryCode,
        password   : data.password,
        role       : 'laundry',
      });
      return { responseData: response.data, logo: data.logo };
    },

    onMutate: () => setApiError(null),

    onSuccess: async ({ responseData, logo }) => {
      // الباكند يُرجع {accessToken, refreshToken, user} مباشرة بدون غلاف {success, data}
      const { accessToken, refreshToken, user } = responseData;
      if (accessToken && refreshToken && user) {
        login(user, accessToken, refreshToken);

        if (logo) {
          try {
            const formData = new FormData();
            formData.append('logo', { uri: logo, name: 'logo.jpg', type: 'image/jpeg' } as any);
            await api.post('/my-laundry/logo', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch {
            // الشعار اختياري — فشله لا يوقف التسجيل
          }
        }
      }
    },

    onError: (error: any) => {
      setApiError(mapErrorToMessage(error, t));
    },
  });

  return { ...mutation, apiError };
};

// ── useLogin ────────────────────────────────────────────────
export const useLogin = () => {
  const { login }   = useAuthStore();
  const { t }       = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const deviceInfo = await getDeviceInfo();
      const response   = await api.post('/auth/login', {
        email   : data.email,
        password: data.password,
        role    : 'laundry',
        ...deviceInfo,
      });
      return response.data;
    },

    onMutate: () => setApiError(null),

    onSuccess: async (data) => {
      // الباكند يُرجع {accessToken, refreshToken, user} مباشرة بدون غلاف {success, data}
      const { accessToken, refreshToken, user } = data;
      if (accessToken && refreshToken && user) {
        await login(user, accessToken, refreshToken);
      }
    },

    onError: (error: any) => {
      setApiError(mapErrorToMessage(error, t));
    },
  });

  return { ...mutation, apiError };
};

// ── useSendOtp ──────────────────────────────────────────────
export const useSendOtp = () => {
  const { t }       = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/otp/send', { email });
      return response.data;
    },

    onMutate: () => setApiError(null),

    onError: (error: any) => {
      setApiError(mapErrorToMessage(error, t));
    },
  });

  return { ...mutation, apiError };
};

// ── useVerifyOtpAndResetPassword ────────────────────────────
export const useVerifyOtpAndResetPassword = () => {
  const { t }       = useTranslation();
  const [apiError, setApiError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/auth/password/reset', data);
      return response.data;
    },

    onMutate: () => setApiError(null),

    onError: (error: any) => {
      setApiError(mapErrorToMessage(error, t));
    },
  });

  return { ...mutation, apiError };
};

