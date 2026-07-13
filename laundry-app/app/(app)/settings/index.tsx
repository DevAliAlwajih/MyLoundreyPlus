import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useLaundryStore } from '../../../stores/laundryStore';
import { useUpdateNotificationPrefs } from '../../../hooks/useSettings';
import { SettingsSection } from '../../../components/settings/SettingsSection';
import { SettingsRow } from '../../../components/settings/SettingsRow';
import { SubscriptionCard } from '../../../components/settings/SubscriptionCard';
import { ChangePasswordModal } from '../../../components/settings/ChangePasswordModal';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const { 
    notificationPrefs, 
    subscription, 
    fetchNotificationPrefs, 
    fetchSubscription 
  } = useLaundryStore();
  
  const updatePrefsMutation = useUpdateNotificationPrefs();

  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    fetchNotificationPrefs();
    fetchSubscription();
    
    // Load theme preference
    SecureStore.getItemAsync('appTheme').then(theme => {
      if (theme === 'dark') setIsDarkMode(true);
    });
  }, []);

  const handleLanguageToggle = async (val: boolean) => {
    // val true = AR, false = EN
    const newLang = val ? 'ar' : 'en';
    const isRTL = newLang === 'ar';
    
    Alert.alert(
      t('settings.changeLanguageTitle'),
      t('settings.changeLanguageMessage'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => {} },
        { text: t('common.ok'), onPress: async () => {
            await i18n.changeLanguage(newLang);
            I18nManager.forceRTL(isRTL);
            await SecureStore.setItemAsync('appLanguage', newLang);
            // Reload app to apply RTL
            try {
              const { reloadAsync } = await import('expo-updates');
              await reloadAsync();
            } catch (e) {
              // Fallback for expo go
              Alert.alert(t('settings.changeLanguageTitle'), t('settings.restartRequired'));
            }
        }}
      ]
    );
  };

  const handleThemeToggle = async (val: boolean) => {
    setIsDarkMode(val);
    await SecureStore.setItemAsync('appTheme', val ? 'dark' : 'light');
    // Note: Full dark mode UI implementation is pending for future phase
  };

  const handlePrefToggle = (key: keyof typeof notificationPrefs) => (val: boolean) => {
    if (!notificationPrefs) return;
    const newPrefs = { ...notificationPrefs, [key]: val };
    updatePrefsMutation.mutate(newPrefs);
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout'),
      t('settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.logoutButton'), style: 'destructive', onPress: () => logout() }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <SettingsSection title={t('settings.business')}>
          <SettingsRow 
            icon="business-outline" 
            title={t('settings.profile')} 
            onPress={() => router.push('/(app)/profile')} 
          />
          <SettingsRow 
            icon="time-outline" 
            title={t('settings.workingHours')} 
            onPress={() => router.push('/(app)/profile/working-hours')} 
          />
          <SettingsRow 
            icon="list-outline" 
            title={t('settings.pricingList')} 
            onPress={() => router.push('/(app)/invoices/items')} 
          />
          <SettingsRow 
            icon="bar-chart-outline" 
            title={t('settings.reports')} 
            onPress={() => router.push('/(app)/reports')} 
          />
          <SettingsRow 
            icon="megaphone-outline" 
            title={t('settings.promotions')} 
            onPress={() => router.push('/(app)/promotions')} 
            isLast
          />
        </SettingsSection>
        
        <SettingsSection title={t('settings.account')}>
          <SettingsRow 
            icon="key-outline" 
            title={t('settings.changePassword')} 
            onPress={() => setPasswordModalVisible(true)} 
          />
          <SettingsRow 
            icon="phone-portrait-outline" 
            title={t('settings.devices')} 
            onPress={() => Alert.alert(t('common.comingSoon'), t('settings.devices'))} 
            isLast
          />
        </SettingsSection>

        {subscription && (
          <SettingsSection title={t('settings.subscription')}>
            <SubscriptionCard subscription={subscription} />
          </SettingsSection>
        )}

        <SettingsSection title={t('settings.appPreferences')}>
          <SettingsRow 
            icon="language-outline" 
            title={t('settings.language')} 
            value={i18n.language === 'ar' ? 'العربية' : 'English'}
            isSwitch
            switchValue={i18n.language === 'ar'}
            onSwitchChange={handleLanguageToggle}
          />
          <SettingsRow 
            icon="moon-outline" 
            title={t('settings.theme')} 
            value={isDarkMode ? t('settings.dark') : t('settings.light')}
            isSwitch
            switchValue={isDarkMode}
            onSwitchChange={handleThemeToggle}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.notifications')}>
          <SettingsRow 
            icon="calendar-outline" 
            title={t('settings.newBooking')} 
            isSwitch
            switchValue={notificationPrefs?.newBooking ?? true}
            onSwitchChange={handlePrefToggle('newBooking')}
          />
          <SettingsRow 
            icon="document-text-outline" 
            title={t('settings.invoiceStatus')} 
            isSwitch
            switchValue={notificationPrefs?.invoiceStatus ?? true}
            onSwitchChange={handlePrefToggle('invoiceStatus')}
          />
          <SettingsRow 
            icon="cash-outline" 
            title={t('settings.paymentReceived')} 
            isSwitch
            switchValue={notificationPrefs?.paymentReceived ?? true}
            onSwitchChange={handlePrefToggle('paymentReceived')}
          />
          <SettingsRow 
            icon="alert-circle-outline" 
            title={t('settings.systemAlerts')} 
            isSwitch
            switchValue={notificationPrefs?.systemAlerts ?? true}
            onSwitchChange={handlePrefToggle('systemAlerts')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.support')}>
          <SettingsRow 
            icon="headset-outline" 
            title={t('settings.contactSupport')} 
            onPress={() => Linking.openURL('mailto:support@myloundreyplus.com')} 
          />
          <SettingsRow 
            icon="document-lock-outline" 
            title={t('settings.terms')} 
            onPress={() => Linking.openURL('https://myloundreyplus.com/terms')} 
          />
          <SettingsRow 
            icon="shield-checkmark-outline" 
            title={t('settings.privacy')} 
            onPress={() => Linking.openURL('https://myloundreyplus.com/privacy')} 
          />
          <SettingsRow 
            icon="star-outline" 
            title={t('settings.rateApp')} 
            onPress={() => Linking.openURL('https://myloundreyplus.com/rate')} 
            isLast
          />
        </SettingsSection>

        <SettingsSection title="">
          <SettingsRow 
            icon="log-out-outline" 
            title={t('settings.logout')} 
            onPress={handleLogout} 
            isDestructive
            isLast
          />
        </SettingsSection>

      </ScrollView>

      <ChangePasswordModal 
        visible={isPasswordModalVisible} 
        onClose={() => setPasswordModalVisible(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingVertical: 20,
  },
});
