import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useInvoices } from '../../../hooks/useInvoices';
import { InvoiceCard } from '../../../components/invoices/InvoiceCard';
import { useThemeStore } from '../../../stores/themeStore';

const STATUS_FILTERS = [
  { id: '',          labelKey: 'invoice.status.all' },
  { id: 'draft',     labelKey: 'invoice.status.draft' },
  { id: 'received',  labelKey: 'invoice.status.received' },
  { id: 'completed', labelKey: 'invoice.status.completed' },
  { id: 'cancelled', labelKey: 'invoice.status.cancelled' },
];

export default function InvoiceListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  
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
    <View style={[styles.headerContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('invoice.searchPlaceholder')}
          placeholderTextColor={colors.textSecondary}
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
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.background },
                  isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                ]}
                onPress={() => handleFilterPress(item.id)}
              >
                <Text style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  isSelected && { color: colors.primary, fontWeight: 'bold' }
                ]}>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>{t('invoice.title')}</Text>
        <TouchableOpacity onPress={() => router.push('/(app)/invoices/items')}>
          <Ionicons name="list" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderHeader()}

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{t('invoice.failedToLoad')}</Text>
          <TouchableOpacity onPress={() => refetch()}><Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t('common.retry')}</Text></TouchableOpacity>
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
              <Ionicons name="document-text-outline" size={60} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('invoice.noInvoices')}</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]} 
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    textAlign: 'right',
  },
  filtersContainer: {
    paddingLeft: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
