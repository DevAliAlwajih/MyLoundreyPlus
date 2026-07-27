import React, { forwardRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../stores/themeStore';

interface PasswordInputProps extends TextInputProps {
  error?: string;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ error, style, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { t } = useTranslation();
    const { colors } = useThemeStore();

    return (
      <View style={styles.container}>
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }, error ? { borderColor: colors.error } : null]}>
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            {...props}
          />
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      </View>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'right',
  },
  iconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
});
