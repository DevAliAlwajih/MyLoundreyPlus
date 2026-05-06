import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../src/store/useAuthStore';

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function RegisterScreen() {
  const router = useRouter();
  const { registerAsync, isLoading, error, clearError, token } = useAuthStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { if (token) router.replace('/(tabs)'); }, [token]);

  useEffect(() => {
    if (error) Alert.alert('خطأ في التسجيل', error, [{ text: 'حسناً', onPress: clearError }]);
  }, [error]);

  const setErr = (field, msg) => setFieldErrors(e => ({ ...e, [field]: msg }));
  const clearErr = (field) => setFieldErrors(e => ({ ...e, [field]: '' }));

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'الاسم مطلوب';
    if (!email) errs.email = 'البريد الإلكتروني مطلوب';
    else if (!validateEmail(email)) errs.email = 'البريد غير صحيح';
    if (!password) errs.password = 'كلمة المرور مطلوبة';
    else if (password.length < 8) errs.password = 'كلمة المرور 8 أحرف على الأقل';
    if (!confirm) errs.confirm = 'تأكيد كلمة المرور مطلوب';
    else if (password !== confirm) errs.confirm = 'كلمتا المرور غير متطابقتان';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await registerAsync({
      full_name: name.trim(),
      phone_number: phone.trim() || undefined,
      email: email.trim().toLowerCase(),
      password,
    });
    if (result.success) router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Top Nav */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>إنشاء حساب جديد</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity style={styles.avatar} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={30} color="#94A3B8" />
            <View style={styles.avatarBadge}>
              <Ionicons name="add" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>أضف صورة شخصية (اختياري)</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, fieldErrors.name && styles.inputError]}>
              <TextInput style={styles.input} placeholder="الاسم الكامل"
                placeholderTextColor="#9CA3AF" value={name}
                onChangeText={v => { setName(v); clearErr('name'); }} textAlign="right" />
              <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.iconRight} />
            </View>
            {fieldErrors.name ? <Text style={styles.errText}>{fieldErrors.name}</Text> : null}
          </View>

          {/* Phone */}
          <View style={styles.fieldGroup}>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="رقم الجوال (للتواصل - اختياري)"
                placeholderTextColor="#9CA3AF" keyboardType="phone-pad"
                value={phone} onChangeText={setPhone} textAlign="right" />
              <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.iconRight} />
            </View>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, fieldErrors.email && styles.inputError]}>
              <TextInput style={styles.input} placeholder="البريد الإلكتروني"
                placeholderTextColor="#9CA3AF" keyboardType="email-address"
                autoCapitalize="none" value={email}
                onChangeText={v => { setEmail(v); clearErr('email'); }} textAlign="right" />
              <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.iconRight} />
            </View>
            {fieldErrors.email ? <Text style={styles.errText}>{fieldErrors.email}</Text> : null}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, fieldErrors.password && styles.inputError]}>
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.iconLeft}>
                <Ionicons name={showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput style={styles.input} placeholder="كلمة المرور"
                placeholderTextColor="#9CA3AF" secureTextEntry={!showPass}
                value={password} onChangeText={v => { setPassword(v); clearErr('password'); }} textAlign="right" />
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.iconRight} />
            </View>
            {fieldErrors.password ? <Text style={styles.errText}>{fieldErrors.password}</Text> : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <View style={[styles.inputRow, fieldErrors.confirm && styles.inputError]}>
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.iconLeft}>
                <Ionicons name={showConfirm ? 'eye-outline' : 'eye-off-outline'} size={20} color="#94A3B8" />
              </TouchableOpacity>
              <TextInput style={styles.input} placeholder="تأكيد كلمة المرور"
                placeholderTextColor="#9CA3AF" secureTextEntry={!showConfirm}
                value={confirm} onChangeText={v => { setConfirm(v); clearErr('confirm'); }} textAlign="right" />
              <Ionicons name="shield-checkmark-outline" size={20} color={confirm && confirm === password ? '#10B981' : '#94A3B8'} style={styles.iconRight} />
            </View>
            {fieldErrors.confirm ? <Text style={styles.errText}>{fieldErrors.confirm}</Text> : null}
          </View>

          {/* Register Button */}
          <TouchableOpacity style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
            onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
            <Text style={styles.btnPrimaryText}>{isLoading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.btnGoogle} activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.btnGoogleText}>التسجيل بواسطة Google</Text>
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>لديك حساب؟ </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.footerLink}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  navTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  scroll: { flexGrow: 1, paddingTop: 16, paddingBottom: 40, paddingHorizontal: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#BFDBFE',
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  avatarBadge: {
    position: 'absolute', bottom: 2, right: 2,
    backgroundColor: '#0066FF', width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2.5, borderColor: '#F8FAFC',
  },
  avatarHint: { color: '#64748B', fontSize: 12, marginTop: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 22,
    shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
  },
  fieldGroup: { marginBottom: 16 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F1F5F9', borderRadius: 14, height: 56,
    paddingHorizontal: 14, borderWidth: 1.5, borderColor: 'transparent',
  },
  inputError: { borderColor: '#EF4444' },
  input: { flex: 1, fontSize: 15, fontWeight: '500', color: '#0F172A', paddingHorizontal: 8 },
  iconLeft: { marginRight: 6 },
  iconRight: { marginLeft: 6 },
  errText: { color: '#EF4444', fontSize: 12, marginTop: 4, textAlign: 'right' },
  btnPrimary: {
    backgroundColor: '#0066FF', height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#0066FF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, marginTop: 6, marginBottom: 20,
  },
  btnDisabled: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 14, fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  btnGoogle: {
    flexDirection: 'row', height: 56, borderRadius: 14, borderWidth: 1.5,
    borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
  },
  btnGoogleText: { marginLeft: 10, fontSize: 15, fontWeight: '700', color: '#334155' },
  footer: { flexDirection: 'row-reverse', justifyContent: 'center', marginTop: 24, alignItems: 'center' },
  footerText: { color: '#64748B', fontSize: 14 },
  footerLink: { color: '#0066FF', fontSize: 14, fontWeight: 'bold' },
});
