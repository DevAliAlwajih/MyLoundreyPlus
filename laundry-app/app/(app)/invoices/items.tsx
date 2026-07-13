import React, { useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCatalogMenu, useDeleteCatalogItem, useDeleteCategory, CatalogItem, CatalogCategory } from '../../../hooks/useInvoices';
import { CatalogItemRow } from '../../../components/invoices/CatalogItemRow';
import { ItemFormModal } from '../../../components/invoices/ItemFormModal';
import { CategoryFormModal } from '../../../components/invoices/CategoryFormModal';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
};

export default function CatalogItemsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const { data: menuData, isLoading } = useCatalogMenu();
  const deleteItemMutation = useDeleteCatalogItem();
  const deleteCategoryMutation = useDeleteCategory();

  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [initialCategoryId, setInitialCategoryId] = useState<string | undefined>();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CatalogCategory | null>(null);

  // --- Category Handlers ---
  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (cat: CatalogCategory) => {
    setEditingCategory(cat);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (cat: CatalogCategory) => {
    Alert.alert(
      t('catalog.deleteCategory'),
      t('catalog.deleteCategoryConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.ok'), 
          style: 'destructive',
          onPress: () => deleteCategoryMutation.mutate(cat.categoryId)
        }
      ]
    );
  };

  // --- Item Handlers ---
  const handleAddItem = (categoryId?: string) => {
    setEditingItem(null);
    setInitialCategoryId(categoryId);
    setItemModalVisible(true);
  };

  const handleEditItem = (item: CatalogItem) => {
    setEditingItem(item);
    setItemModalVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    deleteItemMutation.mutate(id);
  };

  // --- Renderers ---
  const sections = menuData?.map(c => ({
    ...c,
    title: c.categoryName,
    data: c.items,
  })) || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* إخفاء شريط التبويبات في شاشة قائمة الأسعار */}
      <Tabs.Screen options={{ tabBarStyle: { display: 'none' } }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('catalog.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.itemId}
          contentContainerStyle={styles.listContent}
          
          ListHeaderComponent={
            <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              <Text style={styles.addCategoryText}>{t('catalog.addCategory')}</Text>
            </TouchableOpacity>
          }

          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionActions}>
                <TouchableOpacity style={styles.sectionActionBtn} onPress={() => handleEditCategory(section as unknown as CatalogCategory)}>
                  <Ionicons name="pencil" size={18} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.sectionActionBtn} onPress={() => handleDeleteCategory(section as unknown as CatalogCategory)}>
                  <Ionicons name="trash" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          renderItem={({ item }) => (
            <CatalogItemRow
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          )}

          renderSectionFooter={({ section }) => (
            <TouchableOpacity style={styles.addItemBtn} onPress={() => handleAddItem(section.categoryId)}>
              <Ionicons name="add" size={20} color="#666" />
              <Text style={styles.addItemText}>{t('catalog.addItem')}</Text>
            </TouchableOpacity>
          )}

          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('catalog.noCategories')}</Text>
            </View>
          }
        />
      )}

      {/* FAB for quick add item */}
      <TouchableOpacity style={styles.fab} onPress={() => handleAddItem()}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ItemFormModal
        visible={itemModalVisible}
        onClose={() => setItemModalVisible(false)}
        item={editingItem}
        categories={menuData || []}
        initialCategoryId={initialCategoryId}
      />

      <CategoryFormModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        category={editingCategory}
      />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  addCategoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionActions: {
    flexDirection: 'row',
  },
  sectionActionBtn: {
    padding: 4,
    marginLeft: 12,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
