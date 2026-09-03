import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Customer } from '../../stores/crmStore';
import { useThemeStore } from '../../stores/themeStore';

interface CustomerCardProps {
  customer: Customer;
  onPress: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onPress }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();

  const deferredBalance = Number(customer.deferredBalance) || 0;
  const lastVisitDate = customer.lastVisit ? new Date(customer.lastVisit) : null;
  const formattedDate = lastVisitDate && !isNaN(lastVisitDate.getTime())
    ? lastVisitDate.toLocaleDateString(i18n.language, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '--';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameRow}>
          <Ionicons name="person-circle" size={24} color={colors.primary} />
          <Text style={[styles.name, { color: colors.text }]}>
            {customer.customerName || t('crm.unregisteredCustomer')}
          </Text>
        </View>
        <Text style={[styles.phone, { color: colors.textSecondary }]}>
          {customer.customerPhone || '--'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('crm.lastVisit')}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{formattedDate}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('invoice.title')}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{customer.totalInvoices || 0} {t('crm.visits')}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('crm.deferredBalance')}</Text>
          <Text style={[styles.statValue, deferredBalance > 0 ? styles.debtValue : styles.noDebtValue]}>
            {deferredBalance.toFixed(2)} ر.س
          </Text>
        </View>
      </View>
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  phone: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  debtValue: {
    color: '#e74c3c',
  },
  noDebtValue: {
    color: '#2ecc71',
  },
});
