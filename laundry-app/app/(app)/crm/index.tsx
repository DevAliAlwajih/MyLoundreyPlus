import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCustomers } from '../../../hooks/useCRM';
import { CustomerCard } from '../../../components/crm/CustomerCard';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
};

export default function CRMScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeferred, setFilterDeferred] = useState(false);

  const { data: customers, isLoading, isError, refetch, isRefetching } = useCustomers(searchQuery, filterDeferred);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('crm.search')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => refetch()}
          textAlign="right"
        />
      </View>

      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[styles.filterBtn, !filterDeferred && styles.filterBtnActive]}
          onPress={() => setFilterDeferred(false)}
        >
          <Text style={[styles.filterText, !filterDeferred && styles.filterTextActive]}>
            {t('crm.allCustomers')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterBtn, filterDeferred && styles.filterBtnActive]}
          onPress={() => setFilterDeferred(true)}
        >
          <Text style={[styles.filterText, filterDeferred && styles.filterTextActive]}>
            {t('crm.withDebt')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('crm.title')}</Text>
      </View>

      {renderHeader()}

      {isLoading && !isRefetching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('crm.failedToLoad')}</Text>
          <TouchableOpacity onPress={() => refetch()}><Text style={{ color: COLORS.primary }}>{t('common.retry')}</Text></TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item, index) => item.customerId || index.toString()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
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
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterBtnActive: {
    backgroundColor: '#f0f8ff',
    borderColor: '#1a5fa8',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
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
});
