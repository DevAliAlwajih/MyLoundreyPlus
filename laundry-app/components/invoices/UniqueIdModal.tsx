import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface UniqueIdModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (id: string) => void;
}

export const UniqueIdModal: React.FC<UniqueIdModalProps> = ({ visible, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [uniqueId, setUniqueId] = useState('');

  const handleSubmit = () => {
    if (uniqueId.trim()) {
      onSubmit(uniqueId.trim());
      setUniqueId('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Enter Customer ID</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Unique ID</Text>
          <TextInput
            style={styles.input}
            value={uniqueId}
            onChangeText={setUniqueId}
            placeholder="e.g. CUST-12345"
            autoCapitalize="characters"
          />

          <TouchableOpacity 
            style={[styles.submitBtn, !uniqueId.trim() && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={!uniqueId.trim()}
          >
            <Text style={styles.submitBtnText}>{t('common.ok') || 'Submit'}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: '#1a5fa8',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#a0c4e8',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
