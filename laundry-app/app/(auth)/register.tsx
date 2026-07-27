import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, TextInput, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { CountryPicker } from '../../components/auth/CountryPicker';
import { useRegister } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { StatusBar } from 'expo-status-bar';


export default function RegisterScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const registerMutation = useRegister();
  const [apiError, setApiError] = useState<string | null>(null);
  const { colors, themeMode } = useThemeStore();

  const registerSchema = z.object({
    fullName: z.string().min(1, { message: t('auth.validation.required') }),
    laundryName: z.string().min(1, { message: t('auth.validation.required') }),
    logo: z.any().optional(),
    email: z.string().min(1, { message: t('auth.validation.required') }).email({ message: t('auth.validation.invalidEmail') }),
    countryCode: z.string(),
    phone: z.string().regex(/^[0-9]{7,}$/, { message: t('auth.validation.invalidPhone') }),
    password: z.string()
      .min(8, { message: t('auth.validation.passwordMin') })
      .regex(/[0-9]/, { message: t('auth.validation.passwordMin') }),
    confirmPassword: z.string().min(1, { message: t('auth.validation.required') })
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsMustMatch'),
    path: ['confirmPassword']
  });

  type RegisterFormValues = z.infer<typeof registerSchema>;

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      logo: null,
      fullName: '',
      laundryName: '',
      email: '',
      countryCode: '+966',
      phone: '',
      password: '',
      confirmPassword: ''

    }
  });

  const pickImage = async (onChange: (value: any) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      onChange(result.assets[0].uri);
    }
  };

  const onSubmit = (data: RegisterFormValues) => {
    setApiError(null);
    registerMutation.mutate(data, {
      onSuccess: () => {
        console.log('Register mutation success, RootLayout will handle redirect');
      },
      onError: (error: any) => {
        const status = error.response?.status;
        const data = error.response?.data;
        const code = data?.error?.code;
        const message = data?.message ?? data?.error?.message;

        if (status === 409) {
          if (code === 'PHONE_ALREADY_EXISTS' || (typeof message === 'string' && (message.includes('phone') || message.includes('هاتف')))) {
            setApiError(t('auth.errors.phoneExists'));
          } else {
            setApiError(t('auth.errors.emailExists'));
          }
        } else if (status === 500) {
          setApiError(t('auth.errors.serverError'));
        } else if (!error.response) {
          setApiError(t('auth.errors.networkError'));
        } else {
          setApiError(t('auth.errors.default'));
        }
      }
    });
  };

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.register.title')}</Text>
          </View>

          {apiError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{apiError}</Text>
            </View>
          )}

          {/* Laundry Logo */}
          { /*<Text style={styles.label}>شعار المغسلة </Text>*/}
          <Controller
            control={control}
            name="logo"
            render={({ field: { onChange, value } }) => (
              <View style={styles.logoContainer}>
                <TouchableOpacity style={styles.logoPicker} onPress={() => pickImage(onChange)}>
                  {value ? (
                    <Image source={{ uri: value }} style={styles.logoImage} />
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Ionicons name="camera-outline" size={32} color={colors.textSecondary} />
                      <Text style={styles.logoText}>{t('auth.register.chooseLogo')}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {value && (
                  <TouchableOpacity style={styles.removeLogo} onPress={() => onChange(null)}>
                    <Text style={styles.removeLogoText}>{t('auth.register.removeLogo')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          <View style={styles.form}>
            {/* Full Name */}
            <Text style={styles.label}>{t('auth.register.fullName')}</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}
                </View>
              )}
            />

            {/* Laundry Name */}
            <Text style={styles.label}>{t('auth.register.laundryName')}</Text>
            <Controller
              control={control}
              name="laundryName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.laundryName && styles.inputError]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.laundryName && <Text style={styles.errorText}>{errors.laundryName.message}</Text>}
                </View>
              )}
            />



            {/* Email */}
            <Text style={styles.label}>{t('auth.register.email')}</Text>
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
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
            />

            {/* Phone Number with Country Code */}
            <Text style={styles.label}>{t('auth.register.phone')}</Text>
            <View style={styles.inputContainer}>
              <View style={[styles.phoneContainer, errors.phone && styles.inputError]}>
                <Controller
                  control={control}
                  name="countryCode"
                  render={({ field: { onChange, value } }) => (
                    <CountryPicker
                      selectedCode={value}
                      onSelect={onChange}
                      language={i18n.language as 'ar' | 'en'}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={styles.phoneInput}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType="phone-pad"
                      textAlign="left" // Always LTR for phone numbers
                    />
                  )}
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            </View>

            {/* Password */}
            <Text style={styles.label}>{t('auth.register.password')}</Text>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>{t('auth.register.confirmPassword')}</Text>
            <View style={styles.inputContainer}>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <PasswordInput
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit(onSubmit)}
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('auth.register.submit')}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => router.back()}
            >
              <Text style={styles.footerLinkText}>{t('auth.register.haveAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  errorBox: {
    backgroundColor: colors.surface2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.error
  },
  errorBoxText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center'
  },
  form: {
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    textAlign: 'right',
  },
  phoneContainer: {
    flexDirection: 'row',
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLink: {
    alignItems: 'center',
  },
  footerLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoPicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  removeLogo: {
    marginTop: 8,
  },
  removeLogoText: {
    color: colors.error,
    fontSize: 14,
  },
});
