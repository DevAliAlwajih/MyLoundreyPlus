import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBiometricLogin } from '../../hooks/useBiometricLogin';

export default function BiometricScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const { handleBiometricAuth } = useBiometricLogin();

  useEffect(() => {
    SecureStore.getItemAsync('user').then(userStr => {
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.fullName) setUserName(user.fullName);
        } catch (e) {}
      }
    });
    
    // Auto prompt on mount
    handleBiometricAuth();
  }, []);



  const handleFallback = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="finger-print" size={80} color="#1a5fa8" />
        </View>
        <Text style={styles.welcomeText}>{t('auth.welcome')}</Text>
        {userName ? <Text style={styles.nameText}>{userName}</Text> : null}
        
        <TouchableOpacity style={styles.authButton} onPress={handleBiometricAuth}>
          <Text style={styles.authButtonText}>{t('settings.security.biometricContinue')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.fallbackButton} onPress={handleFallback}>
          <Text style={styles.fallbackButtonText}>{t('settings.security.biometricFallback')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 20,
    color: '#6c757d',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 48,
  },
  authButton: {
    backgroundColor: '#1a5fa8',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fallbackButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  fallbackButtonText: {
    color: '#1a5fa8',
    fontSize: 16,
    fontWeight: '500',
  },
});
