import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CatalogCategory, useCreateCategory, useUpdateCategory } from '../../hooks/useInvoices';

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  category?: CatalogCategory | null; // if null, it's create mode
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ visible, onClose, category }) => {
  const { t } = useTranslation();
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
        sortOrder: category.sortOrder.toString(),
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
    const payload = {
      name: data.name,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      isActive: data.isActive,
    };

    if (isEdit && category) {
      updateMutation.mutate({ id: category.categoryId, ...payload }, {
        onSuccess: () => onClose(),
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onClose(),
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? t('catalog.editCategory') : t('catalog.addCategory')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
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

            {/* Active Toggle */}
            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity style={styles.activeToggle} onPress={() => onChange(!value)}>
                  <Ionicons name={value ? 'checkbox' : 'square-outline'} size={24} color={value ? '#1a5fa8' : '#ccc'} />
                  <Text style={styles.activeText}>{t('invoice.active')}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('common.save')}</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  form: {
    marginBottom: 10,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#e74c3c',
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
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#1a5fa8',
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
