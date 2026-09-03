import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCustomers, useUpdateCustomerProfile } from '../../../hooks/useCRM';
import { CustomerCard } from '../../../components/crm/CustomerCard';
import { useThemeStore } from '../../../stores/themeStore';
import { Modal } from 'react-native';



export default function CRMScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeferred, setFilterDeferred] = useState(false);
  const { colors } = useThemeStore();

  // Add Customer Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const { data: customers, isLoading, isError, refetch, isRefetching } = useCustomers(searchQuery, filterDeferred);
  const addCustomerMutation = useUpdateCustomerProfile();

  const handleAddCustomer = () => {
    if (!newName.trim() || !newPhone.trim()) {
      alert(t('common.error', 'الاسم ورقم الهاتف مطلوبان'));
      return;
    }
    
    // We pass the phone as customerId to create a local profile
    addCustomerMutation.mutate(
      { 
        customerId: newPhone, 
        data: { localName: newName, localPhone: newPhone, notes: newLocation } 
      },
      {
        onSuccess: () => {
          setAddModalVisible(false);
          setNewName('');
          setNewPhone('');
          setNewLocation('');
          refetch();
        },
        onError: (err: any) => {
          alert(err.response?.data?.message || t('common.error', 'حدث خطأ'));
        }
      }
    );
  };

  const renderHeader = () => (
    <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('crm.search')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => refetch()}
          textAlign="right"
        />
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.background }, !filterDeferred && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          onPress={() => setFilterDeferred(false)}
        >
          <Text style={[styles.filterText, { color: colors.textSecondary }, !filterDeferred && { color: colors.primary, fontWeight: 'bold' }]}>
            {t('crm.allCustomers')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: colors.background }, filterDeferred && { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
          onPress={() => setFilterDeferred(true)}
        >
          <Text style={[styles.filterText, { color: colors.textSecondary }, filterDeferred && { color: colors.primary, fontWeight: 'bold' }]}>
            {t('crm.withDebt')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('crm.title')}</Text>
      </View>

      {renderHeader()}

      {isLoading && !isRefetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('crm.failedToLoad')}</Text>
          <TouchableOpacity onPress={() => refetch()}><Text style={{ color: colors.primary }}>{t('common.retry')}</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, index) => `${item.customerId ?? 'c'}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <CustomerCard 
              customer={item} 
              onPress={() => {
                if (item.customerId) {
                  router.push(`/(app)/crm/${encodeURIComponent(item.customerId)}`);
                }
              }} 
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {filterDeferred ? t('crm.noDebtCustomers') : t('crm.noCustomers')}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
        onPress={() => setAddModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Customer Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>إضافة عميل جديد</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>الاسم (مطلوب)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="اسم العميل"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>رقم الهاتف (مطلوب)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="05xxxxxxxx"
                keyboardType="phone-pad"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />

              <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>الموقع (اختياري)</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                value={newLocation}
                onChangeText={setNewLocation}
                placeholder="موقع العميل"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: colors.primary }]} 
              onPress={handleAddCustomer}
              disabled={addCustomerMutation.isPending}
            >
              {addCustomerMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>إضافة العميل</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerContainer: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {},
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {},
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
  },
  saveButton: {
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
