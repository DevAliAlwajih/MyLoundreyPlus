import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useInvoiceStore } from '../../stores/invoiceStore';

export const TotalsSummary: React.FC = () => {
  const { t } = useTranslation();
  const { 
    subtotal, 
    discountPercent, 
    discountAmount, 
    urgencyFeeAmount, 
    taxPercent, 
    taxAmount, 
    total,
    isUrgent,
    setDiscount 
  } = useInvoiceStore();

  return (
    <View style={styles.container}>
      {/* Subtotal */}
      <View style={styles.row}>
        <Text style={styles.label}>{t('invoice.subtotal')}</Text>
        <Text style={styles.value}>{subtotal.toFixed(2)} ر.س</Text>
      </View>

      {/* Discount */}
      <View style={styles.row}>
        <View style={styles.discountLabelContainer}>
          <Text style={styles.label}>{t('invoice.discount')} (%)</Text>
          <TextInput
            style={styles.discountInput}
            keyboardType="numeric"
            value={discountPercent.toString()}
            onChangeText={(val) => setDiscount(Number(val))}
            maxLength={3}
            textAlign="center"
          />
        </View>
        <Text style={styles.valueNegative}>- {discountAmount.toFixed(2)} ر.س</Text>
      </View>

      {/* Urgency Fee */}
      {isUrgent && (
        <View style={styles.row}>
          <Text style={styles.label}>{t('invoice.urgencyFee')}</Text>
          <Text style={styles.valuePositive}>+ {urgencyFeeAmount.toFixed(2)} ر.س</Text>
        </View>
      )}

      {/* Tax */}
      <View style={styles.row}>
        <Text style={styles.label}>{t('invoice.tax')} ({taxPercent}%)</Text>
        <Text style={styles.valuePositive}>+ {taxAmount.toFixed(2)} ر.س</Text>
      </View>

      <View style={styles.divider} />

      {/* Total */}
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t('invoice.total')}</Text>
        <Text style={styles.totalValue}>{total.toFixed(2)} ر.س</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  valueNegative: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '500',
  },
  valuePositive: {
    fontSize: 14,
    color: '#1a5fa8',
    fontWeight: '500',
  },
  discountLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    width: 40,
    height: 28,
    padding: 0,
    marginLeft: 8,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5fa8',
  },
});
