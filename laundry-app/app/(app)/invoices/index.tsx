import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useInvoices } from '../../../hooks/useInvoices';
import { InvoiceCard } from '../../../components/invoices/InvoiceCard';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
};

const STATUS_FILTERS = [
  { id: '', labelKey: 'invoice.status.all' },
  { id: 'ready', labelKey: 'invoice.status.ready' },
  { id: 'received', labelKey: 'invoice.status.notReady' },
  { id: 'washing', labelKey: 'invoice.status.processing' },
  { id: 'completed', labelKey: 'invoice.status.delivered' },
];

export default function InvoiceListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // empty means all
  
  const { data: invoices, isLoading, isError, refetch, isRefetching } = useInvoices({
    search,
    status: selectedStatus || undefined,
  });

  const handleFilterPress = (statusId: string) => {
    // If tapping the already selected filter, keep it (user requested single select)
    setSelectedStatus(statusId);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('invoice.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => refetch()}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => handleFilterPress(item.id)}
              >
                <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>
                  {item.id === '' ? t('invoice.status.all') : t(item.labelKey)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('invoice.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/invoices/items')}>
          <Ionicons name="list" size={24} color="#1a5fa8" />
        </TouchableOpacity>
      </View>

      {renderHeader()}

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('invoice.failedToLoad')}</Text>
          <TouchableOpacity onPress={() => refetch()}><Text style={styles.retryText}>{t('common.retry')}</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <InvoiceCard 
              invoice={item} 
              onPress={() => router.push(`/(app)/invoices/${item.id}`)} 
            />
          )}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>{t('invoice.noInvoices')}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/(app)/invoices/new')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333',
    textAlign: 'right',
  },
  filtersContainer: {
    paddingLeft: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipSelected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#1a5fa8',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextSelected: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 80, // for FAB
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 8,
  },
  retryText: {
    color: '#1a5fa8',
    fontWeight: 'bold',
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
    backgroundColor: '#1a5fa8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
