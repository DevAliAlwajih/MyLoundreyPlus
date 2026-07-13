import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useInvoiceById, useUpdateInvoiceStatus } from '../../../hooks/useInvoices';
import { StatusBadge } from '../../../components/invoices/StatusBadge';
import { StatusTimeline } from '../../../components/invoices/StatusTimeline';
import { StatusBottomSheet } from '../../../components/invoices/StatusBottomSheet';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
};

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const { data: invoice, isLoading, isError, refetch } = useInvoiceById(id as string);
  const updateStatusMutation = useUpdateInvoiceStatus();

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: '#e74c3c' }}>{t('invoice.failedToLoadSingle')}</Text>
        <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.primary }}>{t('common.retry')}</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isTerminal = invoice.status === 'completed' || invoice.status === 'cancelled';

  const handleUpdateStatus = (newStatus: string, notes: string) => {
    updateStatusMutation.mutate({ id: invoice.id, status: newStatus, notes }, {
      onSuccess: () => {
        setBottomSheetVisible(false);
      }
    });
  };

  const renderTotals = () => (
    <View style={styles.totalsCard}>
      <View style={styles.row}>
        <Text style={styles.label}>{t('invoice.subtotal')}</Text>
        <Text style={styles.value}>{invoice.subtotal.toFixed(2)} ر.س</Text>
      </View>
      {invoice.discountAmount > 0 && (
        <View style={styles.row}>
          <Text style={styles.label}>{t('invoice.discount')} ({invoice.discountPercent}%)</Text>
          <Text style={styles.valueNegative}>- {invoice.discountAmount.toFixed(2)} ر.س</Text>
        </View>
      )}
      {invoice.isUrgent && (
        <View style={styles.row}>
          <Text style={styles.label}>{t('invoice.urgencyFee')} ({invoice.urgencyFeePercent}%)</Text>
          <Text style={styles.valuePositive}>+ {invoice.urgencyFeeAmount.toFixed(2)} ر.س</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={styles.label}>{t('invoice.tax')} ({invoice.taxPercent}%)</Text>
        <Text style={styles.valuePositive}>+ {invoice.taxAmount.toFixed(2)} ر.س</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>{t('invoice.total')}</Text>
        <Text style={styles.totalValue}>{invoice.total.toFixed(2)} ر.س</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* إخفاء شريط التبويبات في شاشة التفاصيل */}
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{invoice.invoiceNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Top summary card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('invoice.statusLabel')}</Text>
            <StatusBadge status={invoice.status} />
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>{t('invoice.customer')}</Text>
            <Text style={styles.value}>{invoice.customerName}</Text>
          </View>
          {invoice.customerPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('invoice.phone')}</Text>
              <Text style={styles.value}>{invoice.customerPhone}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>{t('invoice.paymentType')}</Text>
            <Text style={styles.value}>{t(`invoice.payment.${invoice.paymentType}`)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('invoice.date')}</Text>
            <Text style={styles.value}>{new Date(invoice.createdAt).toLocaleDateString(i18n.language)}</Text>
          </View>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>{t('invoice.items')}</Text>
        {invoice.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{i18n.language === 'ar' ? item.itemNameAr : item.itemName}</Text>
              {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
            </View>
            <Text style={styles.itemQty}>{item.quantity} x {item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.itemTotal}>{item.totalPrice.toFixed(2)}</Text>
          </View>
        ))}

        {renderTotals()}

        {/* Notes if any */}
        {invoice.notes && (
          <View style={styles.notesCard}>
            <Text style={styles.label}>{t('invoice.notes')}</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Share Actions */}
        <View style={styles.shareActionsCard}>
          <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert(t('common.comingSoon'))}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.shareBtnText}>{t('invoice.shareWhatsApp')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert(t('common.comingSoon'))}>
            <Ionicons name="document-text-outline" size={20} color="#e74c3c" />
            <Text style={styles.shareBtnText}>{t('invoice.sharePDF')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn} onPress={() => Alert.alert(t('common.comingSoon'))}>
            <Ionicons name="print-outline" size={20} color="#333" />
            <Text style={styles.shareBtnText}>{t('invoice.print')}</Text>
          </TouchableOpacity>
        </View>

        <StatusTimeline history={invoice.statusHistory} />
        
      </ScrollView>

      {!isTerminal && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setBottomSheetVisible(true)}
          >
            <Text style={styles.actionButtonText}>{t('invoice.updateStatus')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBottomSheet
        visible={bottomSheetVisible}
        currentStatus={invoice.status}
        onClose={() => setBottomSheetVisible(false)}
        onUpdate={handleUpdateStatus}
        isUpdating={updateStatusMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'left',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  itemNotes: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a5fa8',
    width: 70,
    textAlign: 'right',
  },
  totalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 12,
  },
  valueNegative: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e74c3c',
  },
  valuePositive: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a5fa8',
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
  notesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    marginTop: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    backgroundColor: '#1a5fa8',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareActionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  shareBtnText: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
});
