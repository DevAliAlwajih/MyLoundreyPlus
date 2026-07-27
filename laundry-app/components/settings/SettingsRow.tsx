import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';

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
  const { colors, themeMode } = useThemeStore();

  const content = (
    <View style={[styles.container, { backgroundColor: colors.surface }, !isLast && [styles.borderBottom, { borderBottomColor: colors.border }]]}>
      <View style={[styles.iconContainer, { backgroundColor: isDestructive ? colors.error + '15' : colors.surface2 }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? colors.error : colors.textSecondary} />
      </View>
      
      <Text style={[styles.title, { color: isDestructive ? colors.error : colors.text }]}>{title}</Text>
      
      {value && <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text>}
      
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.border, true: colors.primary + '80' }}
          thumbColor={switchValue ? colors.primary : colors.surface2}
        />
      ) : (
        !isDestructive && <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textMuted} />
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
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    textAlign: 'left',
  },
  destructiveText: {
    fontWeight: 'bold',
  },
  value: {
    fontSize: 15,
    marginRight: 8,
  },
});
