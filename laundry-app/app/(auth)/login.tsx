import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, TextInput, ActivityIndicator, Alert, I18nManager, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { useLogin } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/authStore';
import * as SecureStore from 'expo-secure-store';
import { useBiometricLogin } from '../../hooks/useBiometricLogin';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  surface: '#ffffff',
  surface2: '#f0f2f5',
  error: '#e74c3c',
  text: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  border: '#eee',
};

export default function LoginScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const loginMutation = useLogin();
  const { rememberedAccount, removeRememberedAccount } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const { handleBiometricAuth } = useBiometricLogin();

  useFocusEffect(
    useCallback(() => {
      SecureStore.getItemAsync('biometric_enabled').then(val => {
        setIsBiometricEnabled(val === 'true');
      });
      SecureStore.getItemAsync('appTheme').then(theme => {
        if (theme === 'dark') setIsDarkMode(true);
      });
    }, [])
  );

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    const isRTL = newLang === 'ar';
    await i18n.changeLanguage(newLang);
    I18nManager.forceRTL(isRTL);
    await SecureStore.setItemAsync('appLanguage', newLang);
    try {
      const { reloadAsync } = await import('expo-updates');
      await reloadAsync();
    } catch (e) {
      Alert.alert(t('common.alert', 'تنبيه'), t('settings.restartRequired', 'يرجى إعادة تشغيل التطبيق لتطبيق اللغة'));
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    await SecureStore.setItemAsync('appTheme', newTheme ? 'dark' : 'light');
  };

  const onBiometricPress = () => {
    if (isBiometricEnabled) {
      handleBiometricAuth();
    } else {
      Alert.alert(t('common.alert', 'تنبيه'), t('auth.loginScreen.enableBiometricFirst', 'قم بتفعيل الدخول عبر البصمة من الإعدادات'));
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      t('common.comingSoon', 'قريباً'),
      'تسجيل الدخول عبر Google سيكون متاحاً في الإصدار القادم.',
      [{ text: 'حسناً', style: 'cancel' }]
    );
  };

  const loginSchema = z.object({
    email: z.string().min(1, { message: t('auth.validation.required') }).email({ message: t('auth.validation.invalidEmail') }),
    password: z.string().min(1, { message: t('auth.validation.required') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: rememberedAccount?.email || '',
      password: '',
    }
  });

  useEffect(() => {
    if (rememberedAccount) {
      setValue('email', rememberedAccount.email);
    } else {
      setValue('email', '');
    }
  }, [rememberedAccount, setValue]);

  const onSubmit = (data: LoginFormValues) => {
    setApiError(null);
    loginMutation.mutate(data, {
      onError: (error: any) => {
        const data = error.response?.data;
        const code = data?.error?.code;
        const status = error.response?.status;
        
        if (code === 'INVALID_CREDENTIALS' || status === 401) {
          setApiError(t('auth.errors.invalidCredentials'));
        } else if (status === 500) {
          setApiError(t('auth.errors.serverError'));
        } else if (!error.response) {
          setApiError(t('auth.errors.networkError'));
        } else {
          let msg = data?.error?.message || data?.message || t('auth.errors.default');
          if (Array.isArray(msg)) msg = msg[0];
          setApiError(msg);
        }
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
              <Ionicons name="language-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.langButtonText}>{i18n.language === 'ar' ? 'English' : 'عربي'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
              <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/logo.png')} style={{ width: 50, height: 50 }} resizeMode="contain" />
            </View>
            <Text style={styles.title}>{t('auth.loginScreen.appName', 'مغسلتي اس بلس')}</Text>
            <Text style={styles.subtitle}>{t('auth.loginScreen.welcomeSubtitle', 'هلا بك في مغسلتي اس بلس')}</Text>
          </View>

          {apiError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{apiError}</Text>
            </View>
          )}

          <View style={styles.form}>
            {rememberedAccount ? (
              <View style={styles.accountCard}>
                <View style={styles.accountCardLeft}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{rememberedAccount.fullName.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={styles.accountName}>{rememberedAccount.fullName}</Text>
                    <Text style={styles.accountEmail}>{rememberedAccount.email}</Text>
                  </View>
                </View>
                <View style={styles.accountCardActions}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert(t('common.alert', 'تنبيه'), t('common.comingSoon', 'قريباً'))}>
                    <Ionicons name="qr-code-outline" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={() => {
                    Alert.alert(t('common.alert', 'تنبيه'), t('auth.loginScreen.removeAccountConfirm', 'هل تريد إزالة هذا الحساب من الجهاز؟'), [
                      { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
                      { text: t('common.ok', 'موافق'), style: 'destructive', onPress: removeRememberedAccount }
                    ]);
                  }}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[styles.input, errors.email && styles.inputError]}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder={t('auth.loginScreen.email')}
                      placeholderTextColor="#888"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                  </View>
                )}
              />
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <PasswordInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    placeholder={t('auth.loginScreen.password')}
                  />
                </View>
              )}
            />

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>{t('auth.loginScreen.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.offlineCheckbox} onPress={() => setOfflineMode(!offlineMode)}>
              <Ionicons name={offlineMode ? "checkbox" : "square-outline"} size={20} color={offlineMode ? COLORS.primary : COLORS.textSecondary} />
              <Text style={styles.offlineText}>{t('auth.loginScreen.offlineMode', 'الدخول بدون انترنت')}</Text>
            </TouchableOpacity>

            <View style={styles.submitRow}>
              <TouchableOpacity 
                style={styles.submitButtonMain} 
                onPress={handleSubmit(onSubmit)}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('auth.loginScreen.submit')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.submitBiometricButton} 
                onPress={onBiometricPress}
              >
                <Ionicons name="finger-print" size={32} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => router.push('/(auth)/register')}
            >
              <Ionicons name="person-add-outline" size={18} color={COLORS.textSecondary} />
              <Text style={styles.secondaryButtonText}>{t('auth.loginScreen.createAccount', 'إنشاء حساب')}</Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.orText}>{t('common.or', 'أو')}</Text>
              <View style={styles.line} />
            </View>

            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>{t('auth.loginWithGoogle', 'تسجيل الدخول عبر Google')}</Text>
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity style={styles.footerLinkItem} onPress={() => Alert.alert(t('common.alert', 'تنبيه'), t('common.comingSoon', 'قريباً'))}>
                <Ionicons name="headset-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.footerLinkText}>{t('auth.loginScreen.contactUs', 'تواصل معنا')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.footerLinkItem} onPress={() => Alert.alert(t('common.alert', 'تنبيه'), t('common.comingSoon', 'قريباً'))}>
                <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.footerLinkText}>{t('auth.loginScreen.aboutUs', 'تعرف من نحن')}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  langButtonText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6f0fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorBox: {
    backgroundColor: '#fdecea',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f5c6cb'
  },
  errorBoxText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center'
  },
  form: {
    flex: 1,
  },
  accountCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6f0fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  accountEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  accountCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  offlineCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  offlineText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  submitRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  submitButtonMain: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBiometricButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    marginLeft: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 24,
    marginTop: 32,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    paddingHorizontal: 10,
    color: '#888',
  },
  footerLinkItem: {
    alignItems: 'center',
    gap: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
