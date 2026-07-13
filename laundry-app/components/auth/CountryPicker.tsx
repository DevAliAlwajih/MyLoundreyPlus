import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Country {
  code: string;
  nameEn: string;
  nameAr: string;
  flag: string;
}

const GULF_COUNTRIES: Country[] = [
  { code: '+966', nameEn: 'Saudi Arabia', nameAr: 'السعودية', flag: '🇸🇦' },
  { code: '+971', nameEn: 'UAE', nameAr: 'الإمارات', flag: '🇦🇪' },
  { code: '+965', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼' },
  { code: '+973', nameEn: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭' },
  { code: '+968', nameEn: 'Oman', nameAr: 'عُمان', flag: '🇴🇲' },
  { code: '+974', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦' },
  { code: '+967', nameEn: 'Yemen', nameAr: 'اليمن', flag: '🇾🇪' },
];

interface CountryPickerProps {
  selectedCode: string;
  onSelect: (code: string) => void;
  language?: 'ar' | 'en';
}

export const CountryPicker: React.FC<CountryPickerProps> = ({ selectedCode, onSelect, language = 'ar' }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedCountry = GULF_COUNTRIES.find((c) => c.code === selectedCode) || GULF_COUNTRIES[0];

  return (
    <>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.codeText}>{selectedCountry.code}</Text>
        <Ionicons name="chevron-down" size={16} color="#666" style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'ar' ? 'اختر الدولة' : 'Select Country'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={GULF_COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    item.code === selectedCode && styles.countryItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.code);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.itemFlag}>{item.flag}</Text>
                  <Text style={styles.itemName}>
                    {language === 'ar' ? item.nameAr : item.nameEn}
                  </Text>
                  <Text style={styles.itemCode}>{item.code}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
    height: '100%',
  },
  flagText: {
    fontSize: 18,
    marginRight: 6,
  },
  codeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30, // Safe area for newer iPhones
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  countryItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  itemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
});
