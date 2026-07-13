import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Invoice } from '../../hooks/useInvoices';

interface PaymentModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onClose: () => void;
  onSubmit: (paidAmount: number, paymentMethod: string) => void;
  isSubmitting: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ visible, invoice, onClose, onSubmit, isSubmitting }) => {
  const { t } = useTranslation();
  
  const [amountStr, setAmountStr] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'electronic'>('cash');

  const paidSoFar = invoice ? ((invoice as any).paidAmount || 0) : 0;
  const total = invoice ? invoice.total : 0;
  const remaining = total - paidSoFar;

  // Auto-fill max amount when opening
  useEffect(() => {
    if (visible && remaining > 0) {
      setAmountStr(remaining.toString());
      setMethod('cash');
    }
  }, [visible, remaining]);

  if (!visible || !invoice) return null;

  const enteredAmount = Number(amountStr) || 0;
  const isValid = enteredAmount > 0 && enteredAmount <= remaining;
  const isFullPayment = enteredAmount === remaining;

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(enteredAmount, method);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('crm.recordPayment')}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>{t('crm.invoiceNum')}: {invoice.invoiceNumber}</Text>
              <Text style={styles.remText}>{t('crm.remaining')}: {remaining.toFixed(2)} ر.س</Text>
            </View>

            <Text style={styles.label}>{t('crm.paidAmount')}</Text>
            <TextInput
              style={[styles.input, !isValid && amountStr !== '' && styles.inputError]}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={setAmountStr}
              textAlign="left"
            />
            {(!isValid && amountStr !== '') && (
              <Text style={styles.errorText}>{t('crm.invalidAmount')}</Text>
            )}

            {isFullPayment && (
              <Text style={styles.successText}>{t('crm.fullPayment')}</Text>
            )}

            <Text style={styles.label}>{t('crm.paymentMethod')}</Text>
            <View style={styles.methodsRow}>
              {['cash', 'card'].map(m => (
                <TouchableOpacity 
                  key={m}
                  style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                  onPress={() => setMethod(m as any)}
                >
                  <Ionicons name={m === 'cash' ? 'cash-outline' : 'card-outline'} size={20} color={method === m ? '#1a5fa8' : '#666'} />
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
                    {t(`invoice.payment.${m}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('crm.confirmPayment')}</Text>}
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  remText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
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
  successText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: -12,
    marginBottom: 12,
  },
  methodsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  methodBtnActive: {
    backgroundColor: '#f0f8ff',
    borderColor: '#1a5fa8',
  },
  methodText: {
    marginLeft: 8,
    color: '#666',
  },
  methodTextActive: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#1a5fa8',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
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
