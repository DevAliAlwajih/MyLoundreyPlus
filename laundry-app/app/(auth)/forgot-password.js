import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';
import { translations } from '../../src/constants/i18n';
import useSettingsStore from '../../src/store/useSettingsStore';
import api from '../../src/services/api';

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { language, isDark } = useSettingsStore();
  const t = translations[language];
  const isRTL = language === 'AR';

  const [email, setEmail]       = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]           = useState(false);

  const bg     = isDark ? '#0F172A' : '#F4F5F7';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputBg= isDark ? '#0F172A' : '#F4F5F7';
  const textC  = isDark ? '#F8FAFC' : '#172B4D';
  const subC   = isDark ? '#94A3B8' : '#5E6C84';

  const handleSend = async () => {
    if (!email) { setEmailError(t.emailRequired); return; }
    if (!validateEmail(email)) { setEmailError(t.emailInvalid); return; }
    setIsLoading(true);
    try {
      // This endpoint would need to be added to the backend
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || (language === 'AR' ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again');
      Alert.alert(language === 'AR' ? 'خطأ' : 'Error', msg);
    }
    setIsLoading(false);
  };

  if (sent) {
    return (
      <View style={[styles.root, { backgroundColor: bg }]}>
        <View style={[styles.card, { backgroundColor: cardBg, margin: 24, marginTop: 120 }]}>
          <View style={styles.successIcon}>
            <Ionicons name="mail-unread" size={56} color={COLORS.primary} />
          </View>
          <Text style={[styles.successTitle, { color: textC, textAlign: 'center' }]}>
            {language === 'AR' ? 'تم الإرسال!' : 'Email Sent!'}
          </Text>
          <Text style={[styles.successSub, { color: subC, textAlign: 'center' }]}>
            {language === 'AR'
              ? `تم إرسال رابط استعادة كلمة المرور إلى\n${email}`
              : `A password reset link was sent to\n${email}`}
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>{t.backToLogin}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.forgotTitle}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.iconWrapper}>
            <Ionicons name="lock-open-outline" size={64} color={COLORS.primary} />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardTitle, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}>{t.forgotTitle}</Text>
            <Text style={[styles.cardSub, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.forgotSub}</Text>

            <Text style={[styles.fieldLabel, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.emailLabel}</Text>
            <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: emailError ? COLORS.danger : 'transparent' }]}>
              <Ionicons name="mail-outline" size={20} color={subC} style={{ marginRight: 10 }} />
              <TextInput
                style={[styles.input, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={t.emailPlaceholder} placeholderTextColor={subC}
                keyboardType="email-address" autoCapitalize="none"
                value={email} onChangeText={v => { setEmail(v); setEmailError(''); }}
              />
            </View>
            {emailError ? <Text style={[styles.errText, { textAlign: isRTL ? 'right' : 'left' }]}>{emailError}</Text> : null}

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }, isLoading && styles.btnDisabled]}
              onPress={handleSend} disabled={isLoading}>
              <Text style={styles.primaryBtnText}>
                {isLoading ? (language === 'AR' ? 'جاري الإرسال...' : 'Sending...') : t.sendResetBtn}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={16} color={COLORS.primary} />
              <Text style={styles.backLinkText}>{t.backToLogin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#fff' },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  iconWrapper: { alignItems: 'center', marginVertical: 24 },
  card: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  cardTitle: { fontSize: 24, fontWeight: '900', marginBottom: 8 },
  cardSub: { fontSize: 14, lineHeight: 22, marginBottom: 24 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, height: 56, paddingHorizontal: 14,
    borderWidth: 1.5, marginBottom: 4,
  },
  input: { flex: 1, fontSize: 15 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, marginBottom: 16,
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8 },
  backLinkText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  // Success state
  successIcon: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  successTitle: { fontSize: 26, fontWeight: '900', marginBottom: 12 },
  successSub: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
});
