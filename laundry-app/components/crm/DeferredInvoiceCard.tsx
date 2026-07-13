import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../../hooks/useInvoices';

interface DeferredInvoiceCardProps {
  invoice: Invoice;
  onRecordPayment: (invoice: Invoice) => void;
}

export const DeferredInvoiceCard: React.FC<DeferredInvoiceCardProps> = ({ invoice, onRecordPayment }) => {
  const { t, i18n } = useTranslation();

  // Assuming paidAmount exists on invoice, otherwise defaulting to 0 for frontend logic
  const paidAmount = (invoice as any).paidAmount || 0;
  const remaining = invoice.total - paidAmount;

  if (remaining <= 0) return null;

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>{t('invoice.total')}</Text>
          <Text style={styles.totalVal}>{invoice.total.toFixed(2)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('crm.paidAmount')}</Text>
          <Text style={styles.paidVal}>{paidAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>{t('crm.remaining')}</Text>
          <Text style={styles.remVal}>{remaining.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.payBtn}
        onPress={() => onRecordPayment(invoice)}
      >
        <Text style={styles.payBtnText}>{t('crm.recordPayment')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e74c3c', // Red border to indicate debt
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  col: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  totalVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  paidVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  remVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  payBtn: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
