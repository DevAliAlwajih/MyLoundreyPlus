import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAuthStore from '../../src/store/useAuthStore';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputs = useRef([]);
  const { verifyOtp, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length < 4) return;
    
    const success = await verifyOtp(phone, otpCode);
    if (success) {
      // Routing is handled automatically by _layout.js auth state listener
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>رمز التحقق</Text>
          <Text style={styles.subtitle}>أدخل الرمز المكون من 4 أرقام المرسل إلى{'\n'}{phone}</Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputs.current[index] = ref}
              style={[styles.otpInput, error && styles.otpError]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              textAlign="center"
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity 
          style={[styles.button, (otp.join('').length < 4 || isLoading) && styles.buttonDisabled]} 
          onPress={handleVerify}
          disabled={otp.join('').length < 4 || isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'جاري التحقق...' : 'تأكيد'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendButton} onPress={() => router.back()}>
          <Text style={styles.resendText}>تغيير رقم الجوال</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.extraLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.base,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 24,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.large,
    paddingHorizontal: SIZES.xxl,
  },
  otpInput: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: SIZES.extraLarge,
    color: COLORS.primary,
    fontWeight: 'bold',
    ...SHADOWS.light,
  },
  otpError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.font,
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    marginTop: SIZES.large,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
    shadowOpacity: 0,
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: SIZES.medium,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: SIZES.xxl,
    alignItems: 'center',
  },
  resendText: {
    color: COLORS.primary,
    fontSize: SIZES.font,
    fontWeight: '600',
  },
});
