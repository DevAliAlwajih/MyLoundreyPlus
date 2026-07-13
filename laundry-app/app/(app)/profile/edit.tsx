import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, 
  Platform, ScrollView, TextInput, ActivityIndicator, Alert, Image, Modal, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { useLaundryStore } from '../../../stores/laundryStore';
import { useAuthStore } from '../../../stores/authStore';
import { useUpdateProfile, useUploadLogo, useDeleteLogo } from '../../../hooks/useLaundryProfile';
import { useUpdateMe, useRequestEmailChange, useConfirmEmailChange } from '../../../hooks/useUserProfile';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  error: '#e74c3c',
  text: '#333',
  gray: '#666',
  border: '#ddd'
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { profile } = useLaundryStore();
  const { user, updateFullName, updateEmail } = useAuthStore();
  
  const updateLaundryMutation = useUpdateProfile();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();
  const updateMeMutation = useUpdateMe();
  const requestEmailMutation = useRequestEmailChange();
  const confirmEmailMutation = useConfirmEmailChange();

  // Email Change State
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailStep, setEmailStep] = useState<1 | 2>(1); // 1: Request, 2: Confirm
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const editSchema = z.object({
    fullName: z.string().min(2, { message: t('auth.validation.required') }),
    name: z.string().min(2, { message: t('auth.validation.required') }),
    nameAr: z.string().min(2, { message: t('auth.validation.required') }),
    phone: z.string().regex(/^[0-9]{7,}$/, { message: t('auth.validation.invalidPhone') }),
    tax_enabled: z.boolean().optional(),
    tax_rate: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    }, { message: t('profile.validation.taxRateInvalid') }),
    urgency_enabled: z.boolean().optional(),
    urgency_fee: z.string().optional().refine((val) => {
      if (!val) return true;
      const num = Number(val);
      return !isNaN(num) && num >= 0;
    }, { message: t('profile.validation.urgencyFeeInvalid') }),
  });

  type EditFormValues = z.infer<typeof editSchema>;

  const { control, handleSubmit, watch, formState: { errors, isDirty } } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      name: profile?.name || '',
      nameAr: profile?.nameAr || '',
      phone: profile?.phone || '',
      tax_enabled: profile?.tax_enabled ?? false,
      tax_rate: profile?.tax_rate !== null && profile?.tax_rate !== undefined ? String(profile.tax_rate) : '',
      urgency_enabled: profile?.urgency_enabled ?? false,
      urgency_fee: profile?.urgency_fee !== null && profile?.urgency_fee !== undefined ? String(profile.urgency_fee) : '',
    }
  });

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      uploadLogoMutation.mutate(result.assets[0].uri, {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('profile.logoSuccess'));
        },
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
        }
      });
    }
  };

  const handleDeleteLogo = () => {
    Alert.alert(
      t('profile.deleteLogo'),
      t('profile.deleteLogoConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.ok'), 
          style: 'destructive',
          onPress: () => {
            deleteLogoMutation.mutate(undefined, {
              onSuccess: () => Alert.alert(t('common.success'), t('profile.logoDeleted')),
              onError: (err: any) => Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'))
            });
          }
        }
      ]
    );
  };

  const onRequestEmailChange = () => {
    if (!newEmail.includes('@')) {
      Alert.alert(t('common.error'), t('auth.validation.invalidEmail'));
      return;
    }
    requestEmailMutation.mutate({ newEmail }, {
      onSuccess: () => {
        setEmailStep(2);
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
      }
    });
  };

  const onConfirmEmailChange = () => {
    if (otp.length < 6) return;
    confirmEmailMutation.mutate({ newEmail, otp }, {
      onSuccess: () => {
        updateEmail(newEmail);
        setEmailModalVisible(false);
        setNewEmail('');
        setOtp('');
        setEmailStep(1);
        Alert.alert(t('common.success'), t('profile.emailChanged'));
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
      }
    });
  };

  const onSubmit = async (data: EditFormValues) => {
    try {
      // Execute both mutations in parallel if fields changed
      const promises = [];
      
      if (data.fullName !== user?.fullName) {
        promises.push(
          updateMeMutation.mutateAsync({ fullName: data.fullName }).then(() => {
            updateFullName(data.fullName);
          })
        );
      }

      if (
        data.name !== profile?.name || 
        data.nameAr !== profile?.nameAr || 
        data.phone !== profile?.phone ||
        data.tax_enabled !== profile?.tax_enabled ||
        data.tax_rate !== String(profile?.tax_rate ?? '') ||
        data.urgency_enabled !== profile?.urgency_enabled ||
        data.urgency_fee !== String(profile?.urgency_fee ?? '')
      ) {
        promises.push(
          updateLaundryMutation.mutateAsync({
            name: data.name,
            nameAr: data.nameAr,
            phoneNumber: data.phone,
            tax_enabled: data.tax_enabled ?? false,
            tax_rate: data.tax_enabled && data.tax_rate ? Number(data.tax_rate) : 0,
            urgency_enabled: data.urgency_enabled ?? false,
            urgency_fee: data.urgency_enabled && data.urgency_fee ? Number(data.urgency_fee) : 0,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        Alert.alert(t('profile.title'), t('profile.updateSuccess'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      } else {
        router.back();
      }

    } catch (error: any) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('auth.errors.default'));
    }
  };

  const isSaving = updateLaundryMutation.isPending || updateMeMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('profile.edit')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Logo Section */}
          <View style={[styles.logoSection, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.logoContainer, isRTL ? { marginLeft: 16, marginRight: 0 } : { marginRight: 16 }]}>
              {profile?.logoUrl ? (
                <Image source={{ uri: profile.logoUrl }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#999" />
                </View>
              )}
              {uploadLogoMutation.isPending && (
                <View style={styles.logoOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>
            <View style={[styles.logoActions, isRTL && { alignItems: 'flex-end' }]}>
              <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage} disabled={uploadLogoMutation.isPending}>
                <Ionicons name="cloud-upload-outline" size={20} color={COLORS.primary} />
                <Text style={styles.uploadBtnText}>{t('profile.uploadLogo')}</Text>
              </TouchableOpacity>
              {profile?.logoUrl && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteLogo} disabled={deleteLogoMutation.isPending}>
                  <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  {deleteLogoMutation.isPending ? <ActivityIndicator color={COLORS.error} size="small"/> : <Text style={styles.deleteBtnText}>{t('profile.deleteLogo')}</Text>}
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.form}>
            {/* Full Name */}
            <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.ownerFullName')}</Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.fullName && styles.inputError, isRTL && styles.textRight]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.fullName && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.fullName.message}</Text>}
                </View>
              )}
            />

            {/* Laundry Name EN */}
            <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.laundryNameEn')}</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError, { textAlign: 'left' }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.name && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.name.message}</Text>}
                </View>
              )}
            />

            {/* Laundry Name AR */}
            <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.laundryNameAr')}</Text>
            <Controller
              control={control}
              name="nameAr"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.nameAr && styles.inputError, { textAlign: 'right' }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  {errors.nameAr && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.nameAr.message}</Text>}
                </View>
              )}
            />

            {/* Phone */}
            <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.phone')}</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.input, errors.phone && styles.inputError, { textAlign: 'left' }]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="phone-pad"
                  />
                  {errors.phone && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.phone.message}</Text>}
                </View>
              )}
            />

            {/* Email (Readonly with Change Button) */}
            <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.email')}</Text>
            <View style={[styles.emailContainer, isRTL && { flexDirection: 'row-reverse' }]}>
              <TextInput
                style={[styles.input, styles.emailInput, { textAlign: 'left' }]}
                value={user?.email || ''}
                editable={false}
              />
              <TouchableOpacity style={styles.changeEmailBtn} onPress={() => setEmailModalVisible(true)}>
                <Text style={styles.changeEmailText}>{t('profile.changeEmail')}</Text>
              </TouchableOpacity>
            </View>

            {/* Financial Settings */}
            <View style={[styles.sectionContainer, { marginTop: 20 }]}>
              <Text style={[styles.label, isRTL && styles.textRight, { fontSize: 16, fontWeight: 'bold', marginBottom: 16 }]}>
                {t('profile.financialSettings')}
              </Text>

              {/* Tax Enabled */}
              <View style={styles.switchRow}>
                <Text style={[styles.label, isRTL && styles.textRight, { marginBottom: 0 }]}>{t('profile.taxEnabled')}</Text>
                <Controller
                  control={control}
                  name="tax_enabled"
                  render={({ field: { onChange, value } }) => (
                    <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.primary }} />
                  )}
                />
              </View>

              {/* Tax Rate */}
              {watch('tax_enabled') && (
                <Controller
                  control={control}
                  name="tax_rate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputWithIcon, isRTL && { flexDirection: 'row-reverse' }]}>
                        <TextInput
                          style={[styles.input, { flex: 1, borderWidth: 0, minHeight: 48 }, isRTL && styles.textRight]}
                          placeholder={t('profile.taxRatePlaceholder')}
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                        <Text style={{ paddingHorizontal: 16, color: COLORS.gray, fontWeight: 'bold' }}>%</Text>
                      </View>
                      {errors.tax_rate && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.tax_rate.message}</Text>}
                    </View>
                  )}
                />
              )}

              {/* Urgency Enabled */}
              <View style={[styles.switchRow, { marginTop: 16 }]}>
                <Text style={[styles.label, isRTL && styles.textRight, { marginBottom: 0 }]}>{t('profile.urgencyEnabled')}</Text>
                <Controller
                  control={control}
                  name="urgency_enabled"
                  render={({ field: { onChange, value } }) => (
                    <Switch value={value} onValueChange={onChange} trackColor={{ true: COLORS.primary }} />
                  )}
                />
              </View>

              {/* Urgency Fee */}
              {watch('urgency_enabled') && (
                <Controller
                  control={control}
                  name="urgency_fee"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.inputContainer}>
                      <View style={[styles.inputWithIcon, isRTL && { flexDirection: 'row-reverse' }]}>
                        <TextInput
                          style={[styles.input, { flex: 1, borderWidth: 0, minHeight: 48 }, isRTL && styles.textRight]}
                          placeholder={t('profile.urgencyFeePlaceholder')}
                          keyboardType="numeric"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value}
                        />
                        <Text style={{ paddingHorizontal: 16, color: COLORS.gray }}>{t('common.sar')}</Text>
                      </View>
                      {errors.urgency_fee && <Text style={[styles.errorText, isRTL && styles.textRight]}>{errors.urgency_fee.message}</Text>}
                    </View>
                  )}
                />
              )}
            </View>

          </View>
        </ScrollView>

        {isDirty && (
          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit(onSubmit)}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('common.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Email Change Modal */}
      <Modal visible={emailModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.changeEmail')}</Text>
              <TouchableOpacity onPress={() => { setEmailModalVisible(false); setEmailStep(1); setNewEmail(''); setOtp(''); }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {emailStep === 1 ? (
              <View style={styles.modalBody}>
                <Text style={[styles.label, isRTL && styles.textRight]}>{t('profile.newEmail')}</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'left' }]}
                  placeholder="example@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={newEmail}
                  onChangeText={setNewEmail}
                />
                <TouchableOpacity 
                  style={[styles.submitButton, { marginTop: 20 }]} 
                  onPress={onRequestEmailChange}
                  disabled={requestEmailMutation.isPending || !newEmail}
                >
                  {requestEmailMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('profile.sendOtp')}</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={[styles.label, { color: COLORS.primary, marginBottom: 16 }, isRTL && styles.textRight]}>
                  {t('profile.emailOtpSent')}
                </Text>
                <Text style={[styles.label, isRTL && styles.textRight]}>OTP</Text>
                <TextInput
                  style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                  placeholder="123456"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
                <TouchableOpacity 
                  style={[styles.submitButton, { marginTop: 20 }]} 
                  onPress={onConfirmEmailChange}
                  disabled={confirmEmailMutation.isPending || otp.length < 6}
                >
                  {confirmEmailMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('profile.confirmOtp')}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoActions: {
    flex: 1,
    gap: 10
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#eef5ff',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  uploadBtnText: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  deleteBtnText: {
    color: COLORS.error,
    fontWeight: '600'
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  textRight: {
    textAlign: 'right'
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    color: '#888'
  },
  changeEmailBtn: {
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#eef5ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0e3ff'
  },
  changeEmailText: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  modalBody: {
    flex: 1
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  }
});
