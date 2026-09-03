import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TopItem } from '../../stores/reportStore';
import { useThemeStore } from '../../stores/themeStore';

interface TopItemsTableProps {
  items: TopItem[];
}

export const TopItemsTable: React.FC<TopItemsTableProps> = ({ items }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();

  if (!items || items.length === 0) {
    return <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('reports.noData')}</Text>;
  }

  // Find max revenue for bar scaling
  const maxRevenue = Math.max(...items.map(i => i.revenue));

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const name = i18n.language === 'ar' ? item.itemNameAr : (item.itemNameEn || item.itemNameAr);
        const percentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

        return (
          <View key={index} style={styles.row}>
            <View style={[styles.rankBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
            </View>
            
            <View style={styles.detailsCol}>
              <View style={styles.textRow}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                <Text style={[styles.revenue, { color: colors.primary }]}>{item.revenue.toFixed(2)} {t('reports.currency')}</Text>
              </View>
              <Text style={[styles.quantity, { color: colors.textSecondary }]}>{item.quantity} {t('reports.quantity')}</Text>
              
              <View style={[styles.barTrack, { backgroundColor: colors.background }]}>
                <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: colors.primary }]} />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detailsCol: {
    flex: 1,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  revenue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quantity: {
    fontSize: 12,
    marginBottom: 6,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
