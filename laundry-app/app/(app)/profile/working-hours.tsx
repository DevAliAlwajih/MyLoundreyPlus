import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  ActivityIndicator, Alert, Modal, TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLaundryStore, WorkingHour } from '../../../stores/laundryStore';
import { 
  useUpdateProfile, 
  useLaundryHolidays, 
  useAddHoliday, 
  useDeleteHoliday 
} from '../../../hooks/useLaundryProfile';
import { WorkingHourRow } from '../../../components/profile/WorkingHourRow';

const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  error: '#e74c3c',
  border: '#ddd',
  white: '#fff',
  text: '#333',
  gray: '#666',
};

const DEFAULT_HOURS: WorkingHour[] = [
  { day: 'sunday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '22:00' },
  { day: 'friday', isOpen: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'saturday', isOpen: false, openTime: '08:00', closeTime: '22:00' },
];

export default function WorkingHoursScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const { profile } = useLaundryStore();
  
  // Weekly Hours State & Hooks
  const updateMutation = useUpdateProfile();
  const initialHours = useMemo(() => {
    return DEFAULT_HOURS.map(dh => {
      const existing = profile?.workingHours?.find(wh => wh.day === dh.day);
      return existing ? { ...existing } : { ...dh };
    });
  }, [profile?.workingHours]);
  
  const [hours, setHours] = useState<WorkingHour[]>(initialHours);

  // Exceptional Holidays Hooks
  const { data: holidays = [], isLoading: isLoadingHolidays } = useLaundryHolidays(true);
  const addHolidayMutation = useAddHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayReason, setHolidayReason] = useState('');

  // Handlers for Weekly Hours
  const handleRowChange = (updatedItem: WorkingHour) => {
    setHours(prev => prev.map(h => (h.day === updatedItem.day ? updatedItem : h)));
  };

  const handleSave = () => {
    updateMutation.mutate({ workingHours: hours }, {
      onSuccess: () => {
        Alert.alert(t('common.success'), t('profile.updateSuccess'), [
          { text: t('common.ok'), onPress: () => router.back() }
        ]);
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || t('common.updateFailed'));
      }
    });
  };

  // Handlers for Holidays
  const handleAddHoliday = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) {
      Alert.alert(t('common.error'), t('workingHours.invalidDateFormat'));
      return;
    }

    addHolidayMutation.mutate({ date: holidayDate, reason: holidayReason || undefined }, {
      onSuccess: () => {
        setModalVisible(false);
        setHolidayDate('');
        setHolidayReason('');
      },
      onError: (err: any) => {
        Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
      }
    });
  };

  const handleDeleteHoliday = (id: string) => {
    Alert.alert(
      t('workingHours.deleteConfirmTitle'),
      t('workingHours.deleteConfirmMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.ok'), 
          style: 'destructive',
          onPress: () => {
            deleteHolidayMutation.mutate(id, {
              onError: (err: any) => {
                Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
              }
            });
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.workingHours')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Weekly Hours */}
        {hours.map((item) => (
          <WorkingHourRow
            key={item.day}
            item={item}
            onChange={handleRowChange}
          />
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Exceptional Holidays Section */}
        <View style={[styles.sectionHeader, isRTL && styles.rowReverse]}>
          <Text style={styles.sectionTitle}>{t('workingHours.exceptionalHolidays')}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <Ionicons name="add" size={18} color={COLORS.primary} />
            <Text style={styles.addButtonText}>{t('workingHours.addHoliday')}</Text>
          </TouchableOpacity>
        </View>

        {isLoadingHolidays ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        ) : holidays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={40} color={COLORS.border} />
            <Text style={styles.emptyText}>{t('workingHours.noHolidays')}</Text>
          </View>
        ) : (
          holidays.map((holiday) => (
            <View key={holiday.id} style={[styles.holidayCard, isRTL && styles.rowReverse]}>
              <View style={styles.holidayInfo}>
                <Text style={[styles.holidayDate, isRTL && styles.textRight]}>{holiday.date}</Text>
                {!!holiday.reason && (
                  <Text style={[styles.holidayReason, isRTL && styles.textRight]}>{holiday.reason}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteHoliday(holiday.id)}
                disabled={deleteHolidayMutation.isPending}
              >
                <Ionicons name="trash-outline" size={20} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('profile.saveHours')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Holiday Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, isRTL && styles.rowReverse]}>
              <Text style={styles.modalTitle}>{t('workingHours.addHoliday')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.label, isRTL && styles.textRight]}>
                {t('workingHours.holidayDate')} (YYYY-MM-DD)
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.textRight]}
                placeholder="2026-07-09"
                value={holidayDate}
                onChangeText={setHolidayDate}
                keyboardType="numeric"
              />

              <Text style={[styles.label, isRTL && styles.textRight, { marginTop: 16 }]}>
                {t('workingHours.holidayReason')}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.textRight]}
                placeholder={t('workingHours.holidayReason')}
                value={holidayReason}
                onChangeText={setHolidayReason}
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { marginTop: 20 }]} 
              onPress={handleAddHoliday}
              disabled={addHolidayMutation.isPending || !holidayDate}
            >
              {addHolidayMutation.isPending ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
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
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderStyle: 'dashed',
  },
  emptyText: {
    marginTop: 8,
    color: COLORS.gray,
    fontSize: 14,
  },
  holidayCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
  },
  holidayInfo: {
    flex: 1,
  },
  holidayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  holidayReason: {
    fontSize: 13,
    color: COLORS.gray,
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
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
    color: COLORS.text,
  },
  modalBody: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'left',
  },
});
