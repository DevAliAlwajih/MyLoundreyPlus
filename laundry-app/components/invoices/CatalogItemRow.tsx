import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CatalogItem } from '../../hooks/useInvoices';
import { Swipeable } from 'react-native-gesture-handler';

interface CatalogItemRowProps {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (id: string) => void;
  onAdd?: (item: CatalogItem) => void; // for POS view
  selectedQuantity?: number; // for POS view
}

export const CatalogItemRow: React.FC<CatalogItemRowProps> = ({ item, onEdit, onDelete, onAdd, selectedQuantity = 0 }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const displayName = isArabic ? item.nameAr : (item.nameEn || item.nameAr);

  const renderRightActions = () => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => onEdit(item)}>
          <Ionicons name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(item.itemId)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const content = (
    <View style={[styles.container, selectedQuantity > 0 && styles.containerSelected, !item.isActive && styles.containerInactive]}>
      <View style={styles.info}>
        <Text style={[styles.name, !item.isActive && styles.inactiveText]}>{displayName}</Text>
        
        <View style={styles.pricesRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('catalog.washingPrice')}:</Text>
            <Text style={styles.priceValue}>{item.washingPrice ?? '-'} ر.س</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('catalog.ironingPrice')}:</Text>
            <Text style={styles.priceValue}>{item.ironingPrice ?? '-'} ر.س</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>{t('catalog.fullPrice')}:</Text>
            <Text style={[styles.priceValue, styles.fullPrice]}>{item.fullServicePrice} ر.س</Text>
          </View>
        </View>
      </View>

      {onAdd && (
        <View style={styles.addActions}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => onAdd(item)}
            disabled={!item.isActive}
          >
            {selectedQuantity > 0 ? (
              <Text style={styles.qtyBadge}>{selectedQuantity}</Text>
            ) : (
              <Ionicons name="add-circle-outline" size={28} color={item.isActive ? "#1a5fa8" : "#ccc"} />
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (onAdd) {
    // If it's in POS mode, we don't want swipe actions, just standard tapping to add
    return <TouchableOpacity onPress={() => item.isActive && onAdd(item)} activeOpacity={0.7} disabled={!item.isActive}>{content}</TouchableOpacity>;
  }

  return (
    <Swipeable renderRightActions={renderRightActions}>
      {content}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  containerSelected: {
    backgroundColor: '#f0f8ff',
  },
  containerInactive: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  inactiveText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: '#666',
    marginRight: 4,
  },
  priceValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#444',
  },
  fullPrice: {
    color: '#1a5fa8',
  },
  priceDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: 140,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#3498db',
  },
  deleteBtn: {
    backgroundColor: '#e74c3c',
  },
  addActions: {
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBadge: {
    backgroundColor: '#1a5fa8',
    color: '#fff',
    fontWeight: 'bold',
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
  },
});
