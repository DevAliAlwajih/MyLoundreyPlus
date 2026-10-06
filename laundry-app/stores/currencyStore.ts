import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface Currency {
  code: string;
  nameAr: string;
  nameEn: string;
  symbol: string;
  flag: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'SAR', nameAr: 'ريال سعودي',    nameEn: 'Saudi Riyal',        symbol: '﷼',    flag: '🇸🇦' },
  { code: 'AED', nameAr: 'درهم إماراتي',  nameEn: 'UAE Dirham',         symbol: 'د.إ',  flag: '🇦🇪' },
  { code: 'QAR', nameAr: 'ريال قطري',     nameEn: 'Qatari Riyal',       symbol: 'ر.ق',  flag: '🇶🇦' },
  { code: 'KWD', nameAr: 'دينار كويتي',   nameEn: 'Kuwaiti Dinar',      symbol: 'د.ك',  flag: '🇰🇼' },
  { code: 'OMR', nameAr: 'ريال عُماني',   nameEn: 'Omani Rial',         symbol: 'ر.ع',  flag: '🇴🇲' },
  { code: 'BHD', nameAr: 'دينار بحريني',  nameEn: 'Bahraini Dinar',     symbol: 'د.ب',  flag: '🇧🇭' },
  { code: 'YER', nameAr: 'ريال يمني',     nameEn: 'Yemeni Rial',        symbol: 'ر.ي',  flag: '🇾🇪' },
];

const SECURE_STORE_KEY = 'appCurrency';

interface CurrencyState {
  currency: Currency;
  isInitialized: boolean;
  initCurrency: () => Promise<void>;
  setCurrency: (currency: Currency) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  currency: CURRENCIES[0], // Default: SAR
  isInitialized: false,

  initCurrency: async () => {
    try {
      const storedCode = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (storedCode) {
        const found = CURRENCIES.find((c) => c.code === storedCode);
        if (found) {
          set({ currency: found, isInitialized: true });
          return;
        }
      }
    } catch (error) {
      console.error('Failed to initialize currency', error);
    }
    set({ isInitialized: true });
  },

  setCurrency: async (currency: Currency) => {
    set({ currency });
    try {
      await SecureStore.setItemAsync(SECURE_STORE_KEY, currency.code);
    } catch (error) {
      console.error('Failed to save currency to SecureStore', error);
    }
  },
}));
