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
        return { bg: '#f3f4f6', text: '#6b7280' };      // رمادي — مسودة
      case 'received':
        return { bg: '#dbeafe', text: '#1e40af' };      // أزرق — قيد التجهيز
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46' };      // أخضر — تم التسليم
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b' };      // أحمر — ملغي
      // حالات قديمة للتوافقية مع بيانات موجودة
      case 'washing':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'ironing':
        return { bg: '#dbeafe', text: '#1e40af' };
      case 'ready':
        return { bg: '#d1fae5', text: '#065f46' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280' };
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
