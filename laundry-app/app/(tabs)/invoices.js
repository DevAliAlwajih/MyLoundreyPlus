import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, Alert, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, STATUS } from '../../src/constants/theme';
import useInvoiceStore from '../../src/store/useInvoiceStore';

const SERVICES = [
  { id: 'wash',       label: 'غسيل عادي',      price: 15 },
  { id: 'express',    label: 'غسيل مستعجل',    price: 25 },
  { id: 'iron',       label: 'كيّ وتنعيم',      price: 10 },
  { id: 'dry_clean',  label: 'تنظيف جاف',      price: 35 },
  { id: 'fold',       label: 'طي وتعبئة',       price: 8  },
];

const STATUS_FILTERS = ['الكل', 'received', 'washing', 'drying', 'ready', 'delivered'];

export default function InvoicesScreen() {
  const { invoices, isLoading, fetchInvoices, updateStatus, createInvoice } = useInvoiceStore();
  const [filter, setFilter] = useState('الكل');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New invoice form state
  const [newForm, setNewForm] = useState({
    customerName: '', customerPhone: '', notes: '', selectedServices: {},
  });

  useEffect(() => { fetchInvoices({ limit: 50 }); }, []);

  const filtered = invoices.filter(inv => {
    const matchFilter = filter === 'الكل' || inv.status === filter;
    const matchSearch = !search || 
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name?.includes(search);
    return matchFilter && matchSearch;
  });

  const totalNew = newForm.selectedServices
    ? Object.entries(newForm.selectedServices)
        .filter(([, sel]) => sel)
        .reduce((sum, [id]) => sum + (SERVICES.find(s => s.id === id)?.price || 0), 0)
    : 0;

  const handleCreateInvoice = async () => {
    if (!newForm.customerName) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم العميل');
      return;
    }
    const services = Object.entries(newForm.selectedServices)
      .filter(([, sel]) => sel)
      .map(([id]) => id);
    if (services.length === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار خدمة واحدة على الأقل');
      return;
    }
    const result = await createInvoice({
      customer_name: newForm.customerName,
      customer_phone: newForm.customerPhone,
      services,
      total_amount: totalNew,
      notes: newForm.notes,
    });
    if (result.success) {
      setShowNewModal(false);
      setNewForm({ customerName: '', customerPhone: '', notes: '', selectedServices: {} });
      Alert.alert('تم', 'تم إنشاء الفاتورة بنجاح ✅');
    } else {
      Alert.alert('خطأ', result.error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedInvoice) return;
    const result = await updateStatus(selectedInvoice.id, status);
    if (result.success) {
      setShowStatusModal(false);
      setSelectedInvoice(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الفواتير</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowNewModal(true)}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addBtnText}>فاتورة جديدة</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={COLORS.textLight} style={{ marginRight: 8 }} />
          <TextInput placeholder="بحث برقم الفاتورة أو اسم العميل..."
            placeholderTextColor={COLORS.textLight}
            value={search} onChangeText={setSearch} style={{ flex: 1, fontSize: 14, color: COLORS.text }} />
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}>
        {STATUS_FILTERS.map(f => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === 'الكل' ? 'الكل' : (STATUS[f]?.label || f)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={i => i.id?.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}
            onPress={() => { setSelectedInvoice(item); setShowStatusModal(true); }}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardNum}>#{item.invoice_number || item.id?.slice(0, 8)}</Text>
              <Text style={styles.cardCustomer}>{item.customer_name || 'عميل'}</Text>
              <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('ar-SA')}</Text>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, { backgroundColor: STATUS[item.status]?.bg || '#F4F5F7' }]}>
                <Text style={[styles.badgeText, { color: STATUS[item.status]?.color || COLORS.textSub }]}>
                  {STATUS[item.status]?.label || item.status}
                </Text>
              </View>
              <Text style={styles.cardAmount}>{item.total_amount} ر.س</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyText}>لا توجد فواتير</Text>
          </View>
        )}
      />

      {/* New Invoice Modal */}
      <Modal visible={showNewModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>إنشاء فاتورة جديدة</Text>
            <TouchableOpacity onPress={() => setShowNewModal(false)}>
              <Ionicons name="close-circle" size={28} color={COLORS.textSub} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Customer Info */}
            <Text style={styles.sectionLabel}>بيانات العميل</Text>
            <TextInput style={styles.modalInput} placeholder="اسم العميل *"
              placeholderTextColor={COLORS.textLight}
              value={newForm.customerName}
              onChangeText={v => setNewForm(f => ({ ...f, customerName: v }))}
              textAlign="right" />
            <TextInput style={styles.modalInput} placeholder="رقم الجوال (اختياري)"
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
              value={newForm.customerPhone}
              onChangeText={v => setNewForm(f => ({ ...f, customerPhone: v }))}
              textAlign="right" />

            {/* Services */}
            <Text style={styles.sectionLabel}>الخدمات</Text>
            {SERVICES.map(s => (
              <TouchableOpacity key={s.id}
                style={[styles.serviceRow, newForm.selectedServices[s.id] && styles.serviceRowActive]}
                onPress={() => setNewForm(f => ({
                  ...f,
                  selectedServices: { ...f.selectedServices, [s.id]: !f.selectedServices[s.id] }
                }))}>
                <Text style={styles.serviceName}>{s.label}</Text>
                <View style={styles.serviceRight}>
                  <Text style={styles.servicePrice}>{s.price} ر.س</Text>
                  <Ionicons
                    name={newForm.selectedServices[s.id] ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24} color={newForm.selectedServices[s.id] ? COLORS.primary : COLORS.border} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Notes */}
            <Text style={styles.sectionLabel}>ملاحظات</Text>
            <TextInput style={[styles.modalInput, { height: 80 }]}
              placeholder="ملاحظات خاصة..." placeholderTextColor={COLORS.textLight}
              multiline value={newForm.notes}
              onChangeText={v => setNewForm(f => ({ ...f, notes: v }))}
              textAlign="right" />

            {/* Total & Confirm */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>الإجمالي:</Text>
              <Text style={styles.totalValue}>{totalNew} ر.س</Text>
            </View>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateInvoice}>
              <Text style={styles.confirmBtnText}>إنشاء الفاتورة</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.statusModal}>
            <Text style={styles.statusModalTitle}>تحديث حالة الفاتورة</Text>
            <Text style={styles.statusModalSub}>
              #{selectedInvoice?.invoice_number || selectedInvoice?.id?.slice(0, 8)}
            </Text>
            {Object.entries(STATUS).map(([key, val]) => (
              <TouchableOpacity key={key}
                style={[styles.statusOption, { backgroundColor: val.bg }]}
                onPress={() => handleUpdateStatus(key)}>
                <Text style={[styles.statusOptionText, { color: val.color }]}>{val.label}</Text>
                {selectedInvoice?.status === key && (
                  <Ionicons name="checkmark-circle" size={20} color={val.color} />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowStatusModal(false)}>
              <Text style={styles.cancelBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  headerTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  addBtn: {
    flexDirection: 'row', backgroundColor: COLORS.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  searchRow: { padding: 16, paddingBottom: 0 },
  searchInput: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingHorizontal: 14, height: 46, borderWidth: 1, borderColor: COLORS.border,
  },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 12 },
  filterRow: { gap: 8, paddingRight: 16 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSub },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  cardLeft: { flex: 1 },
  cardNum: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 3 },
  cardCustomer: { fontSize: 13, color: COLORS.textSub, marginBottom: 2 },
  cardDate: { fontSize: 11, color: COLORS.textLight },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardAmount: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textLight, marginTop: 12, fontSize: 15 },
  // Modal styles
  modal: { flex: 1, backgroundColor: COLORS.surface },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  modalBody: { padding: 20 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textSub, marginBottom: 10, marginTop: 16 },
  modalInput: {
    backgroundColor: COLORS.bg, borderRadius: 12, height: 52,
    paddingHorizontal: 16, fontSize: 15, color: COLORS.text,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  serviceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, backgroundColor: COLORS.bg, marginBottom: 8,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  serviceRowActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  serviceName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  serviceRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  servicePrice: { fontSize: 14, fontWeight: '700', color: COLORS.textSub },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 16, backgroundColor: COLORS.primaryLight,
    borderRadius: 12, marginTop: 16, marginBottom: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 20, fontWeight: '900', color: COLORS.primary },
  confirmBtn: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // Status modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  statusModal: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  statusModalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  statusModalSub: { fontSize: 13, color: COLORS.textSub, textAlign: 'center', marginBottom: 20 },
  statusOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, marginBottom: 8,
  },
  statusOptionText: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { marginTop: 8, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },
});
