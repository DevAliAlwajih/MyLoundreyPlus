import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface KPICardProps {
  title: string;
  value: string | number;
  bgType?: 'primary' | 'danger' | 'neutral';
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, bgType = 'neutral' }) => {
  const { colors: themeColors, themeMode } = useThemeStore();

  const getColors = () => {
    switch (bgType) {
      case 'primary': return { bg: themeColors.primary, text: '#fff', label: '#e0f0ff' };
      case 'danger': return { bg: '#e74c3c', text: '#fff', label: '#ffeaea' };
      default: return { bg: themeColors.surface, text: themeColors.text, label: themeColors.textSecondary }; // neutral
    }
  };

  const cardColors = getColors();

  return (
    <View style={[styles.card, { backgroundColor: cardColors.bg }, bgType === 'neutral' && { borderWidth: 1, borderColor: themeColors.border }]}>
      <Text style={[styles.title, { color: cardColors.label }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={[styles.value, { color: cardColors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 90,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
