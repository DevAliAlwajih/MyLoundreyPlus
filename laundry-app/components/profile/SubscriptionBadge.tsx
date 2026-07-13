import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface SubscriptionBadgeProps {
  status: 'trial' | 'active' | 'expired';
}

export const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (status) {
      case 'trial':
        return { bg: '#fff3cd', text: '#856404', key: 'profile.subscriptionStatus.trial' };
      case 'active':
        return { bg: '#d4edda', text: '#155724', key: 'profile.subscriptionStatus.active' };
      case 'expired':
        return { bg: '#f8d7da', text: '#721c24', key: 'profile.subscriptionStatus.expired' };
      default:
        return { bg: '#e2e3e5', text: '#383d41', key: '' };
    }
  };

  const styleConfig = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: styleConfig.bg }]}>
      <Text style={[styles.text, { color: styleConfig.text }]}>
        {styleConfig.key ? t(styleConfig.key) : status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
