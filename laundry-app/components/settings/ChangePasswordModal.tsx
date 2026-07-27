import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '../auth/PasswordInput';
import { useChangePassword } from '../../hooks/useSettings';
import { useThemeStore } from '../../stores/themeStore';

const schema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Must be at least 8 characters').regex(/\d/, 'Must contain at least 1 number'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const mutation = useChangePassword();
  const { colors } = useThemeStore();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data, {
      onSuccess: () => {
        Alert.alert('Success', t('settings.passwordChanged'));
        reset();
        onClose();
      },
      onError: (err: any) => {
        Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
      }
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{t('settings.changePassword')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="currentPassword"
              render={({ field: { onChange, value } }) => (
                <PasswordInput 
                  placeholder={t('settings.currentPassword')} 
                  value={value} 
                  onChangeText={onChange} 
                  error={errors.currentPassword?.message} 
                />
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, value } }) => (
                <PasswordInput 
                  placeholder={t('settings.newPassword')} 
                  value={value} 
                  onChangeText={onChange} 
                  error={errors.newPassword?.message} 
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <PasswordInput 
                  placeholder={t('settings.confirmPassword')} 
                  value={value} 
                  onChangeText={onChange} 
                  error={errors.confirmPassword?.message} 
                />
              )}
            />

            <TouchableOpacity 
              style={[styles.submitBtn, { backgroundColor: colors.primary }, mutation.isPending && styles.disabledBtn]} 
              onPress={handleSubmit(onSubmit)} 
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('settings.changePassword')}</Text>}
            </TouchableOpacity>

          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
