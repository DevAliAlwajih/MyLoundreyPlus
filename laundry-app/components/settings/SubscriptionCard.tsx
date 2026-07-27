import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SubscriptionInfo } from '../../stores/laundryStore';
import { useThemeStore } from '../../stores/themeStore';

interface SubscriptionCardProps {
  subscription: SubscriptionInfo;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ subscription }) => {
  const { t, i18n } = useTranslation();
  const isExpired = subscription.status === 'expired';
  const { colors } = useThemeStore();

  const handleRenew = () => {
    Alert.alert(t('settings.renewSubscription'), t('settings.renewMessage'));
  };

  const planName = i18n.language === 'ar' ? subscription.planNameAr : subscription.planName;

  return (
    <View style={[styles.card, { backgroundColor: isExpired ? colors.error + '10' : colors.primary + '10', borderColor: isExpired ? colors.error + '30' : colors.primary + '30' }]}>
      <View style={styles.header}>
        <Text style={[styles.planName, { color: colors.primary }]}>📋 {planName}</Text>
        <Text style={[styles.status, { color: isExpired ? colors.error : colors.success }]}>
          {isExpired ? t('settings.subscriptionExpired') : 'نشط ✓'}
        </Text>
      </View>
      
      <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
        تنتهي في: {new Date(subscription.expiresAt).toLocaleDateString(i18n.language)}
      </Text>
      
      <Text style={[styles.detailsText, { color: isExpired ? colors.error : colors.textSecondary }, isExpired && styles.expiredText]}>
        {t('settings.daysRemaining', { days: subscription.daysRemaining })}
      </Text>

      <TouchableOpacity style={[styles.renewBtn, { backgroundColor: colors.primary }]} onPress={handleRenew}>
        <Text style={styles.renewBtnText}>{t('settings.renewSubscription')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
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
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  detailsText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'left',
  },
  expiredText: {
    fontWeight: 'bold',
  },
  renewBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
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
