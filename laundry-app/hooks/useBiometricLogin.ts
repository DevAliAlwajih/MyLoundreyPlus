import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export function useBiometricLogin() {
  const { t } = useTranslation();
  const router = useRouter();
  const checkAuthStatus = useAuthStore(s => s.checkAuthStatus);
  const refreshAccessToken = useAuthStore(s => s.refreshAccessToken);

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('settings.security.biometricAuthReason'),
        fallbackLabel: t('settings.security.biometricFallback'),
        cancelLabel: t('common.cancel'),
        disableDeviceFallback: true,
      });

      if (result.success) {
        // Biometric success - explicitly verify token with backend first as requested
        try {
          await refreshAccessToken(); 
          // If successful, restore session normally
          await checkAuthStatus();
        } catch (error) {
          // Token expired or rejected by backend. 
          // Note: refreshAccessToken already calls logout() centrally which clears the flag
          Alert.alert(t('common.error'), t('auth.errors.sessionExpired'));
          // In case we are not already on login (e.g. from biometric screen)
          router.replace('/(auth)/login');
        }
      } else {
        // Failed or cancelled
        if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
           Alert.alert(t('common.error'), t('settings.security.biometricAuthFailed'));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('settings.security.biometricAuthFailed'));
    }
  };

  return { handleBiometricAuth };
}
