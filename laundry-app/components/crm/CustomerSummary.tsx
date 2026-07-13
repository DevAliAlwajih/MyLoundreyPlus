import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { CustomerDetail } from '../../stores/crmStore';
import { useLaundryStore } from '../../stores/laundryStore';
import { useRemindCustomer } from '../../hooks/useCRM';
import { useRouter } from 'expo-router';

interface CustomerSummaryProps {
  customer: CustomerDetail;
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({ customer }) => {
  const { t, i18n } = useTranslation();
  const { profile } = useLaundryStore();
  const router = useRouter();

  const isRegistered = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customer.customerId);

  const handleCall = () => {
    if (customer.customerPhone) {
      Linking.openURL(`tel:${customer.customerPhone}`);
    }
  };

  const handleChat = () => {
    router.push(`/(app)/chat/${customer.customerId}`);
  };

  const remindMutation = useRemindCustomer();

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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{customer.customerName?.charAt(0) || 'ع'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{customer.customerName || t('crm.unregisteredCustomer')}</Text>
          <Text style={styles.phone}>{customer.customerPhone}</Text>
        </View>
        <View style={styles.actionButtons}>
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

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('crm.visits')}</Text>
          <Text style={styles.statValue}>{customer.totalInvoices}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('crm.totalSpent')}</Text>
          <Text style={styles.statValue}>{customer.totalSpent?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('crm.deferredBalance')}</Text>
          <Text style={[styles.statValue, customer.deferredBalance > 0 && styles.debtValue]}>
            {customer.deferredBalance.toFixed(2)}
          </Text>
        </View>
      </View>

      {customer.deferredBalance > 0 && (
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleSendReminder}>
          <Ionicons name="notifications-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappText}>{t('crm.sendReminder')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a5fa8',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#f8f9fa',
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
    color: '#888',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  debtValue: {
    color: '#e74c3c',
  },
  divider: {
    width: 1,
    backgroundColor: '#ddd',
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
});
