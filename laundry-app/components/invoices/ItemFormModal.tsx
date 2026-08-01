import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, FlatList, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CatalogItem, CatalogCategory, useCreateCatalogItem, useUpdateCatalogItem } from '../../hooks/useInvoices';
import { useThemeStore } from '../../stores/themeStore';

interface ItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  item?: CatalogItem | null; // if null, it's create mode
  categories: CatalogCategory[];
  initialCategoryId?: string;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({ visible, onClose, item, categories, initialCategoryId }) => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const createMutation = useCreateCatalogItem();
  const updateMutation = useUpdateCatalogItem();
  
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const isEdit = !!item;

  const schema = z.object({
    nameAr: z.string().min(1, { message: t('auth.validation.required') }),
    nameEn: z.string().optional(),
    categoryId: z.string().min(1, { message: t('auth.validation.required') }),
    basePrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, { message: 'Must be a valid positive number' }),
    washing_price: z.string().optional(),
    ironing_price: z.string().optional(),
    sortOrder: z.string().optional(),
    isActive: z.boolean(),
  });

  type FormValues = z.infer<typeof schema>;

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      categoryId: initialCategoryId || (categories[0]?.categoryId ?? ''),
      basePrice: '',
      washing_price: '',
      ironing_price: '',
      sortOrder: '0',
      isActive: true,
    }
  });

  const selectedCategoryId = watch('categoryId');
  const selectedCategoryName = categories.find(c => c.categoryId === selectedCategoryId)?.categoryName || t('catalog.categoryName');

  useEffect(() => {
    if (visible && item) {
      // Find which category this item belongs to
      let foundCatId = initialCategoryId || categories[0]?.categoryId;
      for (const cat of categories) {
        if (cat.items.some(i => i.itemId === item.itemId)) {
          foundCatId = cat.categoryId;
          break;
        }
      }

      reset({
        nameAr: item.nameAr,
        nameEn: item.nameEn || '',
        categoryId: foundCatId,
        basePrice: item.fullServicePrice.toString(),
        washing_price: item.washingPrice ? item.washingPrice.toString() : '',
        ironing_price: item.ironingPrice ? item.ironingPrice.toString() : '',
        sortOrder: item.sortOrder.toString(),
        isActive: item.isActive,
      });
    } else if (visible && !item) {
      reset({
        nameAr: '',
        nameEn: '',
        categoryId: initialCategoryId || (categories[0]?.categoryId ?? ''),
        basePrice: '',
        washing_price: '',
        ironing_price: '',
        sortOrder: '0',
        isActive: true,
      });
    }
  }, [visible, item, reset, initialCategoryId, categories]);

  const onSubmit = (data: FormValues) => {
    const payload = {
      categoryId: data.categoryId,
      nameAr: data.nameAr,
      nameEn: data.nameEn || undefined,
      basePrice: Number(data.basePrice),
      washing_price: data.washing_price ? Number(data.washing_price) : undefined,
      ironing_price: data.ironing_price ? Number(data.ironing_price) : undefined,
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      isActive: data.isActive,
    };

    if (isEdit && item) {
      updateMutation.mutate({ id: item.itemId, ...payload }, {
        onSuccess: () => onClose(),
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || err.message || t('auth.errors.default'));
        }
      });
    } else {
      createMutation.mutate(payload, {
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
            <Text style={styles.title}>{isEdit ? t('invoice.editItem') : t('catalog.addItem')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Category Selection */}
            {!isEdit && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>{t('catalog.categoryName')} *</Text>
                <TouchableOpacity style={styles.pickerButton} onPress={() => setShowCategoryPicker(true)}>
                  <Text style={styles.pickerText}>{selectedCategoryName}</Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                {errors.categoryId && <Text style={styles.errorText}>{errors.categoryId.message}</Text>}
              </View>
            )}

            {/* Arabic Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('invoice.itemNameAr')} *</Text>
              <Controller
                control={control}
                name="nameAr"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} textAlign="right" />
                )}
              />
              {errors.nameAr && <Text style={styles.errorText}>{errors.nameAr.message}</Text>}
            </View>

            {/* English Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('invoice.itemNameEn')} {t('invoice.optional')}</Text>
              <Controller
                control={control}
                name="nameEn"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={styles.input} value={value} onChangeText={onChange} textAlign="left" />
                )}
              />
            </View>

            {/* Prices */}
            <View style={styles.row}>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>{t('catalog.fullPrice')} *</Text>
                <Controller
                  control={control}
                  name="basePrice"
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" textAlign="left" placeholder="0.00" />
                  )}
                />
                {errors.basePrice && <Text style={styles.errorText}>{errors.basePrice.message}</Text>}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.flexHalf, { marginRight: 10 }]}>
                <Text style={styles.label}>{t('catalog.washingPrice')} {t('invoice.optional')}</Text>
                <Controller
                  control={control}
                  name="washing_price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" textAlign="left" placeholder="0.00" />
                  )}
                />
              </View>
              <View style={styles.flexHalf}>
                <Text style={styles.label}>{t('catalog.ironingPrice')} {t('invoice.optional')}</Text>
                <Controller
                  control={control}
                  name="ironing_price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numeric" textAlign="left" placeholder="0.00" />
                  )}
                />
              </View>
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
                  <Ionicons name={value ? 'checkbox' : 'square-outline'} size={24} color={value ? colors.primary : colors.textMuted} />
                  <Text style={styles.activeText}>{t('invoice.active')}</Text>
                </TouchableOpacity>
              )}
            />
          </ScrollView>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={isPending}>
            {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{t('common.save')}</Text>}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </View>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="fade" transparent>
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowCategoryPicker(false)}>
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>{t('catalog.categoryName')}</Text>
            <FlatList
              data={categories}
              keyExtractor={(c) => c.categoryId}
              renderItem={({ item: cat }) => (
                <TouchableOpacity 
                  style={[styles.pickerItem, selectedCategoryId === cat.categoryId && styles.pickerItemActive]}
                  onPress={() => {
                    setValue('categoryId', cat.categoryId, { shouldValidate: true });
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedCategoryId === cat.categoryId && styles.pickerItemTextActive]}>
                    {cat.categoryName}
                  </Text>
                  {selectedCategoryId === cat.categoryId && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
    maxHeight: '90%',
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
    maxHeight: Platform.OS === 'ios' ? 450 : 500,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flexHalf: {
    flex: 1,
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
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.background,
  },
  pickerText: {
    fontSize: 16,
    color: colors.text,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: '100%',
    maxHeight: 400,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerItemActive: {
    backgroundColor: colors.background,
  },
  pickerItemText: {
    fontSize: 16,
    color: colors.text,
  },
  pickerItemTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});

