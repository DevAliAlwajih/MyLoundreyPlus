import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface PaymentBreakdownRowProps {
  type: 'cash' | 'card' | 'deferred' | 'electronic';
  amount: number;
  count: number;
  totalAmount: number;
}

export const PaymentBreakdownRow: React.FC<PaymentBreakdownRowProps> = ({ type, amount, count, totalAmount }) => {
  const { t } = useTranslation();

  const getDetails = () => {
    switch (type) {
      case 'cash': return { icon: '💵', label: t('invoice.payment.cash'), color: '#2ecc71' };
      case 'card': return { icon: '💳', label: t('invoice.payment.card'), color: '#3498db' };
      case 'deferred': return { icon: '📋', label: t('invoice.payment.deferred'), color: '#f39c12' };
      case 'electronic': return { icon: '📱', label: t('invoice.payment.electronic'), color: '#9b59b6' };
    }
  };

  const details = getDetails();
  // Avoid division by zero
  const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
  
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.labelCol}>
          <Text style={styles.icon}>{details.icon}</Text>
          <Text style={styles.label}>{details.label}</Text>
        </View>
        <Text style={styles.amount}>{amount.toFixed(2)} {t('reports.currency')}</Text>
        <Text style={styles.count}>({count} {t('reports.invoices')})</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: details.color }]} />
        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100, // Fixed width for alignment
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  count: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    width: 70, // Fixed width
    textAlign: 'left',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    minWidth: '2%', // Make sure even 0% is slightly visible if needed, or 0%
  },
  percentage: {
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
  },
});
