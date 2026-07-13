import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AdminAd } from '../../hooks/usePromotions';

interface AdminAdCardProps {
  ad: AdminAd;
}

export const AdminAdCard: React.FC<AdminAdCardProps> = ({ ad }) => {
  const { i18n } = useTranslation();

  const startDate = new Date(ad.startDate).toLocaleDateString(i18n.language);
  const endDate = new Date(ad.endDate).toLocaleDateString(i18n.language);

  return (
    <View style={styles.card}>
      {ad.imageUrl && (
        <Image source={{ uri: ad.imageUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{ad.title}</Text>
        <Text style={styles.description}>{ad.description}</Text>
        <View style={styles.datesRow}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.datesText}>{startDate} - {endDate}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
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
    color: '#333',
    marginBottom: 6,
    textAlign: 'left',
  },
  description: {
    fontSize: 14,
    color: '#666',
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
    color: '#888',
    marginLeft: 6,
  },
});
