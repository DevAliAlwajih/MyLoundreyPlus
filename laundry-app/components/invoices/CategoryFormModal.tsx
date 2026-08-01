import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CatalogCategory, useCreateCategory, useUpdateCategory } from '../../hooks/useInvoices';
import { useThemeStore } from '../../stores/themeStore';

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  category?: CatalogCategory | null; // if null, it's create mode
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ visible, onClose, category }) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  
  const isEdit = !!category;

  const schema = z.object({
    name: z.string().min(1, { message: t('auth.validation.required') }),
    sortOrder: z.string().optional(),
    isActive: z.boolean(),
  });

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      sortOrder: '0',
      isActive: true,
    }
  });

  useEffect(() => {
    if (visible && category) {
      reset({
        name: category.categoryName,
        sortOrder: category.sortOrder?.toString() || '0',
        isActive: category.isActive,
      });
    } else if (visible && !category) {
      reset({
        name: '',
        sortOrder: '0',
        isActive: true,
      });
    }
  }, [visible, category, reset]);

  const onSubmit = (data: FormValues) => {
    const sortOrderNum = data.sortOrder ? Number(data.sortOrder) : 0;

    if (isEdit && category) {
      updateMutation.mutate({
        id: category.categoryId,
        name: data.name,
        sortOrder: sortOrderNum,
        isActive: data.isActive,
      }, {
        onSuccess: () => onClose(),
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || err.message || t('auth.errors.default'));
        }
      });
    } else {
      // 🔑 CRITICAL: Do not pass `isActive` when creating a new category because NestJS CreateCategoryDto forbids non-whitelisted properties
      createMutation.mutate({
        name: data.name,
        sortOrder: sortOrderNum,
      }, {
        onSuccess: () => onClose(),
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || err.message || t('auth.errors.default'));
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const styles = getStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? t('catalog.editCategory') : t('catalog.addCategory')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* Category Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('catalog.categoryName')} *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} textAlign="right" />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            {/* Sort Order */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('catalog.sortOrder')} {t('invoice.optional')}</Text>
              <Controller
                control={control}
                name="sortOrder"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" textAlign="left" />
                )}
              />
            </View>

            {/* Active Toggle (Only in Edit mode) */}
            {isEdit && (
              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity style={styles.activeToggle} onPress={() => onChange(!value)}>
                    <Ionicons name={value ? 'checkbox' : 'square-outline'} size={24} color={value ? colors.primary : colors.textMuted} />
                    <Text style={styles.activeText}>{t('invoice.active')}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('common.save')}</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
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
    color: colors.text,
  },
  form: {
    marginBottom: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  activeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  activeText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text,
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
