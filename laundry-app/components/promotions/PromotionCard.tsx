import React from 'react';
import { View, Text, StyleSheet, Switch, Animated, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Promotion, useTogglePromotion, useDeletePromotion } from '../../hooks/usePromotions';

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onEdit }) => {
  const { t, i18n } = useTranslation();
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
    toggleMutation.mutate({ id: promotion.id, isActive: val });
  };

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.editAction} onPress={() => onEdit(promotion)}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="pencil" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name="trash" size={24} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
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
          <Text style={styles.descriptionText} numberOfLines={2}>
            {promotion.description}
          </Text>
        )}

        <View style={styles.datesRow}>
          <Ionicons name="calendar-outline" size={14} color="#888" />
          <Text style={styles.datesText}>
            {startDate.toLocaleDateString(i18n.language)} - {endDate.toLocaleDateString(i18n.language)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.toggleLabel}>
            {promotion.isActive ? t('promotions.enabled') : t('promotions.disabled')}
          </Text>
          <Switch
            value={promotion.isActive}
            onValueChange={handleToggle}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={promotion.isActive ? '#1a5fa8' : '#f4f3f4'}
            disabled={toggleMutation.isPending}
          />
        </View>
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
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
    color: '#333',
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
    color: '#666',
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
    color: '#666',
    marginLeft: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    width: 140,
    marginBottom: 12,
  },
  editAction: {
    flex: 1,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteAction: {
    flex: 1,
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
