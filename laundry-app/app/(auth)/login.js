import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
  I18nManager
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { COLORS } from '../../src/constants/theme';
import { translations } from '../../src/constants/i18n';
import useLaundryStore from '../../src/store/useLaundryStore';
import useSettingsStore from '../../src/store/useSettingsStore';

WebBrowser.maybeCompleteAuthSession();

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function LoginScreen() {
  const router = useRouter();
  const { loginAsync, googleLoginAsync, isLoading, error, clearError, token } = useLaundryStore();
  const { language, isDark, toggleLanguage, toggleTheme } = useSettingsStore();
  const t = translations[language];
  const isRTL = language === 'AR';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Google Auth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: "YOUR_ANDROID_CLIENT_ID", // سيتم استبداله عند استخراج المعرفات
    iosClientId: "YOUR_IOS_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (googleToken) => {
    const result = await googleLoginAsync(googleToken);
    if (result.success) router.replace('/(tabs)/dashboard');
  };

  // Colors based on theme
  const bg      = isDark ? '#0F172A' : '#0052CC';
  const cardBg  = isDark ? '#1E293B' : '#FFFFFF';
  const inputBg = isDark ? '#0F172A' : '#F4F5F7';
  const textC   = isDark ? '#F8FAFC' : '#172B4D';
  const subC    = isDark ? '#94A3B8' : '#5E6C84';
  const borderC = isDark ? '#334155' : '#DFE1E6';

  useEffect(() => { if (token) router.replace('/(tabs)/dashboard'); }, [token]);

  useEffect(() => {
    if (error) Alert.alert('خطأ', error, [{ text: 'حسناً', onPress: clearError }]);
  }, [error]);

  const validate = () => {
    const errs = {};
    if (!email)                   errs.email    = t.emailRequired;
    else if (!validateEmail(email)) errs.email  = t.emailInvalid;
    if (!password)                errs.password = t.passwordRequired;
    else if (password.length < 8) errs.password = t.passwordMin;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await loginAsync(email.trim().toLowerCase(), password);
    if (result.success) router.replace('/(tabs)/dashboard');
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Top floating buttons */}
      <View style={styles.topButtons}>
        <TouchableOpacity style={[styles.floatBtn, { backgroundColor: isDark ? '#1E293B' : 'rgba(255,255,255,0.25)' }]}
          onPress={toggleTheme}>
          <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatBtn, { backgroundColor: isDark ? '#1E293B' : 'rgba(255,255,255,0.25)' }]}
          onPress={toggleLanguage}>
          <Text style={styles.floatBtnText}>{language === 'AR' ? 'EN' : 'ع'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Brand Section */}
          <View style={styles.brandSection}>
            <View style={[styles.logoBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="water" size={48} color="#fff" />
            </View>
            <Text style={styles.brandName}>{t.brandName}</Text>
            <Text style={styles.brandSub}>{t.brandSub}</Text>
            {/* Features */}
            <View style={styles.features}>
              {[t.feature1, t.feature2, t.feature3, t.feature4].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}>{t.loginTitle}</Text>
            <Text style={[styles.cardSub, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.loginSub}</Text>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.emailLabel}</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: fieldErrors.email ? COLORS.danger : 'transparent' }]}>
                <Ionicons name="mail-outline" size={20} color={subC} style={styles.iconLeft} />
                <TextInput
                  style={[styles.input, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t.emailPlaceholder} placeholderTextColor={subC}
                  keyboardType="email-address" autoCapitalize="none"
                  value={email} onChangeText={v => { setEmail(v); setFieldErrors(e => ({ ...e, email: '' })); }}
                />
              </View>
              {fieldErrors.email ? <Text style={[styles.errText, { textAlign: isRTL ? 'right' : 'left' }]}>{fieldErrors.email}</Text> : null}
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.passwordLabel}</Text>
              <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: fieldErrors.password ? COLORS.danger : 'transparent' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={subC} style={styles.iconLeft} />
                <TextInput
                  style={[styles.input, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={t.passwordPlaceholder} placeholderTextColor={subC}
                  secureTextEntry={!showPass}
                  value={password} onChangeText={v => { setPassword(v); setFieldErrors(e => ({ ...e, password: '' })); }}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={{ padding: 4 }}>
                  <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={subC} />
                </TouchableOpacity>
              </View>
              {fieldErrors.password ? <Text style={[styles.errText, { textAlign: isRTL ? 'right' : 'left' }]}>{fieldErrors.password}</Text> : null}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={{ alignSelf: isRTL ? 'flex-start' : 'flex-end', marginBottom: 24 }}
              onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.forgotText}>{t.forgotPassword}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{isLoading ? t.loginLoading : t.loginBtn}</Text>
              {!isLoading && <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color="#fff" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.divLine, { backgroundColor: borderC }]} />
              <Text style={[styles.divText, { color: subC }]}>{t.orDivider}</Text>
              <View style={[styles.divLine, { backgroundColor: borderC }]} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: borderC }]}
              activeOpacity={0.8}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" />
              <Text style={[styles.googleBtnText, { color: textC }]}>{t.googleLogin}</Text>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.footerText, { color: subC }]}>{t.noAccount} </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>{t.registerLink}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.hint, { color: subC }]}>{t.hint}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topButtons: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 44,
    left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', zIndex: 100,
  },
  floatBtn: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  floatBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  scroll: { flexGrow: 1, paddingTop: Platform.OS === 'ios' ? 110 : 100, paddingBottom: 40, paddingHorizontal: 20 },
  brandSection: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 10 },
  logoBox: {
    width: 90, height: 90, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  brandName: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 4 },
  brandSub: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginBottom: 20 },
  features: { gap: 8, width: '100%', paddingHorizontal: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  card: {
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15, shadowRadius: 40, elevation: 12,
  },
  cardTitle: { fontSize: 26, fontWeight: '900', marginBottom: 6 },
  cardSub: { fontSize: 14, marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, height: 56, paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  iconLeft: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, fontWeight: '500' },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  forgotText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  primaryBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, marginBottom: 20,
  },
  btnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divLine: { flex: 1, height: 1 },
  divText: { marginHorizontal: 12, fontSize: 12, fontWeight: '600' },
  googleBtn: {
    flexDirection: 'row', height: 52, borderRadius: 14, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  googleBtnText: { fontSize: 15, fontWeight: '700' },
  footerRow: { justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  footerText: { fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
