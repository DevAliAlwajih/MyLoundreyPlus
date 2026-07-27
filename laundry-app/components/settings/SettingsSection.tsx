import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../stores/themeStore';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => {
  const { colors } = useThemeStore();
  
  return (
    <View style={styles.container}>
      {title ? <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text> : null}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    marginLeft: 16,
    textAlign: 'left',
  },
  card: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
});
