import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Booking } from '../../stores/bookingStore';

interface RejectBottomSheetProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting: boolean;
}

const PRESET_KEYS = ['closed', 'full', 'holiday', 'other'] as const;

export const RejectBottomSheet: React.FC<RejectBottomSheetProps> = ({
  visible, booking, onClose, onConfirm, isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleConfirm = () => {
    if (reason.trim().length < 10) {
      setError(t('bookings.rejectReasonLength'));
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handlePreset = (key: typeof PRESET_KEYS[number]) => {
    setReason(t(`bookings.presetReasons.${key}`));
    setError('');
  };

  if (!booking) return null;

  const scheduledDate = new Date(booking.scheduledAt).toLocaleString(i18n.language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{t('bookings.rejectTitle')}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Booking Info */}
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{booking.customerName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{scheduledDate}</Text>
                </View>
              </View>

              {/* Preset Chips */}
              <Text style={styles.label}>{t('bookings.rejectReason')}</Text>
              <View style={styles.presetContainer}>
                {PRESET_KEYS.map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.presetChip,
                      reason === t(`bookings.presetReasons.${key}`) && styles.presetChipActive,
                    ]}
                    onPress={() => handlePreset(key)}
                  >
                    <Text style={[
                      styles.presetText,
                      reason === t(`bookings.presetReasons.${key}`) && styles.presetTextActive,
                    ]}>
                      {t(`bookings.presetReasons.${key}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reason Input */}
              <TextInput
                style={[styles.textArea, error ? styles.textAreaError : null]}
                value={reason}
                onChangeText={(v) => { setReason(v); setError(''); }}
                placeholder={t('bookings.writeReasonHere')}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                textAlign="right"
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, isSubmitting && styles.disabledBtn]}
                  onPress={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.rejectBtnText}>{t('bookings.confirmReject')}</Text>
                  }
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
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
  infoBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
    textAlign: 'right',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  presetChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    backgroundColor: '#fff',
  },
  presetChipActive: {
    backgroundColor: '#fdecea',
    borderColor: '#e74c3c',
  },
  presetText: {
    fontSize: 13,
    color: '#555',
  },
  presetTextActive: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  textAreaError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 16,
  },
  rejectBtn: {
    flex: 2,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
