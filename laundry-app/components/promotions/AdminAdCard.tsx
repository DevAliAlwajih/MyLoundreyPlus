import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AdminAd } from '../../hooks/usePromotions';
import { useThemeStore } from '../../stores/themeStore';

interface AdminAdCardProps {
  ad: AdminAd;
}

export const AdminAdCard: React.FC<AdminAdCardProps> = ({ ad }) => {
  const { i18n } = useTranslation();
  const { colors } = useThemeStore();

  const startDate = new Date(ad.startDate).toLocaleDateString(i18n.language);
  const endDate = new Date(ad.endDate).toLocaleDateString(i18n.language);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {ad.imageUrl && (
        <Image source={{ uri: ad.imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{ad.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{ad.description}</Text>
        <View style={styles.datesRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.datesText, { color: colors.textSecondary }]}>{startDate} - {endDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'left',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
    textAlign: 'left',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datesText: {
    fontSize: 12,
    marginLeft: 6,
  },
});
