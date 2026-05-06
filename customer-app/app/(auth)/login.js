import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/useAuthStore';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen() {
  const router = useRouter();
  const { loginAsync, isLoading, error, clearError, token } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [language, setLanguage] = useState('AR');
  const [isDark, setIsDark] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Navigate to home when authenticated
  useEffect(() => {
    if (token) router.replace('/(tabs)');
  }, [token]);

  // Show server error as Alert
  useEffect(() => {
    if (error) {
      Alert.alert('خطأ في تسجيل الدخول', error, [{ text: 'حسناً', onPress: clearError }]);
    }
  }, [error]);

  const validate = () => {
    const errors = {};
    if (!email) errors.email = 'البريد الإلكتروني مطلوب';
    else if (!validateEmail(email)) errors.email = 'البريد الإلكتروني غير صحيح';
    if (!password) errors.password = 'كلمة المرور مطلوبة';
    else if (password.length < 8) errors.password = 'كلمة المرور 8 أحرف على الأقل';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await loginAsync(email.trim().toLowerCase(), password);
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputBg = isDark ? '#0F172A' : '#F1F5F9';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const subText = isDark ? '#94A3B8' : '#64748B';

  return (
    <KeyboardAvoidingView style={[styles.container, { backgroundColor: bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Floating top buttons */}
      <View style={styles.floatingNav}>
        <TouchableOpacity style={[styles.pill, { backgroundColor: cardBg }]}
          onPress={() => setIsDark(!isDark)}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={isDark ? '#F59E0B' : '#475569'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, { backgroundColor: cardBg }]}
          onPress={() => setLanguage(l => l === 'AR' ? 'EN' : 'AR')}>
          <Text style={[styles.langText, { color: textColor }]}>{language}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={{ width: '100%', height: '100%', borderRadius: 28 }} 
              resizeMode="cover" 
            />
          </View>
          <Text style={[styles.brand, { color: textColor }]}>مغسلتي بلس</Text>
          <Text style={[styles.welcome, { color: subText }]}>مرحباً بعودتك 👋</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, { backgroundColor: inputBg },
              fieldErrors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.iconLeft} />
              <TextInput style={[styles.input, { color: textColor }]}
                placeholder="البريد الإلكتروني" placeholderTextColor="#9CA3AF"
                keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={v => { setEmail(v); setFieldErrors(e => ({ ...e, email: '' })) }}
                textAlign="right" />
            </View>
            {fieldErrors.email ? <Text style={styles.errText}>{fieldErrors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, { backgroundColor: inputBg },
              fieldErrors.password && styles.inputError]}>
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.iconLeft}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput style={[styles.input, { color: textColor }]}
                placeholder="كلمة المرور" placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password} onChangeText={v => { setPassword(v); setFieldErrors(e => ({ ...e, password: '' })) }}
                textAlign="right" />
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.iconRight} />
            </View>
            {fieldErrors.password ? <Text style={styles.errText}>{fieldErrors.password}</Text> : null}
          </View>

          <TouchableOpacity style={styles.forgot}>
            <Text style={styles.forgotText}>هل نسيت كلمة المرور؟</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{isLoading ? 'جاري الدخول...' : 'تسجيل الدخول'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={[styles.dividerText, { color: subText }]}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity style={[styles.btnGoogle, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={[styles.btnGoogleText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
              تسجيل الدخول بواسطة Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: subText }]}>ليس لديك حساب؟ </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text style={styles.footerLink}>إنشاء حساب جديد</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  floatingNav: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40,
    left: 20, right: 20, flexDirection: 'row',
    justifyContent: 'space-between', zIndex: 10,
  },
  pill: {
    paddingHorizontal: 16, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  langText: { fontWeight: '800', fontSize: 13 },
  scroll: { flexGrow: 1, paddingTop: 110, paddingBottom: 40, paddingHorizontal: 24 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: '#0066FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#0066FF', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
  },
  brand: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  welcome: { fontSize: 16, fontWeight: '500' },
  card: {
    borderRadius: 24, padding: 24,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  fieldGroup: { marginBottom: 18 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, height: 58, paddingHorizontal: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, fontSize: 15, fontWeight: '500', paddingHorizontal: 8 },
  iconLeft: { marginRight: 6 },
  iconRight: { marginLeft: 6 },
  errText: { color: '#EF4444', fontSize: 12, marginTop: 4, textAlign: 'right' },
  forgot: { alignSelf: 'flex-start', marginBottom: 24 },
  forgotText: { color: '#0066FF', fontSize: 13, fontWeight: '700' },
  btnPrimary: {
    backgroundColor: '#0066FF', height: 58, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0066FF', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6, marginBottom: 22,
  },
  btnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 14, fontSize: 13, fontWeight: '600' },
  btnGoogle: {
    flexDirection: 'row', height: 58, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, backgroundColor: 'transparent',
  },
  btnGoogleText: { marginLeft: 10, fontSize: 15, fontWeight: '700' },
  footer: {
    flexDirection: 'row-reverse', justifyContent: 'center',
    marginTop: 28, alignItems: 'center',
  },
  footerText: { fontSize: 14 },
  footerLink: { color: '#0066FF', fontSize: 14, fontWeight: 'bold' },
});
