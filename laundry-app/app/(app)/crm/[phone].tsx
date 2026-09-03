import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCustomerDetail, useRecordPayment } from '../../../hooks/useCRM';
import { CustomerSummary } from '../../../components/crm/CustomerSummary';
import { DeferredInvoiceCard } from '../../../components/crm/DeferredInvoiceCard';
import { InvoiceCard } from '../../../components/invoices/InvoiceCard';
import { PaymentModal } from '../../../components/crm/PaymentModal';
import { Invoice } from '../../../hooks/useInvoices';
import { useThemeStore } from '../../../stores/themeStore';


export default function CustomerDetailScreen() {
  const { phone } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemeStore();

  const phoneStr = Array.isArray(phone) ? phone[0] : phone;
  
  const { data: customer, isLoading, isError, refetch } = useCustomerDetail(phoneStr as string);
  const paymentMutation = useRecordPayment();

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !customer) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: '#e74c3c' }}>{t('crm.failedToLoadDetail')}</Text>
        <TouchableOpacity onPress={() => refetch()}><Text style={{ color: colors.primary }}>{t('common.retry')}</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Filter deferred unpaid invoices
  const deferredInvoices = customer.invoices.filter(inv => 
    inv.paymentType === 'deferred' && 
    inv.status === 'completed' && 
    (inv.total - ((inv as any).paidAmount || 0)) > 0
  );

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentModalVisible(true);
  };

  const handleSubmitPayment = (paidAmount: number, paymentMethod: string) => {
    if (!selectedInvoice) return;

    paymentMutation.mutate({ id: selectedInvoice.id, paidAmount, paymentMethod }, {
      onSuccess: () => {
        Alert.alert(t('common.success'), t('crm.paymentSuccess'));
        setPaymentModalVisible(false);
        setSelectedInvoice(null);
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || t('crm.failedToRecordPayment'));
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('crm.customerProfile')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CustomerSummary customer={customer} />

        {deferredInvoices.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('crm.deferredInvoices')}</Text>
            {deferredInvoices.map((inv) => (
              <DeferredInvoiceCard 
                key={inv.id} 
                invoice={inv} 
                onRecordPayment={handleRecordPayment} 
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('crm.allInvoices')}</Text>
          {customer.invoices.length === 0 ? (
            <Text style={[styles.emptyInvoices, { color: colors.textSecondary }]}>{t('invoice.noInvoices', 'لا توجد فواتير بعد')}</Text>
          ) : (
            customer.invoices.map((inv) => (
              <InvoiceCard 
                key={inv.id} 
                invoice={inv} 
                onPress={() => router.push(`/(app)/invoices/${inv.id}`)}
              />
            ))
          )}
        </View>


      </ScrollView>

      <PaymentModal
        visible={paymentModalVisible}
        invoice={selectedInvoice}
        onClose={() => setPaymentModalVisible(false)}
        onSubmit={handleSubmitPayment}
        isSubmitting={paymentMutation.isPending}
      />

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push({
          pathname: '/(app)/invoices/new',
          params: { prefillName: customer.customerName, prefillPhone: customer.customerPhone }
        })}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.fabText}>{t('invoice.new', 'إنشاء فاتورة')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'left',
  },
  emptyInvoices: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});
