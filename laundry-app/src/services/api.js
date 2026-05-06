import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── تغيير هذا لـ IP الشبكة المحلية الخاصة بك عند الاختبار على جهاز حقيقي ───
// مثال: 'http://192.168.1.5:5000/api/v1'
const BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/api/v1'   // محاكي Android
  : 'http://localhost:5000/api/v1';  // iOS Simulator / Web

// معرف ثابت للجهاز (tablet POS) لتجنب طلب موافقة الجهاز
const DEVICE_ID = 'laundry-pos-tablet-001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// إرفاق التوكن + معلومات الجهاز مع كل طلب
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('laundry_accessToken');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;

  config.headers['x-device-id']    = DEVICE_ID;
  config.headers['x-device-type']  = 'tablet';
  config.headers['x-device-os']    = Platform.OS;
  config.headers['x-device-model'] = 'Laundry POS';

  return config;
});

// معالجة 401 — تنظيف الجلسة
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('laundry_accessToken');
      await SecureStore.deleteItemAsync('laundry_refreshToken');
    }
    return Promise.reject(err);
  }
);

export { DEVICE_ID };
export default api;
