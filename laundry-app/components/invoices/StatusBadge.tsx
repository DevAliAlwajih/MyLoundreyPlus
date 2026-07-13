import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStyle = () => {
    switch (status) {
      case 'draft':
        return { bg: '#e2e3e5', text: '#383d41' };
      case 'received':
        return { bg: '#cce5ff', text: '#004085' };
      case 'washing':
        return { bg: '#d1ecf1', text: '#0c5460' };
      case 'ironing':
        return { bg: '#fff3cd', text: '#856404' };
      case 'ready':
        return { bg: '#d4edda', text: '#155724' };
      case 'completed':
        return { bg: '#d4edda', text: '#155724' }; // Or a different shade of green
      case 'cancelled':
        return { bg: '#f8d7da', text: '#721c24' };
      default:
        return { bg: '#e2e3e5', text: '#383d41' };
    }
  };

  const styleConfig = getStyle();

  return (
    <View style={[styles.badge, { backgroundColor: styleConfig.bg }]}>
      <Text style={[styles.text, { color: styleConfig.text }]}>
        {t(`invoice.status.${status}`)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
