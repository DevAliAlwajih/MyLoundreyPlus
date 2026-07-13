import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useMyPromotions, useAdminAds, Promotion } from '../../../hooks/usePromotions';
import { PromotionCard } from '../../../components/promotions/PromotionCard';
import { AdminAdCard } from '../../../components/promotions/AdminAdCard';
import { PromotionFormModal } from '../../../components/promotions/PromotionFormModal';

export default function PromotionsScreen() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'my' | 'ads'>('my');
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const myPromotionsQuery = useMyPromotions();
  const adminAdsQuery = useAdminAds();

  const handleAdd = () => {
    setEditingPromotion(null);
    setModalVisible(true);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromotion(promo);
    setModalVisible(true);
  };

  const renderContent = () => {
    if (activeTab === 'my') {
      if (myPromotionsQuery.isLoading) return <ActivityIndicator style={styles.center} color="#1a5fa8" />;
      return (
        <FlatList
          data={myPromotionsQuery.data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <PromotionCard promotion={item} onEdit={handleEdit} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('promotions.noPromotions')}</Text>}
        />
      );
    } else {
      if (adminAdsQuery.isLoading) return <ActivityIndicator style={styles.center} color="#1a5fa8" />;
      return (
        <FlatList
          data={adminAdsQuery.data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <AdminAdCard ad={item} />}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('promotions.noPromotions')}</Text>}
        />
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('promotions.title')}</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.tabActive]} onPress={() => setActiveTab('my')}>
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>{t('promotions.myPromotions')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'ads' && styles.tabActive]} onPress={() => setActiveTab('ads')}>
          <Text style={[styles.tabText, activeTab === 'ads' && styles.tabTextActive]}>{t('promotions.platformAds')}</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      {activeTab === 'my' && (
        <TouchableOpacity style={styles.fab} onPress={handleAdd}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}

      <PromotionFormModal 
        visible={isModalVisible} 
        promotion={editingPromotion} 
        onClose={() => setModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a5fa8',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a5fa8',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a5fa8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
