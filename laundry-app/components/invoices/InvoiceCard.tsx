import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Invoice } from '../../hooks/useInvoices';
import { StatusBadge } from './StatusBadge';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onPress }) => {
  const { t, i18n } = useTranslation();

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'cash': return 'cash-outline';
      case 'card': return 'card-outline';
      case 'deferred': return 'time-outline';
      case 'electronic': return 'phone-portrait-outline';
      default: return 'cash-outline';
    }
  };

  const formattedDate = new Date(invoice.createdAt).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
        <StatusBadge status={invoice.status} />
      </View>
      
      <View style={styles.row}>
        <Ionicons name="person-outline" size={16} color="#666" />
        <Text style={styles.customerName}>{invoice.customerName || t('invoice.customer')}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.amountContainer}>
          <Text style={styles.totalText}>{(Number(invoice.total ?? (invoice as any).totalAmount) || 0).toFixed(2)} ر.س</Text>
          <Ionicons name={getPaymentIcon(invoice.paymentType)} size={16} color="#1a5fa8" style={styles.paymentIcon} />
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.dateText}>{formattedDate}</Text>
          {invoice.expectedDeliveryAt && (
            <Text style={styles.expectedDateText}>
              {t('invoice.expectedDelivery')}: {new Date(invoice.expectedDeliveryAt).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      </View>

      {invoice.isUrgent && (
        <View style={styles.urgentBadge}>
          <Ionicons name="flash" size={12} color="#fff" />
          <Text style={styles.urgentText}>{t('invoice.urgent')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerName: {
    marginLeft: 8,
    fontSize: 15,
    color: '#444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5fa8',
  },
  paymentIcon: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
  },
  expectedDateText: {
    fontSize: 11,
    color: '#e74c3c',
    marginTop: 2,
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    left: 16, // Assuming LTR base, React Native flips this if I18nManager.isRTL is true
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
