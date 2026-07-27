import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/themeStore';

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
  const { colors } = useThemeStore();

  const selectedCountry = GULF_COUNTRIES.find((c) => c.code === selectedCode) || GULF_COUNTRIES[0];
  const styles = getStyles(colors);

  return (
    <>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{selectedCountry.flag}</Text>
        <Text style={styles.codeText}>{selectedCountry.code}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
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
                <Ionicons name="close" size={24} color={colors.text} />
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

const getStyles = (colors: any) => StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    height: '100%',
  },
  flagText: {
    fontSize: 18,
    marginRight: 6,
  },
  codeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryItemSelected: {
    backgroundColor: colors.surface2,
  },
  itemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
});

