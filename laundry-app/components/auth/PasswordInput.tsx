import React, { forwardRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PasswordInputProps extends TextInputProps {
  error?: string;
}

export const PasswordInput = forwardRef<TextInput, PasswordInputProps>(
  ({ error, style, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const { t } = useTranslation();

    return (
      <View style={styles.container}>
        <View style={[styles.inputContainer, error ? styles.inputError : null]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            secureTextEntry={!isPasswordVisible}
            placeholderTextColor="#888"
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
              color="#666"
            />
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
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
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
  },
  iconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'left',
  },
});
