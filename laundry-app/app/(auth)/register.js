import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Modal, Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../src/constants/theme';
import { translations, countries } from '../../src/constants/i18n';
import useLaundryStore from '../../src/store/useLaundryStore';
import useSettingsStore from '../../src/store/useSettingsStore';

const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function RegisterScreen() {
  const router = useRouter();
  const { registerAsync, isLoading, token } = useLaundryStore();
  const { language, isDark, toggleLanguage, toggleTheme } = useSettingsStore();
  const t = translations[language];
  const isRTL = language === 'AR';

  const [form, setForm] = useState({
    ownerName: '', laundryName: '', phone: '',
    email: '', password: '', confirm: '', country: 'SA',
  });
  const [logo, setLogo] = useState(null);
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const bg      = isDark ? '#0F172A' : '#F4F5F7';
  const cardBg  = isDark ? '#1E293B' : '#FFFFFF';
  const inputBg = isDark ? '#0F172A' : '#F4F5F7';
  const textC   = isDark ? '#F8FAFC' : '#172B4D';
  const subC    = isDark ? '#94A3B8' : '#5E6C84';
  const borderC = isDark ? '#334155' : '#DFE1E6';

  useEffect(() => { if (token) router.replace('/(tabs)/dashboard'); }, [token]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    setFieldErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.ownerName.trim())     errs.ownerName    = t.nameRequired;
    if (!form.laundryName.trim())   errs.laundryName  = t.laundryNameRequired;
    if (!form.phone.trim())         errs.phone        = t.phoneRequired;
    if (!form.email)                errs.email        = t.emailRequired;
    else if (!validateEmail(form.email)) errs.email   = t.emailInvalid;
    if (!form.password)             errs.password     = t.passwordRequired;
    else if (form.password.length < 8) errs.password  = t.passwordMin;
    if (!form.confirm)              errs.confirm      = t.confirmRequired;
    else if (form.password !== form.confirm) errs.confirm = t.confirmMismatch;
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('full_name', form.ownerName.trim());
    formData.append('phone_number', form.phone.trim());
    formData.append('email', form.email.trim().toLowerCase());
    formData.append('password', form.password);
    formData.append('role', 'laundry');
    formData.append('laundry_name', form.laundryName.trim());
    formData.append('country', form.country);

    if (logo) {
      const filename = logo.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      formData.append('avatar', { uri: logo, name: filename, type });
    }

    const result = await registerAsync(formData);
    if (result.success) {
      Alert.alert('✅ تم', 'تم إنشاء حساب المغسلة بنجاح!', [
        { text: 'ابدأ الآن', onPress: () => router.replace('/(tabs)/dashboard') },
      ]);
    }
  };

  const selectedCountry = countries.find(c => c.code === form.country);

  const renderField = (key, label, placeholder, opts = {}) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={[styles.inputRow, { backgroundColor: inputBg, borderColor: fieldErrors[key] ? COLORS.danger : 'transparent' }]}>
        {opts.icon && <Ionicons name={opts.icon} size={20} color={subC} style={styles.iconLeft} />}
        <TextInput
          style={[styles.input, { color: textC, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={placeholder} placeholderTextColor={subC}
          secureTextEntry={opts.secure && !opts.showPass}
          keyboardType={opts.keyboard || 'default'}
          autoCapitalize={opts.noCapitalize ? 'none' : 'words'}
          value={form[key]}
          onChangeText={v => set(key, v)}
        />
        {opts.togglePass && (
          <TouchableOpacity onPress={opts.togglePass} style={{ padding: 4 }}>
            <Ionicons name={opts.showPass ? 'eye-outline' : 'eye-off-outline'} size={20} color={subC} />
          </TouchableOpacity>
        )}
      </View>
      {fieldErrors[key] ? <Text style={[styles.errText, { textAlign: isRTL ? 'right' : 'left' }]}>{fieldErrors[key]}</Text> : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.registerTitle}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={toggleLanguage}>
            <Text style={styles.headerBtnText}>{language === 'AR' ? 'EN' : 'ع'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.cardSub, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.registerSub}</Text>

            {/* Logo Picker */}
            <TouchableOpacity style={styles.logoPicker} onPress={pickImage}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={subC} />
                  <Text style={{ color: subC, fontSize: 12, marginTop: 4 }}>{language === 'AR' ? 'شعار المغسلة' : 'Laundry Logo'}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Owner Name */}
            {renderField('ownerName', t.ownerNameLabel, t.ownerNamePlaceholder, { icon: 'person-outline' })}
            {/* Laundry Name */}
            {renderField('laundryName', t.laundryNameLabel, t.laundryNamePlaceholder, { icon: 'business-outline' })}
            {/* Phone */}
            {renderField('phone', t.phoneLabel, t.phonePlaceholder, { icon: 'call-outline', keyboard: 'phone-pad', noCapitalize: true })}
            {/* Email */}
            {renderField('email', t.emailLabel, t.emailPlaceholder, { icon: 'mail-outline', keyboard: 'email-address', noCapitalize: true })}
            {/* Password */}
            {renderField('password', t.passwordLabel, t.passwordPlaceholder, {
              icon: 'lock-closed-outline', secure: true, showPass, togglePass: () => setShowPass(v => !v), noCapitalize: true,
            })}
            {/* Confirm Password */}
            {renderField('confirm', t.confirmPasswordLabel, t.confirmPasswordPlaceholder, {
              icon: 'shield-checkmark-outline', secure: true, showPass: showConfirm, togglePass: () => setShowConfirm(v => !v), noCapitalize: true,
            })}

            {/* Country Selector */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: subC, textAlign: isRTL ? 'right' : 'left' }]}>{t.countryLabel}</Text>
              <TouchableOpacity
                style={[styles.inputRow, { backgroundColor: inputBg, borderColor: 'transparent' }]}
                onPress={() => setShowCountry(true)}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{selectedCountry?.flag}</Text>
                <Text style={[{ flex: 1, fontSize: 15, color: textC }]}>
                  {language === 'AR' ? selectedCountry?.name_ar : selectedCountry?.name_en}
                </Text>
                <Ionicons name="chevron-down" size={18} color={subC} />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
              onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}>
              <Text style={styles.primaryBtnText}>{isLoading ? t.registerLoading : t.registerBtn}</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.footerText, { color: subC }]}>{t.hasAccount} </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.footerLink}>{t.loginLink}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal visible={showCountry} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textC }]}>{t.countryLabel}</Text>
              <TouchableOpacity onPress={() => setShowCountry(false)}>
                <Ionicons name="close-circle" size={28} color={subC} />
              </TouchableOpacity>
            </View>
            {countries.map(c => (
              <TouchableOpacity key={c.code}
                style={[styles.countryRow, form.country === c.code && { backgroundColor: COLORS.primaryLight }]}
                onPress={() => { set('country', c.code); setShowCountry(false); }}>
                <Text style={{ fontSize: 24, marginRight: 12 }}>{c.flag}</Text>
                <Text style={[styles.countryName, { color: textC }]}>
                  {language === 'AR' ? c.name_ar : c.name_en}
                </Text>
                <Text style={{ color: subC, fontSize: 13 }}>{c.currency}</Text>
                {form.country === c.code && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  headerRight: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  scroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  card: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  cardSub: { fontSize: 14, marginBottom: 24 },
  logoPicker: {
    alignSelf: 'center', width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F1F5F9', borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24, overflow: 'hidden'
  },
  logoImage: { width: '100%', height: '100%' },
  logoPlaceholder: { alignItems: 'center' },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, height: 56, paddingHorizontal: 14,
    borderWidth: 1.5,
  },
  iconLeft: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  errText: { color: COLORS.danger, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6, marginTop: 8, marginBottom: 20,
  },
  btnDisabled: { backgroundColor: '#93C5FD' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerRow: { justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '800' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  countryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 6 },
  countryName: { flex: 1, fontSize: 15, fontWeight: '600' },
});
