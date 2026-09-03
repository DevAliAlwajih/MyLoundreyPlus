import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInvoiceStore, PaymentType } from '../../../stores/invoiceStore';
import { useLaundryStore } from '../../../stores/laundryStore';
import { useCatalogMenu, useCreateInvoice, CatalogItem, CatalogCategory } from '../../../hooks/useInvoices';
import { useCustomers } from '../../../hooks/useCRM';
import { QRScannerModal } from '../../../components/invoices/QRScannerModal';
import { UniqueIdModal } from '../../../components/invoices/UniqueIdModal';
import { useThemeStore } from '../../../stores/themeStore';
import api from '../../../lib/axios';

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const params = useLocalSearchParams<{ prefillName?: string; prefillPhone?: string; prefillNotes?: string }>();
  
  const store = useInvoiceStore();
  const laundryStore = useLaundryStore();
  const { data: menuData, isLoading: loadingCatalog } = useCatalogMenu();
  const createMutation = useCreateInvoice();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [idModalVisible, setIdModalVisible] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(store.customerName);
    }, 300);
    return () => clearTimeout(timer);
  }, [store.customerName]);

  const { data: customersData, isFetching: loadingCustomersData } = useCustomers(debouncedCustomerSearch);

  useEffect(() => {
    store.clearCart();
    if (params.prefillName || params.prefillPhone) {
      store.setCustomer(params.prefillName || '', params.prefillPhone || '');
      if (params.prefillNotes) store.setNotes(params.prefillNotes);
    }
  }, []);

  // Set dynamic tax based on laundry settings reactively
  useEffect(() => {
    if (laundryStore.profile) {
      const taxRate = laundryStore.profile.tax_enabled ? (laundryStore.profile.tax_rate || 0) : 0;
      store.setTaxPercent(taxRate);
    }
  }, [laundryStore.profile?.tax_enabled, laundryStore.profile?.tax_rate]);

  const categories = useMemo(() => {
    return menuData || [];
  }, [menuData]);

  // Auto select all categories initially if none selected
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

  const handleFetchCustomer = async (uniqueId: string) => {
    try {
      setLoadingCustomer(true);
      const response = await api.get(`/users/by-unique-id/${uniqueId}`);
      if (response.data && response.data.data) {
        const user = response.data.data;
        store.setCustomer(user.name, user.phone, '', user.id);
        Alert.alert(t('common.success', 'نجاح'), 'تم جلب بيانات العميل بنجاح');
      }
    } catch (err) {
      Alert.alert(t('common.error', 'خطأ'), 'لم يتم العثور على عميل أو المعرّف غير صحيح');
    } finally {
      setLoadingCustomer(false);
    }
  };

  const validate = () => {
    if (!store.customerName.trim() && !store.customerId) {
      Alert.alert(t('common.error', 'خطأ'), t('invoice.validation.customerRequired', 'اسم العميل مطلوب'));
      return false;
    }
    if (store.cart.length === 0) {
      Alert.alert(t('common.error', 'خطأ'), t('invoice.validation.itemsRequired', 'يجب إضافة أصناف للفاتورة'));
      return false;
    }
    if (!store.paymentType) {
      Alert.alert(t('common.error', 'خطأ'), t('invoice.validation.paymentRequired', 'طريقة الدفع مطلوبة'));
      return false;
    }
    return true;
  };

  const handleCreate = (status: 'draft' | 'received') => {
    if (status === 'received' && !validate()) return;
    
    const payload = {
      customerId: store.customerId,
      walkInName: !store.customerId ? store.customerName : undefined,
      walkInPhone: !store.customerId ? store.customerPhone : undefined,
      walkInLocation: !store.customerId ? store.customerLocation : undefined,
      paymentType: store.paymentType,
      isUrgent: store.isUrgent,
      notes: store.notes,
      expectedDeliveryAt: store.expectedDeliveryAt ? new Date(store.expectedDeliveryAt).toISOString() : undefined,
      discountPercent: store.discountPercent,
      status,   // تمرير الحالة صراحةً للباكند
      items: store.cart.map((c) => ({
        itemId: c.itemId,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        serviceType: c.serviceType,
        processingType: c.processingType,
        notes: c.notes,
      }))
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        store.clearCart();
        router.replace('/(app)/invoices');
      },
      onError: (err: any) => {
        Alert.alert(t('common.error', 'خطأ'), err.response?.data?.message || t('invoice.createFailed', 'فشل إنشاء الفاتورة'));
      }
    });
  };

  const handleItemQuantityChange = (cat: CatalogCategory, item: CatalogItem, delta: number) => {
    const cartItem = store.cart.find(c => c.itemId === item.itemId);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      store.removeItem(item.itemId);
    } else if (cartItem) {
      store.updateQuantity(item.itemId, newQty);
    } else {
      store.addItem(item, cat.categoryId, cat.categoryName, 'washing_and_ironing');
    }
  };

  // Section A
  const renderPartA = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>أ — معلومات العميل</Text>
      </View>
      
      <View style={styles.customerActionRow}>
        <TouchableOpacity style={styles.customerActionBtn} onPress={() => setQrModalVisible(true)}>
          <Ionicons name="qr-code" size={18} color={colors.surface} />
          <Text style={styles.customerActionBtnText}>مسح QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.customerActionBtn, styles.idBtn]} onPress={() => setIdModalVisible(true)}>
          <Ionicons name="keypad" size={18} color={colors.primary} />
          <Text style={[styles.customerActionBtnText, {color: colors.primary}]}>إدخال معرّف</Text>
        </TouchableOpacity>
      </View>
 
      {loadingCustomer && <ActivityIndicator color={colors.primary} style={{marginBottom: 10}} />}
 
      {store.customerId && (
        <View style={styles.verifiedBanner}>
          <View style={styles.verifiedBannerLeft}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.verifiedBannerText}>عميل مسجل — تم تعبئة البيانات تلقائياً</Text>
          </View>
          <TouchableOpacity onPress={() => store.clearCustomer()} style={styles.verifiedBannerClose}>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
 
      <View style={styles.inputContainer}>
        <Text style={styles.label}>اسم العميل*</Text>
        <TextInput
          style={styles.input}
          value={store.customerName}
          onChangeText={(val) => {
            store.setCustomer(val, store.customerPhone, store.customerLocation, undefined);
            setShowCustomerDropdown(true);
          }}
          onFocus={() => setShowCustomerDropdown(true)}
          onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
          placeholder="علي محمد الوجيه"
          placeholderTextColor={colors.textMuted}
          textAlign={i18n.language === 'ar' ? 'right' : 'left'}
        />
        {showCustomerDropdown && store.customerName.length > 0 && !store.customerId && (
          <View style={styles.dropdownContainer}>
            {loadingCustomersData ? (
               <ActivityIndicator size="small" color={colors.primary} style={{ margin: 10 }} />
            ) : customersData && customersData.length > 0 ? (
               customersData.slice(0, 5).map(cust => (
                 <TouchableOpacity 
                    key={cust.customerId} 
                    style={styles.dropdownItem}
                    onPress={() => {
                       store.setCustomer(cust.customerName, cust.customerPhone || '', '', cust.customerId);
                       setShowCustomerDropdown(false);
                    }}
                 >
                    <Text style={styles.dropdownItemName}>{cust.customerName}</Text>
                    <Text style={styles.dropdownItemPhone}>{cust.customerPhone}</Text>
                 </TouchableOpacity>
               ))
            ) : (
               <Text style={styles.dropdownEmptyText}>لا يوجد عملاء مطابقين</Text>
            )}
          </View>
        )}
      </View>
 
      <View style={styles.inputContainer}>
        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={store.customerPhone}
          onChangeText={(val) => store.setCustomer(store.customerName, val, store.customerLocation, store.customerId)}
          keyboardType="phone-pad"
          placeholder="+967 775547603"
          placeholderTextColor={colors.textMuted}
          textAlign={i18n.language === 'ar' ? 'right' : 'left'}
        />
      </View>
 
      <View style={[styles.inputContainer, {marginBottom: 0}]}>
        <Text style={styles.label}>الموقع</Text>
        <TextInput
          style={styles.input}
          value={store.customerLocation}
          onChangeText={(val) => store.setCustomer(store.customerName, store.customerPhone, val, store.customerId)}
          placeholder="(اختياري)"
          placeholderTextColor={colors.textMuted}
          textAlign={i18n.language === 'ar' ? 'right' : 'left'}
        />
      </View>
    </View>
  );
 
  // Section B
  const renderPartB = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>ب — اختيار القسم</Text>
      </View>
      <Text style={styles.sectionSubtitle}>اختر قسماً أو أكثر — عند الطباعة يظهر المحدد فقط</Text>
      
      {loadingCatalog ? (
        <ActivityIndicator size="small" color={colors.primary} style={{margin: 16}} />
      ) : categories.length === 0 ? (
        <Text style={styles.emptyText}>لا توجد أقسام</Text>
      ) : (
        <View style={styles.categoryGrid}>
          {categories.map(cat => {
            const isSelected = selectedCategoryIds.has(cat.categoryId);
            return (
              <TouchableOpacity
                key={cat.categoryId}
                style={[styles.categoryCard, isSelected ? styles.categoryCardSelected : styles.categoryCardUnselected]}
                onPress={() => toggleCategorySelection(cat.categoryId)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxIcon, isSelected && styles.checkboxIconSelected]}>
                  {isSelected && <Ionicons name="checkmark" size={12} color={colors.surface} />}
                </View>
                <Text style={[styles.categoryCardText, isSelected && styles.categoryCardTextSelected]}>
                  {cat.categoryName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  // Section C
  const renderPartC = () => {
    const filteredCategories = categories.filter(c => selectedCategoryIds.has(c.categoryId));
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>ج — اختيار الأصناف</Text>
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={{marginLeft: 8}} />
          <TextInput
            style={styles.searchInput}
            placeholder="بحث عن صنف..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign={i18n.language === 'ar' ? 'right' : 'left'}
          />
        </View>
        
        {loadingCatalog ? (
          <ActivityIndicator size="small" color={colors.primary} style={{margin: 20}} />
        ) : filteredCategories.length === 0 ? (
          <Text style={styles.emptyText}>اختر قسماً من القائمة أعلاه لعرض الأصناف</Text>
        ) : (
          filteredCategories.map(cat => {
            const visibleItems = searchQuery.trim()
              ? cat.items.filter(i => i.nameAr.includes(searchQuery.trim()))
              : cat.items;
              
            if (visibleItems.length === 0) return null;
            const isExpanded = expandedCategories[cat.categoryId] !== false;
            
            return (
              <View key={cat.categoryId} style={styles.accordionBlock}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleCategoryExpand(cat.categoryId)}>
                  <Text style={styles.accordionTitle}>▼ {cat.categoryName}</Text>
                  <View style={styles.accordionLine} />
                </TouchableOpacity>
                
                {isExpanded && (
                  <View style={styles.accordionContent}>
                    {visibleItems.map(item => {
                       const cartItem = store.cart.find(c => c.itemId === item.itemId);
                       const isSelected = !!cartItem;
                       const qty = cartItem ? cartItem.quantity : 0;
                       const currentService = cartItem?.serviceType || 'washing_and_ironing';
                       
                       return (
                         <View key={item.itemId} style={[styles.itemRow, isSelected && styles.itemRowSelected]}>
                           <View style={styles.itemRowHeader}>
                             <Text style={styles.itemName}>{item.nameAr}</Text>
                             <Text style={styles.itemBasePrice}>{(Number(item.fullServicePrice) || 0).toFixed(2)} ر.س</Text>
                           </View>
                           
                           <View style={styles.serviceTypesRow}>
                             {[
                               { id: 'washing_and_ironing', label: 'غسيل+كوي' },
                               { id: 'washing_only', label: 'غسيل', hide: item.washingPrice === null },
                               { id: 'ironing_only', label: 'كوي', hide: item.ironingPrice === null },
                             ].filter(s => !s.hide).map(s => {
                               const isActive = currentService === s.id && isSelected;
                               return (
                                 <TouchableOpacity
                                   key={s.id}
                                   style={[styles.serviceTypeBtn, isActive ? styles.serviceTypeBtnActive : styles.serviceTypeBtnInactive]}
                                   onPress={() => {
                                     if (isSelected) store.updateServiceType(item.itemId, s.id as any);
                                     else store.addItem(item, cat.categoryId, cat.categoryName, s.id as any);
                                   }}
                                 >
                                   <Text style={[styles.serviceTypeBtnText, isActive && styles.serviceTypeBtnTextActive]}>
                                     {s.label}{isActive ? '✓' : ''}
                                   </Text>
                                 </TouchableOpacity>
                               );
                             })}
                           </View>
                           
                           <View style={styles.itemRowFooter}>
                             <View style={styles.priceContainer}>
                               <Text style={styles.priceLabel}>السعر: </Text>
                               <TextInput
                                 style={styles.priceInput}
                                 value={isSelected ? (cartItem?.unitPrice || 0).toString() : item.fullServicePrice.toString()}
                                 onChangeText={(val) => {
                                   if (isSelected) store.updateItemPrice(item.itemId, parseFloat(val) || 0);
                                 }}
                                 keyboardType="decimal-pad"
                                 editable={isSelected}
                               />
                               <Text style={styles.priceLabel}> ر.س</Text>
                             </View>
                             
                             <View style={styles.stepper}>
                               <TouchableOpacity style={styles.stepperBtn} onPress={() => handleItemQuantityChange(cat, item, -1)}>
                                 <Text style={styles.stepperText}>−</Text>
                               </TouchableOpacity>
                               <View style={styles.stepperValueContainer}>
                                 <Text style={styles.stepperValue}>{qty}</Text>
                               </View>
                               <TouchableOpacity style={styles.stepperBtn} onPress={() => handleItemQuantityChange(cat, item, 1)}>
                                 <Text style={styles.stepperText}>+</Text>
                               </TouchableOpacity>
                             </View>
                           </View>
                         </View>
                       );
                     })}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    );
  };

  // Section D
  const renderPartD = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>د — طرق الدفع</Text>
      </View>
      
      <View style={styles.paymentGrid}>
        {[
          { id: 'cash', label: 'نقدي' },
          { id: 'card', label: 'شبكة' },
          { id: 'deferred', label: 'آجل' },
          { id: 'electronic', label: 'إلكتروني', disabled: true, icon: 'lock-closed' }
        ].map((pt) => {
          const isActive = store.paymentType === pt.id;
          return (
            <TouchableOpacity 
              key={pt.id} 
              style={[
                styles.paymentBtn, 
                isActive ? styles.paymentBtnActive : styles.paymentBtnInactive,
                pt.disabled && styles.paymentBtnDisabled
              ]}
              onPress={() => !pt.disabled && store.setPaymentType(pt.id as PaymentType)}
              disabled={pt.disabled}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.paymentBtnText, 
                isActive && styles.paymentBtnTextActive,
                pt.disabled && styles.paymentBtnTextDisabled
              ]}>
                {pt.label}{isActive ? '✓' : ''}
              </Text>
              {pt.icon && (
                <Ionicons name={pt.icon as any} size={14} color={colors.textSecondary} style={{marginLeft: 4}} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.urgencyDivider} />
      
      <TouchableOpacity 
        style={styles.urgencyRow} 
        onPress={() => store.setUrgent(!store.isUrgent)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={store.isUrgent ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={store.isUrgent ? colors.primary : colors.textSecondary} 
        />
        <Text style={styles.urgencyLabel}>طلب مستعجل</Text>
      </TouchableOpacity>
      
      {store.isUrgent && (
        <View style={styles.urgencyFeeRow}>
          <Text style={styles.urgencyFeeLabel}>رسوم الاستعجال:</Text>
          <View style={styles.urgencyFeeInputContainer}>
            <TextInput
              style={styles.urgencyFeeInput}
              value={(Number(store.urgencyFeeAmount) || 0).toFixed(2)}
              editable={false}
            />
            <Text style={styles.urgencyFeeCurrency}>ر.س</Text>
          </View>
        </View>
      )}

      <View style={[styles.urgencyDivider, { marginTop: 16, marginBottom: 16, height: 1, backgroundColor: colors.border }]} />
      <View style={styles.deliveryDateContainer}>
        <Text style={styles.deliveryDateLabel}>تاريخ التسليم المتوقع (اختياري)</Text>
        <TouchableOpacity style={styles.deliveryDateBtn} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.deliveryDateText}>
            {store.expectedDeliveryAt ? new Date(store.expectedDeliveryAt).toLocaleDateString('ar-SA') : 'تحديد تاريخ'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={store.expectedDeliveryAt ? new Date(store.expectedDeliveryAt) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              store.setExpectedDeliveryAt(date.toISOString());
            }
          }}
        />
      )}
    </View>
  );

  // Section E
  const renderPartE = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderContainer}>
        <Text style={styles.sectionHeader}>هـ — الإجمالي</Text>
      </View>
      
      <View style={styles.totalsContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المجموع الفرعي:</Text>
          <Text style={styles.totalValue}>{(Number(store.subtotal) || 0).toFixed(2)} ر.س</Text>
        </View>
        
        <View style={styles.totalRow}>
          <View style={styles.discountRow}>
            <Text style={styles.totalLabel}>الخصم: </Text>
            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInput}
                value={store.discountPercent.toString()}
                onChangeText={(val) => store.setDiscount(parseInt(val) || 0)}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={styles.discountPercent}>%</Text>
            </View>
          </View>
          <Text style={styles.discountValue}>- {(Number(store.discountAmount) || 0).toFixed(2)} ر.س</Text>
        </View>
        
        {store.isUrgent && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>رسوم الاستعجال:</Text>
            <Text style={styles.totalValue}>+ {(Number(store.urgencyFeeAmount) || 0).toFixed(2)} ر.س</Text>
          </View>
        )}
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>ضريبة ({store.taxPercent}%):</Text>
          <Text style={styles.totalValue}>+ {(Number(store.taxAmount) || 0).toFixed(2)} ر.س</Text>
        </View>
        
        <View style={styles.totalsDivider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.finalTotalLabel}>الإجمالي:</Text>
          <Text style={styles.finalTotalValue}>{(Number(store.total) || 0).toFixed(2)} ر.س</Text>
        </View>
      </View>
      
      <View style={styles.notesContainer}>
        <Text style={styles.notesLabel}>ملاحظات:</Text>
        <TextInput
          style={styles.notesInput}
          value={store.notes}
          onChangeText={store.setNotes}
          multiline
          placeholderTextColor={colors.textMuted}
          textAlignVertical="top"
          textAlign={i18n.language === 'ar' ? 'right' : 'left'}
        />
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.draftBtn} onPress={() => handleCreate('draft')} disabled={createMutation.isPending}>
          <Text style={styles.draftBtnText}>💾 حفظ كمسودة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn} onPress={() => handleCreate('received')} disabled={createMutation.isPending}>
          {createMutation.isPending ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.createBtnText}>✓ إنشاء + قيد التجهيز</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* إخفاء شريط التبويبات في شاشة إنشاء الفاتورة */}
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>إنشاء فاتورة جديدة</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {renderPartA()}
          {renderPartB()}
          {renderPartC()}
          {renderPartD()}
          {renderPartE()}
        </ScrollView>

        <QRScannerModal visible={qrModalVisible} onClose={() => setQrModalVisible(false)} onScan={handleFetchCustomer} />
        <UniqueIdModal visible={idModalVisible} onClose={() => setIdModalVisible(false)} onSubmit={handleFetchCustomer} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background === '#121212' ? '#1f1f1f' : '#f3f4f6' },
  flex1: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionHeaderContainer: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  // Part A
  customerActionRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  customerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idBtn: { 
    backgroundColor: colors.background === '#121212' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(26, 95, 168, 0.08)', 
    borderWidth: 1, 
    borderColor: colors.background === '#121212' ? 'rgba(74, 144, 226, 0.3)' : 'rgba(26, 95, 168, 0.3)' 
  },
  customerActionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 6, fontSize: 13 },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background === '#121212' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(46, 204, 113, 0.08)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  verifiedBannerLeft: { flexDirection: 'row', alignItems: 'center' },
  verifiedBannerText: { color: colors.success, fontSize: 12, fontWeight: 'bold', marginLeft: 6 },
  verifiedBannerClose: { padding: 4 },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 14, color: colors.text, backgroundColor: colors.background,
  },
  dropdownContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownItemName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownItemPhone: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownEmptyText: {
    padding: 12,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Part B
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    width: '48%',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryCardSelected: { 
    backgroundColor: colors.background === '#121212' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(26, 95, 168, 0.08)', 
    borderColor: colors.primary 
  },
  categoryCardUnselected: { 
    backgroundColor: colors.background === '#121212' ? colors.surface2 : '#f3f4f6', 
    borderColor: colors.border 
  },
  checkboxIcon: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: colors.textMuted,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxIconSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryCardText: { fontSize: 14, color: colors.text },
  categoryCardTextSelected: { fontWeight: 'bold', color: colors.primary },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginVertical: 12, fontSize: 14 },

  // Part C
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    marginBottom: 16, 
    backgroundColor: colors.background === '#121212' ? colors.surface2 : '#f3f4f6' 
  },
  searchInput: { flex: 1, paddingVertical: 8, fontSize: 14, color: colors.text },
  accordionBlock: { marginBottom: 12 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  accordionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginRight: 8 },
  accordionLine: { flex: 1, height: 1, backgroundColor: colors.border },
  accordionContent: { marginTop: 8 },
  itemRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  itemRowSelected: {
    borderRightWidth: 3,
    borderRightColor: colors.primary,
    backgroundColor: colors.background === '#121212' ? 'rgba(74, 144, 226, 0.15)' : 'rgba(26, 95, 168, 0.08)',
  },
  itemRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  itemBasePrice: { fontSize: 13, color: colors.textSecondary },
  serviceTypesRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  serviceTypeBtn: {
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  serviceTypeBtnActive: { backgroundColor: colors.primary },
  serviceTypeBtnInactive: { backgroundColor: colors.background === '#121212' ? colors.surface2 : '#f3f4f6' },
  serviceTypeBtnText: { fontSize: 11, color: colors.textSecondary },
  serviceTypeBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  itemRowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceContainer: { flexDirection: 'row', alignItems: 'center' },
  priceLabel: { fontSize: 12, color: colors.text },
  priceInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 12, minWidth: 40, textAlign: 'center', backgroundColor: colors.background, color: colors.text
  },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.surface },
  stepperBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  stepperText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  stepperValueContainer: { paddingHorizontal: 12, borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  stepperValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },

  // Part D
  paymentGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentBtn: {
    flex: 1,
    borderRadius: 8,
    padding: 9,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paymentBtnActive: { backgroundColor: colors.primary },
  paymentBtnInactive: { backgroundColor: colors.background === '#121212' ? colors.surface2 : '#f3f4f6', borderWidth: 0.5, borderColor: colors.border },
  paymentBtnDisabled: { backgroundColor: colors.background === '#121212' ? colors.surface2 : '#f3f4f6', opacity: 0.5 },
  paymentBtnText: { fontSize: 12, color: colors.text },
  paymentBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  paymentBtnTextDisabled: { color: colors.textMuted },
  urgencyDivider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
  urgencyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  urgencyLabel: { marginLeft: 8, fontSize: 14, color: colors.text, fontWeight: '500' },
  urgencyFeeRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 32 },
  urgencyFeeLabel: { fontSize: 12, color: colors.textSecondary, marginRight: 8 },
  urgencyFeeInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, backgroundColor: colors.background },
  urgencyFeeInput: { paddingVertical: 4, paddingHorizontal: 4, fontSize: 13, minWidth: 50, textAlign: 'center', color: colors.text },
  urgencyFeeCurrency: { fontSize: 12, color: colors.textSecondary },
  deliveryDateContainer: { marginTop: 4 },
  deliveryDateLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontWeight: '500' },
  deliveryDateBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.background },
  deliveryDateText: { fontSize: 14, color: colors.text, marginLeft: 8 },

  // Part E
  totalsContainer: { marginBottom: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { fontSize: 13, color: colors.text },
  totalValue: { fontSize: 13, fontWeight: '500', color: colors.text },
  discountRow: { flexDirection: 'row', alignItems: 'center' },
  discountInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 4, marginLeft: 8, backgroundColor: colors.background },
  discountInput: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 13, width: 40, textAlign: 'center', color: colors.text },
  discountPercent: { paddingRight: 6, fontSize: 12, color: colors.textSecondary },
  discountValue: { fontSize: 13, color: colors.error, fontWeight: '500' },
  totalsDivider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  finalTotalLabel: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  finalTotalValue: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  notesContainer: { marginBottom: 20 },
  notesLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
  notesInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, minHeight: 60, backgroundColor: colors.background, fontSize: 13, color: colors.text },
  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  draftBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: colors.surface },
  draftBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  createBtn: { flex: 2, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});
