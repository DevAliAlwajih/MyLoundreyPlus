import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../../hooks/useInvoices';
import { useThemeStore } from '../../stores/themeStore';

interface DeferredInvoiceCardProps {
  invoice: Invoice;
  onRecordPayment: (invoice: Invoice) => void;
}

export const DeferredInvoiceCard: React.FC<DeferredInvoiceCardProps> = ({ invoice, onRecordPayment }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();

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
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.invoiceNumber, { color: colors.text }]}>{invoice.invoiceNumber}</Text>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formattedDate}</Text>
      </View>

      <View style={[styles.row, { backgroundColor: colors.background }]}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.total')}</Text>
          <Text style={[styles.totalVal, { color: colors.text }]}>{invoice.total.toFixed(2)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('crm.paidAmount')}</Text>
          <Text style={styles.paidVal}>{paidAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('crm.remaining')}</Text>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e74c3c',
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
  },
  dateText: {
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  col: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
  },
  totalVal: {
    fontSize: 14,
    fontWeight: 'bold',
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
