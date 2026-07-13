import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CartItem } from '../../stores/invoiceStore';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateServiceType: (id: string, type: 'washing' | 'ironing' | 'washing_and_ironing') => void;
  onUpdateProcessingType: (id: string, type: 'normal' | 'urgent') => void;
  onRemove: (id: string) => void;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onUpdateNotes, onUpdateServiceType, onUpdateProcessingType, onRemove }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const displayName = isArabic ? item.nameAr : item.nameEn;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{displayName}</Text>
        <TouchableOpacity onPress={() => onRemove(item.itemId)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#e74c3c" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.detailsRow}>
        <Text style={styles.price}>{item.unitPrice.toFixed(2)} ر.س / الوحدة</Text>
        
        <View style={styles.stepper}>
          <TouchableOpacity 
            style={styles.stepButton}
            onPress={() => onUpdateQuantity(item.itemId, item.quantity - 1)}
          >
            <Ionicons name="remove" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.stepButton}
            onPress={() => onUpdateQuantity(item.itemId, item.quantity + 1)}
          >
            <Ionicons name="add" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        <Text style={styles.totalPrice}>{item.totalPrice.toFixed(2)} ر.س</Text>
      </View>

      <View style={styles.serviceTypeRow}>
        {(['washing', 'ironing', 'washing_and_ironing'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, item.serviceType === type && styles.typeBtnActive]}
            onPress={() => onUpdateServiceType(item.itemId, type)}
          >
            <Text style={[styles.typeBtnText, item.serviceType === type && styles.typeBtnTextActive]}>
              {t(`invoice.serviceType.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.processingRow}>
        {(['normal', 'urgent'] as const).map(type => (
          <TouchableOpacity
            key={type}
            style={[styles.procBtn, item.processingType === type && styles.procBtnActive]}
            onPress={() => onUpdateProcessingType(item.itemId, type)}
          >
            <Text style={[styles.procBtnText, item.processingType === type && styles.procBtnTextActive]}>
              {t(`invoice.processing.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.notesInput}
        placeholder={`${t('invoice.notes')} (اختياري)`}
        value={item.notes}
        onChangeText={(text) => onUpdateNotes(item.itemId, text)}
        textAlign={isArabic ? 'right' : 'left'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  deleteButton: {
    padding: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  stepButton: {
    padding: 8,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5fa8',
    flex: 1,
    textAlign: 'right', // To push it to the edge
  },
  notesInput: {
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 8,
    fontSize: 13,
    color: '#444',
  },
  serviceTypeRow: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeBtnActive: {
    backgroundColor: '#1a5fa8',
  },
  typeBtnText: {
    fontSize: 12,
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  processingRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  procBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 6,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 6,
  },
  procBtnActive: {
    borderColor: '#e74c3c',
    backgroundColor: '#fff0f0',
  },
  procBtnText: {
    fontSize: 12,
    color: '#666',
  },
  procBtnTextActive: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});
