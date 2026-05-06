import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS } from '../../src/constants/theme';
import useLaundryStore from '../../src/store/useLaundryStore';
import useInvoiceStore from '../../src/store/useInvoiceStore';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useLaundryStore();
  const { invoices, stats, isLoading, fetchInvoices, updateStatus } = useInvoiceStore();

  useEffect(() => { fetchInvoices({ limit: 20 }); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء النور';
  };

  const recentInvoices = invoices.slice(0, 10);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}،</Text>
          <Text style={styles.userName}>{user?.full_name || 'صاحب المغسلة'}</Text>
        </View>
        <TouchableOpacity style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchInvoices({ limit: 20 })} colors={[COLORS.primary]} />}
      >
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'إجمالي اليوم', value: stats.total, icon: 'receipt', color: COLORS.primary, bg: COLORS.primaryLight },
            { label: 'في الانتظار', value: stats.received, icon: 'time', color: COLORS.warning, bg: '#FFF7E6' },
            { label: 'قيد الغسيل', value: stats.washing, icon: 'water', color: COLORS.accent, bg: '#E6FCFF' },
            { label: 'جاهزة', value: stats.ready, icon: 'checkmark-circle', color: COLORS.success, bg: '#E3FCEF' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color }]}>
                <Ionicons name={s.icon} size={20} color="#fff" />
              </View>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionCard}
              onPress={() => router.push('/(tabs)/scanner')}>
              <View style={[styles.actionIcon, { backgroundColor: COLORS.primaryLight }]}>
                <Ionicons name="qr-code" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.actionLabel}>مسح QR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}
              onPress={() => router.push('/(tabs)/invoices')}>
              <View style={[styles.actionIcon, { backgroundColor: '#E3FCEF' }]}>
                <Ionicons name="add-circle" size={28} color={COLORS.success} />
              </View>
              <Text style={styles.actionLabel}>فاتورة جديدة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}
              onPress={() => fetchInvoices({ status: 'ready' })}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7E6' }]}>
                <Ionicons name="shirt" size={28} color={COLORS.warning} />
              </View>
              <Text style={styles.actionLabel}>جاهزة للتسليم</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Invoices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>آخر الفواتير</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/invoices')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {recentInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>لا توجد فواتير اليوم</Text>
            </View>
          ) : (
            recentInvoices.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv} onStatusChange={updateStatus} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function InvoiceCard({ invoice, onStatusChange }) {
  const statusInfo = STATUS[invoice.status] || STATUS.received;
  
  const nextStatus = {
    received: 'washing', washing: 'drying',
    drying: 'ready', ready: 'delivered',
  };

  return (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceLeft}>
        <Text style={styles.invoiceNum}>#{invoice.invoice_number || invoice.id?.slice(0, 8)}</Text>
        <Text style={styles.invoiceName}>{invoice.customer_name || 'عميل'}</Text>
        <Text style={styles.invoiceDate}>
          {new Date(invoice.created_at).toLocaleDateString('ar-SA')}
        </Text>
      </View>
      <View style={styles.invoiceRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
        {nextStatus[invoice.status] && (
          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => onStatusChange(invoice.id, nextStatus[invoice.status])}>
            <Ionicons name="arrow-forward-circle" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 16, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 13, color: COLORS.textSub },
  userName: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  notifBtn: { position: 'relative', padding: 8 },
  notifBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger,
  },
  scroll: { padding: 16, paddingBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.textSub, textAlign: 'center', fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text, textAlign: 'center' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: COLORS.textLight, marginTop: 12, fontSize: 14 },
  invoiceCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  invoiceLeft: { flex: 1 },
  invoiceNum: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  invoiceName: { fontSize: 13, color: COLORS.textSub, marginBottom: 2 },
  invoiceDate: { fontSize: 11, color: COLORS.textLight },
  invoiceRight: { alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  nextBtn: { padding: 4 },
});
