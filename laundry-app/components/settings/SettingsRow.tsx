import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  isDestructive?: boolean;
  isLast?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  title,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  isDestructive,
  isLast,
}) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  const content = (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      <View style={[styles.iconContainer, isDestructive && styles.destructiveIcon]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#e74c3c' : '#555'} />
      </View>
      
      <Text style={[styles.title, isDestructive && styles.destructiveText]}>{title}</Text>
      
      {value && <Text style={styles.value}>{value}</Text>}
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={switchValue ? '#1a5fa8' : '#f4f3f4'}
        />
      ) : (
        !isDestructive && <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color="#ccc" />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#ffeaea',
  },
  title: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  destructiveText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 15,
    color: '#888',
    marginRight: 8,
  },
});
