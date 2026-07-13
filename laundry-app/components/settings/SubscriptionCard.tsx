import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SubscriptionInfo } from '../../stores/laundryStore';

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
  const { t, i18n } = useTranslation();
  const isExpired = subscription.status === 'expired';

  const handleRenew = () => {
    Alert.alert(t('settings.renewSubscription'), t('settings.renewMessage'));
  };

  const planName = i18n.language === 'ar' ? subscription.planNameAr : subscription.planName;

  return (
    <View style={[styles.card, isExpired && styles.cardExpired]}>
      <View style={styles.header}>
        <Text style={styles.planName}>📋 {planName}</Text>
        <Text style={[styles.status, isExpired && styles.statusExpired]}>
          {isExpired ? t('settings.subscriptionExpired') : 'نشط ✓'}
        </Text>
      </View>
      
      <Text style={styles.detailsText}>
        تنتهي في: {new Date(subscription.expiresAt).toLocaleDateString(i18n.language)}
      </Text>
      
      <Text style={[styles.detailsText, isExpired && styles.expiredText]}>
        {t('settings.daysRemaining', { days: subscription.daysRemaining })}
      </Text>

      <TouchableOpacity style={styles.renewBtn} onPress={handleRenew}>
        <Text style={styles.renewBtnText}>{t('settings.renewSubscription')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce5ff',
  },
  cardExpired: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffeaea',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a5fa8',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ecc71',
  },
  statusExpired: {
    color: '#e74c3c',
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'left',
  },
  expiredText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  renewBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#1a5fa8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  renewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
