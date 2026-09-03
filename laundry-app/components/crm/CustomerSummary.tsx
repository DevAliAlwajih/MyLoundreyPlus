import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomerDetail } from '../../stores/crmStore';
import { useLaundryStore } from '../../stores/laundryStore';
import { useRemindCustomer, useUpdateCustomerProfile } from '../../hooks/useCRM';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../stores/themeStore';

interface CustomerSummaryProps {
  customer: CustomerDetail;
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({ customer }) => {
  const { t, i18n } = useTranslation();
  const { profile } = useLaundryStore();
  const router = useRouter();
  const { colors } = useThemeStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(customer.customerName || '');
  const [editPhone, setEditPhone] = useState(customer.customerPhone || '');
  const [editNotes, setEditNotes] = useState(customer.notes || '');

  const remindMutation = useRemindCustomer();
  const updateProfileMutation = useUpdateCustomerProfile();

  const isRegistered = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customer.customerId);

  const handleCall = () => {
    if (customer.customerPhone) {
      Linking.openURL(`tel:${customer.customerPhone}`);
    }
  };

  const handleChat = () => {
    router.push(`/conversation-modal/${customer.customerId}`);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(
      { 
        customerId: customer.customerId, 
        data: { localName: editName, localPhone: editPhone, notes: editNotes }
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('crm.profileUpdated', 'تم تحديث بيانات العميل'));
          setEditModalVisible(false);
        },
        onError: (err: any) => {
          Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
        }
      }
    );
  };

  const handleSendReminder = () => {
    if (!customer.customerPhone && !customer.customerId) return;

    const executeReminder = (channel: 'whatsapp' | 'app' | 'both') => {
      remindMutation.mutate(
        { customerId: customer.customerId, channel },
        {
          onSuccess: () => {
            if (channel === 'whatsapp' || channel === 'both') {
              const laundryName = i18n.language === 'ar' ? profile?.nameAr : profile?.name;
              const msg = t('crm.whatsappMessage', { 
                name: customer.customerName, 
                amount: customer.deferredBalance.toFixed(2),
                laundry: laundryName || ''
              });
              
              if (customer.customerPhone) {
                const url = `whatsapp://send?phone=${customer.customerPhone}&text=${encodeURIComponent(msg)}`;
                Linking.openURL(url).catch(() => {
                  Alert.alert(t('common.error'), t('crm.whatsappNotInstalled'));
                });
              }
            } else if (channel === 'app') {
              Alert.alert(t('common.success'), t('crm.reminderSent'));
            }
          },
          onError: (err: any) => {
            Alert.alert(t('common.error'), err.response?.data?.message || t('common.error'));
          }
        }
      );
    };

    if (isRegistered) {
      Alert.alert(
        t('crm.reminderChannelTitle'),
        '',
        [
          { text: t('crm.whatsappOnly'), onPress: () => executeReminder('whatsapp') },
          { text: t('crm.appNotificationOnly'), onPress: () => executeReminder('app') },
          { text: t('crm.bothChannels'), onPress: () => executeReminder('both') },
          { text: t('common.cancel'), style: 'cancel' }
        ]
      );
    } else {
      // Walk-in customer: WhatsApp only
      executeReminder('whatsapp');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{customer.customerName?.charAt(0) || 'ع'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{customer.customerName || t('crm.unregisteredCustomer')}</Text>
          <Text style={[styles.phone, { color: colors.textSecondary }]}>{customer.customerPhone}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditModalVisible(true)}>
            <Ionicons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
          {isRegistered && (
            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.background }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('crm.visits')}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{customer.totalInvoices}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('crm.totalSpent')}</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{customer.totalSpent?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('crm.deferredBalance')}</Text>
          <Text style={[styles.statValue, customer.deferredBalance > 0 && styles.debtValue, !customer.deferredBalance && { color: colors.text }]}>
            {(Number(customer.deferredBalance) || 0).toFixed(2)}
          </Text>
        </View>
      </View>

      {customer.deferredBalance > 0 && (
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleSendReminder}>
          <Ionicons name="notifications-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappText}>{t('crm.sendReminder')}</Text>
        </TouchableOpacity>
      )}

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('crm.editProfile', 'تعديل بيانات العميل')}</Text>
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('crm.customerName', 'الاسم')}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editName}
              onChangeText={setEditName}
              placeholder={t('crm.customerName', 'الاسم')}
              placeholderTextColor={colors.textSecondary}
            />
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('crm.customerPhone', 'الهاتف')}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder={t('crm.customerPhone', 'الهاتف')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
            
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('crm.notes', 'ملاحظات')}</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder={t('crm.notes', 'ملاحظات')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setEditModalVisible(false)}
                disabled={updateProfileMutation.isPending}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>{t('common.save')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phone: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  chatBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a5fa8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f39c12',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2ecc71',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debtValue: {
    color: '#e74c3c',
  },
  divider: {
    width: 1,
    marginHorizontal: 8,
  },
  whatsappBtn: {
    flexDirection: 'row',
    backgroundColor: '#1a5fa8',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  whatsappText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#1a5fa8',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
