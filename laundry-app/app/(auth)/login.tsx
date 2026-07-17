import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { useLogin } from '../../hooks/useAuth';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  error: '#e74c3c'
};

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const loginMutation = useLogin();
  const [apiError, setApiError] = useState<string | null>(null);

  const loginSchema = z.object({
    email: z.string().min(1, { message: t('auth.validation.required') }).email({ message: t('auth.validation.invalidEmail') }),
    password: z.string().min(1, { message: t('auth.validation.required') }),
  });

  type LoginFormValues = z.infer<typeof loginSchema>;

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = (data: LoginFormValues) => {
    console.log('🚀 Attempting login to:', process.env.EXPO_PUBLIC_API_URL);
    setApiError(null);
    loginMutation.mutate(data, {
      onSuccess: () => {
        console.log('Login mutation success, RootLayout will handle redirect');
      },
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
          
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(auth)/welcome');
            }
          }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.loginScreen.title')}</Text>
          </View>

          {apiError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{apiError}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Text style={styles.label}>{t('auth.loginScreen.email')}</Text>
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
                    placeholderTextColor="#888"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
            />

            <Text style={styles.label}>{t('auth.loginScreen.password')}</Text>
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

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>{t('auth.loginScreen.forgotPassword')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.submitButton} 
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
              style={styles.footerLink} 
              onPress={() => router.replace('/(auth)/register')}
            >
              <Text style={styles.footerLinkText}>{t('auth.loginScreen.noAccount')}</Text>
            </TouchableOpacity>
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
    color: COLORS.primary,
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
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
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
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
    color: '#666',
    fontSize: 14,
  },
});
