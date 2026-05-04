import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// For local testing on emulator, use 10.0.2.2 for Android. For physical device, use your local IP.
// Since backend is on port 5000:
const API_URL = 'http://10.0.2.2:5000/api/v1'; 

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Helper to get device info securely
export const getDeviceInfo = async () => {
  let deviceId = await SecureStore.getItemAsync('deviceId');
  if (!deviceId) {
    // Generate a unique ID if not present (UUID placeholder)
    deviceId = Device.osBuildId || Constants.sessionId; 
    await SecureStore.setItemAsync('deviceId', deviceId);
  }
  return {
    deviceId,
    deviceType: Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'mobile',
    deviceOs: Device.osName || 'unknown',
    deviceModel: Device.modelName || 'unknown',
  };
};

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Always attach device info for multi-device auth tracking
    const deviceInfo = await getDeviceInfo();
    config.headers['x-device-id'] = deviceInfo.deviceId;
    config.headers['x-device-type'] = deviceInfo.deviceType;
    config.headers['x-device-os'] = deviceInfo.deviceOs;
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for handling token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401, we might want to trigger a logout or refresh token logic
    if (error.response?.status === 401) {
      // Dispatch logout event (can be listened to in Zustand or App.js)
    }
    return Promise.reject(error);
  }
);

export default api;
