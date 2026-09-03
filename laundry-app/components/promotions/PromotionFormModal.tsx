import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, Image, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Promotion, useCreatePromotion, useUpdatePromotion, useUploadPromotionImage } from '../../hooks/usePromotions';
import { useThemeStore } from '../../stores/themeStore';

const getSchema = (t: any) => z.object({
  title: z.string().min(3, t('promotions.validationTitle')),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: t('promotions.validationDate'),
  path: ["endDate"],
});

type FormData = z.infer<ReturnType<typeof getSchema>>;

interface PromotionFormModalProps {
  visible: boolean;
  promotion: Promotion | null;
  onClose: () => void;
}

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({ visible, promotion, onClose }) => {
  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const uploadImageMutation = useUploadPromotionImage();

  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const schema = getSchema(t);

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // Default 7 days
    }
  });

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const imageUrl = watch('imageUrl');

  useEffect(() => {
    if (visible && promotion) {
      reset({
        title: promotion.title,
        description: promotion.description || '',
        imageUrl: promotion.imageUrl || '',
        startDate: promotion.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: promotion.endDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      });
    } else if (visible && !promotion) {
      reset({
        title: '',
        description: '',
        imageUrl: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      });
    }
  }, [visible, promotion, reset]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImageMutation.mutate(result.assets[0].uri, {
        onSuccess: (url) => {
          setValue('imageUrl', url);
        },
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
        }
      });
    }
  };

  const onSubmit = (data: FormData) => {
    if (promotion) {
      updateMutation.mutate({ id: promotion.id, data }, {
        onSuccess: onClose
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: onClose
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{promotion ? t('promotions.editOffer') : t('promotions.newOffer')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('promotions.titleLabel')}</Text>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }, errors.title && styles.inputError]} value={value} onChangeText={onChange} />
                )}
              />
              {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('promotions.descLabel')}</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value } }) => (
                  <TextInput style={[styles.input, { minHeight: 80, borderColor: colors.border, color: colors.text }]} value={value} onChangeText={onChange} multiline textAlignVertical="top" />
                )}
              />

              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('promotions.imageLabel')}</Text>
              <View style={styles.imageSection}>
                {imageUrl ? (
                  <View style={styles.imageContainer}>
                    <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setValue('imageUrl', '')}>
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.uploadBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '11' }]} onPress={handlePickImage} disabled={uploadImageMutation.isPending}>
                    {uploadImageMutation.isPending ? (
                      <ActivityIndicator color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
                        <Text style={[styles.uploadText, { color: colors.primary }]}>{t('promotions.uploadImage')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('promotions.from')}</Text>
                  <TouchableOpacity style={[styles.dateBtn, { borderColor: colors.border }]} onPress={() => setShowStart(true)}>
                    <Text style={[styles.dateText, { color: colors.text }]}>{startDate}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.col}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>{t('promotions.to')}</Text>
                  <TouchableOpacity style={[styles.dateBtn, { borderColor: colors.border }]} onPress={() => setShowEnd(true)}>
                    <Text style={[styles.dateText, { color: colors.text }]}>{endDate}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {errors.endDate && <Text style={styles.errorText}>{errors.endDate.message}</Text>}

              {showStart && (
                <DateTimePicker
                  value={new Date(startDate)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => { setShowStart(Platform.OS === 'ios'); if(date) setValue('startDate', date.toISOString().split('T')[0]); }}
                />
              )}
              {showEnd && (
                <DateTimePicker
                  value={new Date(endDate)}
                  mode="date"
                  display="default"
                  onChange={(_, date) => { setShowEnd(Platform.OS === 'ios'); if(date) setValue('endDate', date.toISOString().split('T')[0]); }}
                />
              )}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }, isPending && styles.disabledBtn]} onPress={handleSubmit(onSubmit)} disabled={isPending}>
                {isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('promotions.saveOffer')}</Text>}
              </TouchableOpacity>
              
              <View style={{ height: 20 }} />
            </ScrollView>
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
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'left',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 16,
  },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateBtn: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
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

