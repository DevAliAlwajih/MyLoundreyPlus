import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInvoiceById, useUpdateInvoiceStatus, useUpdateInvoice, useCatalogMenu, InvoiceItem } from '../../../hooks/useInvoices';
import { StatusBadge } from '../../../components/invoices/StatusBadge';
import { StatusTimeline } from '../../../components/invoices/StatusTimeline';
import { StatusBottomSheet } from '../../../components/invoices/StatusBottomSheet';
import { useLaundryStore } from '../../../stores/laundryStore';
import { useThemeStore } from '../../../stores/themeStore';

// --- Add Item Modal Component (Reusing catalog logic from new.tsx) ---
const AddItemModal = ({ visible, onClose, onSelect }: { visible: boolean, onClose: () => void, onSelect: (item: any, catId: string, catName: string, sType: string) => void }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const { data: menuData, isLoading } = useCatalogMenu();
  const categories = useMemo(() => menuData || [], [menuData]);
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (categories.length > 0 && selectedCategoryIds.size === 0) {
      setSelectedCategoryIds(new Set(categories.map(c => c.categoryId)));
      const expanded: Record<string, boolean> = {};
      categories.forEach(c => { expanded[c.categoryId] = true; });
      setExpandedCategories(expanded);
    }
  }, [categories]);

  const toggleCategorySelection = (catId: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const filteredCategories = categories.filter(c => selectedCategoryIds.has(c.categoryId));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>إضافة صنف</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {/* Category Filter */}
          <View style={styles.categoryGrid}>
            {categories.map(cat => {
              const isSelected = selectedCategoryIds.has(cat.categoryId);
              return (
                <TouchableOpacity
                  key={cat.categoryId}
                  style={[styles.categoryCard, isSelected ? { borderColor: colors.primary, backgroundColor: 'rgba(26, 95, 168, 0.08)' } : { borderColor: colors.border }]}
                  onPress={() => toggleCategorySelection(cat.categoryId)}
                >
                  <Text style={{ fontSize: 13, color: isSelected ? colors.primary : colors.text }}>{cat.categoryName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />

          {/* Items */}
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            filteredCategories.map(cat => {
              const visibleItems = searchQuery.trim()
                ? cat.items.filter(i => i.nameAr.includes(searchQuery.trim()))
                : cat.items;
              if (visibleItems.length === 0) return null;
              const isExpanded = expandedCategories[cat.categoryId] !== false;

              return (
                <View key={cat.categoryId} style={{ marginBottom: 12 }}>
                  <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleCategoryExpand(cat.categoryId)}>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>▼ {cat.categoryName}</Text>
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={{ marginTop: 8 }}>
                      {visibleItems.map(item => (
                        <TouchableOpacity
                          key={item.itemId}
                          style={styles.itemRow}
                          onPress={() => {
                            onSelect(item, cat.categoryId, cat.categoryName, 'washing_and_ironing');
                            onClose();
                          }}
                        >
                          <Text style={styles.itemName}>{item.nameAr}</Text>
                          <Text style={styles.itemTotal}>{(Number(item.fullServicePrice) || 0).toFixed(2)} ر.س</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};


// --- Main Screen ---
export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const laundry = useLaundryStore(s => s.profile);
  
  const { data: invoice, isLoading, isError, refetch } = useInvoiceById(id as string);
  const updateStatusMutation = useUpdateInvoiceStatus();
  const updateInvoiceMutation = useUpdateInvoice();

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [localItems, setLocalItems] = useState<InvoiceItem[]>([]);
  const [paymentType, setPaymentType] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [expectedDeliveryAt, setExpectedDeliveryAt] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [walkInLocation, setWalkInLocation] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [showCreatedDatePicker, setShowCreatedDatePicker] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);

  const { data: menuData } = useCatalogMenu();

  useEffect(() => {
    if (invoice && !isEditing) {
      setLocalItems(invoice.items || []);
      setPaymentType(invoice.paymentType || 'cash');
      setDiscount(invoice.discountAmount || 0);
      setNotes(invoice.notes || '');
      setExpectedDeliveryAt(invoice.expectedDeliveryAt || null);
      setWalkInLocation(invoice.customerLocation || '');
      setCreatedAt(invoice.createdAt || null);
    }
  }, [invoice, isEditing]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: colors.error }}>{t('invoice.failedToLoadSingle')}</Text>
        <TouchableOpacity onPress={() => refetch()}><Text style={{ color: colors.primary }}>{t('common.retry')}</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isTerminal = invoice.status === 'completed' || invoice.status === 'cancelled';

  const handleUpdateStatus = (newStatus: string, statusNotes: string) => {
    updateStatusMutation.mutate({ id: invoice.id, status: newStatus, notes: statusNotes }, {
      onSuccess: () => {
        setBottomSheetVisible(false);
      }
    });
  };

  const handleSaveEdit = () => {
    if (localItems.length === 0) {
      Alert.alert(t('common.error'), t('invoice.validation.itemsRequired', 'يجب إضافة أصناف للفاتورة'));
      return;
    }
    
    const payload = {
      items: localItems.map(i => ({
        itemId: i.itemId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        serviceType: i.service_type || 'washing_and_ironing',
        notes: i.notes
      })),
      paymentType,
      discount,
      notes,
      expectedDeliveryAt: expectedDeliveryAt ? new Date(expectedDeliveryAt).toISOString() : undefined,
      walkInLocation: walkInLocation,
      createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
    };

    updateInvoiceMutation.mutate({ id: invoice.id, data: payload }, {
      onSuccess: () => {
        setIsEditing(false);
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to update invoice');
      }
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setLocalItems(invoice.items);
    setPaymentType(invoice.paymentType);
    setDiscount(invoice.discountAmount);
    setNotes(invoice.notes || '');
    setExpectedDeliveryAt(invoice.expectedDeliveryAt || null);
    setWalkInLocation(invoice.customerLocation || '');
    setCreatedAt(invoice.createdAt || null);
  };

  const handleDeleteItem = (index: number) => {
    setLocalItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, val: string) => {
    const qty = parseInt(val) || 0;
    setLocalItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: qty } : item));
  };

  const handleUpdateItemService = (index: number, sType: string) => {
    setLocalItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      
      let newPrice = item.unitPrice;
      const catMenu = menuData || [];
      let catalogItem: any = null;
      for (const cat of catMenu) {
        const found = cat.items.find((ci: any) => ci.itemId === item.itemId);
        if (found) {
          catalogItem = found;
          break;
        }
      }

      if (catalogItem) {
        if (sType === 'washing_and_ironing') newPrice = Number(catalogItem.fullServicePrice) || 0;
        else if (sType === 'washing_only' && catalogItem.washingPrice !== null) newPrice = Number(catalogItem.washingPrice) || 0;
        else if (sType === 'ironing_only' && catalogItem.ironingPrice !== null) newPrice = Number(catalogItem.ironingPrice) || 0;
      }
      
      return { ...item, service_type: sType, unitPrice: newPrice };
    }));
  };

  const handleAddItem = (item: any, catId: string, catName: string, sType: string) => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(),
      itemId: item.itemId,
      itemName: item.nameAr,
      quantity: 1,
      unitPrice: Number(item.fullServicePrice) || 0,
      totalPrice: Number(item.fullServicePrice) || 0,
      service_type: sType,
    };
    setLocalItems(prev => [...prev, newItem]);
  };

  // Live Calculations for Edit Mode
  const activeSubtotal = isEditing ? localItems.reduce((s, i) => s + (i.unitPrice * i.quantity), 0) : invoice.subtotal;
  const activeDiscount = isEditing ? discount : invoice.discountAmount;
  const activeAfterDiscount = Math.max(0, activeSubtotal - activeDiscount);
  const activeTax = isEditing ? (laundry?.tax_enabled ? activeAfterDiscount * (Number(laundry.tax_rate)/100) : 0) : invoice.taxAmount;
  const activeUrgency = isEditing ? (invoice.isUrgent && laundry?.urgency_enabled ? Number(laundry.urgency_fee) : 0) : invoice.urgencyFeeAmount;
  const activeTotal = isEditing ? (activeAfterDiscount + activeTax + activeUrgency) : invoice.total;

  const renderTotals = () => (
    <View style={[styles.totalsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.subtotal')}</Text>
        <Text style={[styles.value, { color: colors.text }]}>{(Number(activeSubtotal) || 0).toFixed(2)} ر.س</Text>
      </View>
      {(isEditing || activeDiscount > 0) && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.discount')}</Text>
          {isEditing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput 
                style={[styles.editInputSmall, { color: colors.text, borderColor: colors.border }]} 
                value={activeDiscount.toString()} 
                onChangeText={v => setDiscount(parseFloat(v) || 0)} 
                keyboardType="decimal-pad" 
              />
              <Text style={styles.valueNegative}> ر.س</Text>
            </View>
          ) : (
            <Text style={styles.valueNegative}>- {(Number(activeDiscount) || 0).toFixed(2)} ر.س</Text>
          )}
        </View>
      )}
      {invoice.isUrgent && (
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.urgencyFee')}</Text>
          <Text style={[styles.valuePositive, { color: colors.primary }]}>+ {(Number(activeUrgency) || 0).toFixed(2)} ر.س</Text>
        </View>
      )}
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.tax')} {isEditing && laundry?.tax_enabled ? `(${laundry.tax_rate}%)` : `(${invoice.taxPercent}%)`}</Text>
        <Text style={[styles.valuePositive, { color: colors.primary }]}>+ {(Number(activeTax) || 0).toFixed(2)} ر.س</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.row}>
        <Text style={[styles.totalLabel, { color: colors.text }]}>{t('invoice.total')}</Text>
        <Text style={[styles.totalValue, { color: colors.primary }]}>{(Number(activeTotal) || 0).toFixed(2)} ر.س</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{invoice.invoiceNumber} {invoice.isEdited && <Text style={{color: colors.primary, fontSize: 12}}>✏️ معدلة</Text>}</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ padding: 4 }}>
          <Ionicons name={isEditing ? "close" : "create-outline"} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.statusLabel')}</Text>
              <StatusBadge status={invoice.status} />
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.customer')}</Text>
              <Text style={[styles.value, { color: colors.text }]}>{invoice.customerName}</Text>
            </View>
            {invoice.customerPhone && (
              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.phone')}</Text>
                <Text style={[styles.value, { color: colors.text }]}>{invoice.customerPhone}</Text>
              </View>
            )}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.location', 'الموقع')}</Text>
              {isEditing ? (
                <TextInput
                  style={[styles.editInputSmall, { width: 150, textAlign: i18n.language === 'ar' ? 'right' : 'left', color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  value={walkInLocation}
                  onChangeText={setWalkInLocation}
                  placeholder="(اختياري)"
                  placeholderTextColor={colors.textSecondary}
                />
              ) : (
                invoice.customerLocation ? (
                  <Text style={[styles.value, { color: colors.text }]}>{invoice.customerLocation}</Text>
                ) : null
              )}
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.paymentType')}</Text>
              {isEditing ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['cash', 'card', 'deferred'].map(pt => (
                    <TouchableOpacity key={pt} onPress={() => setPaymentType(pt)} style={{ padding: 4, borderBottomWidth: paymentType === pt ? 2 : 0, borderColor: colors.primary }}>
                      <Text style={{ color: paymentType === pt ? colors.primary : colors.textSecondary }}>{t(`invoice.payment.${pt}`)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>{t(`invoice.payment.${invoice.paymentType}`)}</Text>
              )}
            </View>
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.date')}</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => setShowCreatedDatePicker(true)} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.background }}>
                  <Text style={{ color: createdAt ? colors.text : colors.textSecondary, fontSize: 13 }}>
                    {createdAt ? new Date(createdAt).toLocaleDateString(i18n.language) : 'تحديد تاريخ'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>{new Date(invoice.createdAt).toLocaleDateString(i18n.language)}</Text>
              )}
            </View>
            {showCreatedDatePicker && (
              <DateTimePicker
                value={createdAt ? new Date(createdAt) : new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, date) => {
                  setShowCreatedDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setCreatedAt(date.toISOString());
                  }
                }}
              />
            )}
            <View style={styles.row}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>تاريخ التسليم المتوقع</Text>
              {isEditing ? (
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.background }}>
                  <Text style={{ color: expectedDeliveryAt ? colors.text : colors.textSecondary, fontSize: 13 }}>
                    {expectedDeliveryAt ? new Date(expectedDeliveryAt).toLocaleDateString(i18n.language) : 'تحديد تاريخ'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.value, { color: expectedDeliveryAt ? colors.text : colors.textSecondary, fontSize: 14 }]}>
                  {expectedDeliveryAt ? new Date(expectedDeliveryAt).toLocaleDateString(i18n.language) : 'غير محدد'}
                </Text>
              )}
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={expectedDeliveryAt ? new Date(expectedDeliveryAt) : new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setExpectedDeliveryAt(date.toISOString());
                  }
                }}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>{t('invoice.items')}</Text>
            {isEditing && (
              <TouchableOpacity onPress={() => setAddItemModalVisible(true)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ إضافة صنف</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {(isEditing ? localItems : invoice.items).map((item, idx) => (
            <View key={idx} style={[styles.itemRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{i18n.language === 'ar' ? (item.itemNameAr || item.itemName) : item.itemName}</Text>
                
                {isEditing ? (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    {['washing_and_ironing', 'washing_only', 'ironing_only'].map(s => (
                      <TouchableOpacity 
                        key={s} 
                        onPress={() => handleUpdateItemService(idx, s)}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: item.service_type === s ? colors.primary : colors.background }}
                      >
                        <Text style={{ fontSize: 10, color: item.service_type === s ? '#fff' : colors.textSecondary }}>
                          {s === 'washing_and_ironing' ? 'غسيل وكوي' : s === 'washing_only' ? 'غسيل' : 'كوي'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  item.notes ? <Text style={[styles.itemNotes, { color: colors.textSecondary }]}>{item.notes}</Text> : null
                )}
              </View>

              {isEditing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput 
                    style={[styles.editInputSmall, { color: colors.text, borderColor: colors.border }]}
                    value={item.quantity.toString()}
                    onChangeText={(val) => handleUpdateItemQuantity(idx, val)}
                    keyboardType="number-pad"
                  />
                  <Text style={[styles.itemQty, { color: colors.textSecondary }]}>x {(Number(item.unitPrice) || 0).toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => handleDeleteItem(idx)} style={{ marginLeft: 8 }}>
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{item.quantity} x {(Number(item.unitPrice) || 0).toFixed(2)}</Text>
                  <Text style={[styles.itemTotal, { color: colors.primary }]}>{(Number(item.unitPrice * item.quantity) || 0).toFixed(2)}</Text>
                </>
              )}
            </View>
          ))}

          {renderTotals()}

          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{t('invoice.notes')}</Text>
            {isEditing ? (
              <TextInput 
                style={[styles.editInput, { marginTop: 8, color: colors.text, borderColor: colors.border }]} 
                value={notes} 
                onChangeText={setNotes} 
                multiline 
                placeholder="ملاحظات..." 
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{invoice.notes}</Text>
            )}
          </View>

          {!isEditing && (
            <>
              <View style={styles.shareActionsCard}>
                <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => Alert.alert(t('common.comingSoon'))}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <Text style={[styles.shareBtnText, { color: colors.text }]}>{t('invoice.shareWhatsApp')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => Alert.alert(t('common.comingSoon'))}>
                  <Ionicons name="document-text-outline" size={20} color="#e74c3c" />
                  <Text style={[styles.shareBtnText, { color: colors.text }]}>{t('invoice.sharePDF')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => Alert.alert(t('common.comingSoon'))}>
                  <Ionicons name="print-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.shareBtnText, { color: colors.text }]}>{t('invoice.print')}</Text>
                </TouchableOpacity>
              </View>
              <StatusTimeline history={invoice.statusHistory} />
            </>
          )}
          
        </ScrollView>
      </KeyboardAvoidingView>

      {isEditing ? (
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, flexDirection: 'row', gap: 12 }]}>
          <TouchableOpacity style={[styles.actionButton, { flex: 1, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]} onPress={handleCancelEdit}>
            <Text style={[styles.actionButtonText, { color: colors.text }]}>{t('common.cancel', 'إلغاء')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { flex: 2, backgroundColor: colors.primary }]} onPress={handleSaveEdit} disabled={updateInvoiceMutation.isPending}>
            {updateInvoiceMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t('common.save', 'حفظ')}</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        !isTerminal && (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setBottomSheetVisible(true)}>
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>{t('invoice.updateStatus')}</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      <StatusBottomSheet
        visible={bottomSheetVisible}
        currentStatus={invoice.status}
        onClose={() => setBottomSheetVisible(false)}
        onUpdate={handleUpdateStatus}
        isUpdating={updateStatusMutation.isPending}
      />
      
      <AddItemModal 
        visible={addItemModalVisible} 
        onClose={() => setAddItemModalVisible(false)} 
        onSelect={handleAddItem} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, textAlign: 'left' },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 8 },
  itemName: { fontSize: 15, fontWeight: '600' },
  itemNotes: { fontSize: 12, color: '#888', marginTop: 2 },
  itemQty: { fontSize: 14, marginHorizontal: 12 },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#1a5fa8', width: 70, textAlign: 'right' },
  totalsCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 12 },
  valueNegative: { fontSize: 14, fontWeight: '500', color: '#e74c3c' },
  valuePositive: { fontSize: 14, fontWeight: '500', color: '#1a5fa8' },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#1a5fa8' },
  notesCard: { borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 16 },
  notesText: { fontSize: 14, color: '#444', marginTop: 8, fontStyle: 'italic' },
  footer: { padding: 20, borderTopWidth: 1 },
  actionButton: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a5fa8' },
  actionButtonText: { fontSize: 16, fontWeight: 'bold' },
  shareActionsCard: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  shareBtn: { flex: 1, borderRadius: 12, padding: 12, borderWidth: 1, alignItems: 'center', marginHorizontal: 4 },
  shareBtnText: { fontSize: 12, marginTop: 8, textAlign: 'center', fontWeight: '500' },
  editInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, minHeight: 40, textAlign: 'right' },
  editInputSmall: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 4, width: 50, textAlign: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  accordionHeader: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
