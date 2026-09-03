import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

interface StatusBottomSheetProps {
  visible: boolean;
  currentStatus: string;
  onClose: () => void;
  onUpdate: (status: string, notes: string) => void;
  isUpdating: boolean;
}

export const StatusBottomSheet: React.FC<StatusBottomSheetProps> = ({ 
  visible, currentStatus, onClose, onUpdate, isUpdating 
}) => {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // State Machine map
  const getNextStates = (status: string): string[] => {
    switch (status) {
      case 'draft': return ['received', 'cancelled'];
      case 'received': return ['completed', 'cancelled'];
      default: return [];
    }
  };

  const nextStates = getNextStates(currentStatus);

  if (nextStates.length === 0) return null; // Terminal state

  const handleUpdate = () => {
    if (selectedStatus) {
      onUpdate(selectedStatus, notes);
      // Reset after update is complete from parent
      setNotes('');
      setSelectedStatus(null);
    }
  };

  const handleClose = () => {
    setNotes('');
    setSelectedStatus(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.sheet}
          >
            <View style={styles.header}>
              <Text style={styles.title}>{t('invoice.updateStatus')}</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {nextStates.map((state) => {
                const isCancelled = state === 'cancelled';
                const isSelected = selectedStatus === state;
                
                return (
                  <TouchableOpacity
                    key={state}
                    style={[
                      styles.statusButton,
                      isSelected && styles.statusButtonSelected,
                      isCancelled && styles.statusButtonCancelled,
                      isSelected && isCancelled && styles.statusButtonSelectedCancelled,
                    ]}
                    onPress={() => setSelectedStatus(state)}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      isSelected && styles.statusButtonTextSelected,
                      isCancelled && styles.statusButtonTextCancelled,
                    ]}>
                      {t(`invoice.status.${state}`)}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={isCancelled ? '#fff' : '#1a5fa8'} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.notesInput}
              placeholder={`${t('invoice.notes')} ${t('invoice.optional')}`}
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlign="right"
            />

            <TouchableOpacity 
              style={[styles.confirmButton, !selectedStatus && styles.confirmButtonDisabled]} 
              onPress={handleUpdate}
              disabled={!selectedStatus || isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>{t('invoice.confirm')}</Text>
              )}
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
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
  statusOptions: {
    marginBottom: 20,
  },
  statusButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  statusButtonSelected: {
    borderColor: '#1a5fa8',
    backgroundColor: '#f0f8ff',
  },
  statusButtonCancelled: {
    borderColor: '#ffebee',
  },
  statusButtonSelectedCancelled: {
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c',
  },
  statusButtonText: {
    fontSize: 16,
    color: '#333',
  },
  statusButtonTextSelected: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
  statusButtonTextCancelled: {
    color: '#e74c3c',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 15,
  },
  confirmButton: {
    backgroundColor: '#1a5fa8',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
