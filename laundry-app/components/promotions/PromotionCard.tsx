import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Promotion, useTogglePromotion, useDeletePromotion } from '../../hooks/usePromotions';
import { useThemeStore } from '../../stores/themeStore';

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onEdit }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useThemeStore();
  const toggleMutation = useTogglePromotion();
  const deleteMutation = useDeletePromotion();

  const title = promotion.title;

  const now = new Date();
  const startDate = new Date(promotion.startDate);
  const endDate = new Date(promotion.endDate);
  
  let statusBadge = '';
  let statusColor = '#999';

  if (now < startDate) {
    statusBadge = t('promotions.notStarted');
    statusColor = '#3498db';
  } else if (now > endDate) {
    statusBadge = t('promotions.expired');
    statusColor = '#95a5a6';
  } else {
    statusBadge = promotion.isActive ? t('promotions.active') : t('promotions.inactive');
    statusColor = promotion.isActive ? '#2ecc71' : '#e74c3c';
  }

  const handleDelete = () => {
    Alert.alert(
      t('promotions.deletePromotion'),
      t('promotions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('promotions.delete'), style: 'destructive', onPress: () => deleteMutation.mutate(promotion.id) }
      ]
    );
  };

  const handleToggle = (val: boolean) => {
    toggleMutation.mutate(promotion.id);
  };

  return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor }]}>
            <Text style={styles.badgeText}>{statusBadge}</Text>
          </View>
        </View>

        {promotion.imageUrl && (
          <Animated.Image 
            source={{ uri: promotion.imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        )}
        
        {promotion.description && (
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>
            {promotion.description}
          </Text>
        )}

        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.datesText, { color: colors.textSecondary }]}>
            {startDate.toLocaleDateString(i18n.language)} - {endDate.toLocaleDateString(i18n.language)}
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.footerActions}>
            <TouchableOpacity onPress={() => onEdit(promotion)} style={styles.actionIconBtn}>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionIconBtn}>
              <Ionicons name="trash" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>

          <View style={styles.footerToggleRow}>
            <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
              {promotion.isActive ? t('promotions.enabled') : t('promotions.disabled')}
            </Text>
            <Switch
              value={promotion.isActive}
              onValueChange={handleToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={promotion.isActive ? colors.primary : '#f4f3f4'}
              disabled={toggleMutation.isPending}
            />
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  datesText: {
    fontSize: 13,
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBtn: {
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
  },
  footerToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    marginRight: 8,
  },
});
