import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
const COLORS = {
  primary: '#1a5fa8',
  bg: '#f8f9fa',
  text: '#333',
  googleBg: '#fff',
  googleText: '#444'
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    const isRTL = newLang === 'ar';
    
    // In a real app, save to Async/SecureStorage
    await i18n.changeLanguage(newLang);
    
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      Alert.alert('تنبيه', 'يرجى إغلاق التطبيق وإعادة فتحه لتطبيق تغيير اللغة بالكامل.');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      t('common.comingSoon'),
      'تسجيل الدخول عبر Google سيكون متاحاً في الإصدار القادم.',
      [{ text: 'حسناً', style: 'cancel' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Language Toggle */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.langButton} onPress={toggleLanguage}>
          <Ionicons name="globe-outline" size={20} color={COLORS.primary} />
          <Text style={styles.langText}>{i18n.language === 'ar' ? 'English' : 'العربية'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.png')} 
            style={{ width: 120, height: 120, marginBottom: 10 }} 
            resizeMode="contain" 
          />
          <Text style={styles.title}>MyLoundreyPlus</Text>
          <Text style={styles.subtitle}>{t('auth.welcome')}</Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.primaryButtonText}>{t('auth.createAccount')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t('common.or')}</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.googleButton]} 
            onPress={handleGoogleLogin}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>{t('auth.loginWithGoogle')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e6f0fa',
  },
  langText: {
    marginLeft: 6,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: COLORS.googleBg,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: COLORS.googleText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    paddingHorizontal: 10,
    color: '#888',
  },
});
