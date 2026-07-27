import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, TextInput, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { OTPInput } from '../../components/auth/OTPInput';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { useSendOtp, useVerifyOtpAndResetPassword } from '../../hooks/useAuth';
import { useThemeStore } from '../../stores/themeStore';
import { StatusBar } from 'expo-status-bar';



export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, themeMode } = useThemeStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const sendOtpMutation = useSendOtp();
  const verifyMutation = useVerifyOtpAndResetPassword();

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email) {
      setErrorMsg(t('auth.validation.required'));
      return;
    }
    sendOtpMutation.mutate(email, {
      onSuccess: () => {
        setStep(2);
        setCountdown(600);
        setSuccessMsg(t('auth.forgotPassword.otpSent'));
      },
      onError: (err: any) => {
        setErrorMsg(err.response?.data?.message || t('auth.errors.default'));
      }
    });
  };

  const handleVerifyOtp = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (otp.length < 6) {
      setErrorMsg(t('auth.validation.required'));
      return;
    }
    setStep(3); // Wait, API expects email, otp, newPassword together. We'll collect password first.
    // The backend endpoint is /auth/otp/verify which takes {email, otp, newPassword}.
    // So we just move to step 3 visually.
  };

  const handleResetPassword = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    if (!newPassword || !confirmPassword) {
      setErrorMsg(t('auth.validation.required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg(t('auth.validation.passwordsMustMatch'));
      return;
    }

    verifyMutation.mutate(
      { email, otp, newPassword },
      {
        onSuccess: () => {
          setSuccessMsg(t('auth.forgotPassword.passwordChanged'));
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || t('auth.errors.default'));
        }
      }
    );
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
          
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (step > 1) setStep((prev) => (prev - 1) as any);
            else router.back();
          }}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.forgotPassword.title')}</Text>
            {step === 1 && <Text style={styles.subtitle}>{t('auth.forgotPassword.enterEmail')}</Text>}
          </View>

          {errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{errorMsg}</Text>
            </View>
          )}

          {successMsg && (
            <View style={styles.successBox}>
              <Text style={styles.successBoxText}>{successMsg}</Text>
            </View>
          )}

          <View style={styles.form}>
            {/* STEP 1: Email */}
            {step === 1 && (
              <>
                <Text style={styles.label}>{t('auth.forgotPassword.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleSendOtp}
                  disabled={sendOtpMutation.isPending}
                >
                  {sendOtpMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('auth.forgotPassword.sendOtp')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <>
                <Text style={styles.label}>{t('auth.forgotPassword.enterOtp')}</Text>
                <OTPInput length={6} value={otp} onChange={setOtp} />

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleVerifyOtp}
                >
                  <Text style={styles.submitButtonText}>{t('auth.forgotPassword.verify')}</Text>
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  {countdown > 0 ? (
                    <Text style={styles.resendText}>
                      {t('auth.forgotPassword.resendIn')} {formatTime(countdown)}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={styles.resendLink}>{t('auth.forgotPassword.resend')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* STEP 3: New Password */}
            {step === 3 && (
              <>
                <Text style={styles.label}>{t('auth.forgotPassword.newPassword')}</Text>
                <PasswordInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                />

                <Text style={styles.label}>{t('auth.forgotPassword.confirmNewPassword')}</Text>
                <PasswordInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity 
                  style={styles.submitButton} 
                  onPress={handleResetPassword}
                  disabled={verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{t('auth.forgotPassword.savePassword')}</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

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
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
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
  successBox: {
    backgroundColor: colors.surface2,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.success
  },
  successBoxText: {
    color: colors.success,
    fontSize: 14,
    textAlign: 'center'
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: '500',
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
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: colors.primary,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  resendLink: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

