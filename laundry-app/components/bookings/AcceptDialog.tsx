import React, { useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Booking } from '../../stores/bookingStore';

interface AcceptDialogProps {
  visible: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (notes?: string) => void;
  isSubmitting: boolean;
}

export const AcceptDialog: React.FC<AcceptDialogProps> = ({
  visible, booking, onClose, onConfirm, isSubmitting,
}) => {
  const { t, i18n } = useTranslation();
  const [notes, setNotes] = useState('');

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  if (!booking) return null;

  const scheduledDate = new Date(booking.scheduledAt).toLocaleString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.dialog}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={44} color="#2ecc71" />
              </View>

              <Text style={styles.title}>{t('bookings.confirmAccept')}</Text>

              {/* Booking Details */}
              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('bookings.customer')}</Text>
                  <Text style={styles.detailValue}>{booking.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('bookings.appointment')}</Text>
                  <Text style={styles.detailValue}>{scheduledDate}</Text>
                </View>
              </View>

              {/* Optional Notes */}
              <TextInput
                style={styles.notesInput}
                placeholder={t('bookings.notesOptional')}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlign="right"
              />

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn, isSubmitting && styles.disabledBtn]}
                  onPress={handleConfirm}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.acceptText}>{t('bookings.accept')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  notesInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 20,
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelText: {
    color: '#666',
    fontSize: 15,
  },
  acceptBtn: {
    flex: 2,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
