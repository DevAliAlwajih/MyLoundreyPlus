import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import ar from './ar.json';
import en from './en.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: I18nManager.isRTL ? 'ar' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export const initI18n = async () => {
  try {
    const savedLang = await SecureStore.getItemAsync('appLanguage') ?? 'ar';
    await i18n.changeLanguage(savedLang);
    I18nManager.forceRTL(savedLang === 'ar');
  } catch (e) {
    console.warn('Failed to load language', e);
  }
};

export default i18n;
