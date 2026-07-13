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

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  error: '#e74c3c',
  success: '#2ecc71'
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity style={styles.backButton} onPress={() => {
            if (step > 1) setStep((prev) => (prev - 1) as any);
            else router.back();
          }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
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
  successBox: {
    backgroundColor: '#e8f8f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#c3e6cb'
  },
  successBoxText: {
    color: COLORS.success,
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
    marginBottom: 24,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    color: '#888',
    fontSize: 14,
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
