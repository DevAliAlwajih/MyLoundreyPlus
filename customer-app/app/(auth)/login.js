import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../src/store/useAuthStore';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const { requestOtp, isLoading, error } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!phone || phone.length < 9) return;
    
    // Defaulting to SA country code if not provided
    const formattedPhone = phone.startsWith('+') ? phone : `+966${phone.replace(/^0+/, '')}`;
    
    const success = await requestOtp(formattedPhone);
    if (success) {
      // Navigate to OTP screen and pass phone number
      router.push({ pathname: '/(auth)/otp', params: { phone: formattedPhone } });
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo Placeholder */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M+</Text>
          </View>
        </View>

        <View style={styles.headerContainer}>
          <Text style={styles.title}>مرحباً بك في مغسلتي بلس</Text>
          <Text style={styles.subtitle}>أدخل رقم هاتفك لتسجيل الدخول أو إنشاء حساب جديد</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>رقم الجوال</Text>
          <View style={[styles.inputWrapper, error && styles.inputError]}>
            <TextInput
              style={styles.input}
              placeholder="05X XXX XXXX"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={15}
              textAlign="left"
            />
            <Text style={styles.prefix}>+966</Text>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.button, (!phone || isLoading) && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={!phone || isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'جاري الإرسال...' : 'متابعة'}</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: SIZES.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  logoText: {
    color: COLORS.surface,
    fontSize: SIZES.xxl,
    fontWeight: 'bold',
  },
  headerContainer: {
    alignItems: 'flex-end', // RTL
    marginBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.extraLarge,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.base,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  inputContainer: {
    marginBottom: SIZES.xxl,
  },
  label: {
    fontSize: SIZES.font,
    color: COLORS.text,
    marginBottom: SIZES.base,
    textAlign: 'right',
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 56,
    paddingHorizontal: SIZES.medium,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: SIZES.medium,
    color: COLORS.text,
  },
  prefix: {
    fontSize: SIZES.medium,
    color: COLORS.textLight,
    marginLeft: SIZES.base,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.small,
    marginTop: SIZES.base,
    textAlign: 'right',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
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
});
