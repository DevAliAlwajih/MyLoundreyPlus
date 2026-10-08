/**
 * خريطة الدول → العملات الافتراضية
 * Country → Default Currency Mapping
 * 
 * يدعم كود ISO (SA, YE, AE...) وأكواد الاتصال (+966, +967, 966...)
 */

export interface CurrencyMetadata {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  flag: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMetadata> = {
  SAR: { code: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', symbolAr: 'ر.س', symbolEn: 'SAR', flag: '🇸🇦', decimals: 2 },
  YER: { code: 'YER', nameAr: 'ريال يمني', nameEn: 'Yemeni Rial', symbolAr: 'ر.ي', symbolEn: 'YER', flag: '🇾🇪', decimals: 2 },
  AED: { code: 'AED', nameAr: 'درهم إماراتي', nameEn: 'UAE Dirham', symbolAr: 'د.إ', symbolEn: 'AED', flag: '🇦🇪', decimals: 2 },
  QAR: { code: 'QAR', nameAr: 'ريال قطري', nameEn: 'Qatari Riyal', symbolAr: 'ر.ق', symbolEn: 'QAR', flag: '🇶🇦', decimals: 2 },
  KWD: { code: 'KWD', nameAr: 'دينار كويتي', nameEn: 'Kuwaiti Dinar', symbolAr: 'د.ك', symbolEn: 'KWD', flag: '🇰🇼', decimals: 3 },
  OMR: { code: 'OMR', nameAr: 'ريال عُماني', nameEn: 'Omani Rial', symbolAr: 'ر.ع', symbolEn: 'OMR', flag: '🇴🇲', decimals: 3 },
  BHD: { code: 'BHD', nameAr: 'دينار بحريني', nameEn: 'Bahraini Dinar', symbolAr: 'د.ب', symbolEn: 'BHD', flag: '🇧🇭', decimals: 3 },
  EGP: { code: 'EGP', nameAr: 'جنيه مصري', nameEn: 'Egyptian Pound', symbolAr: 'ج.م', symbolEn: 'EGP', flag: '🇪🇬', decimals: 2 },
  JOD: { code: 'JOD', nameAr: 'دينار أردني', nameEn: 'Jordanian Dinar', symbolAr: 'د.أ', symbolEn: 'JOD', flag: '🇯🇴', decimals: 3 },
  USD: { code: 'USD', nameAr: 'دولار أمريكي', nameEn: 'US Dollar', symbolAr: '$', symbolEn: 'USD', flag: '🇺🇸', decimals: 2 },
  EUR: { code: 'EUR', nameAr: 'يورو', nameEn: 'Euro', symbolAr: '€', symbolEn: 'EUR', flag: '🇪🇺', decimals: 2 },
  GBP: { code: 'GBP', nameAr: 'جنيه إسترليني', nameEn: 'British Pound', symbolAr: '£', symbolEn: 'GBP', flag: '🇬🇧', decimals: 2 },
};

// خريطة كود الدولة ISO → رمز العملة
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // الخليج العربي
  SA: 'SAR',
  AE: 'AED',
  QA: 'QAR',
  KW: 'KWD',
  OM: 'OMR',
  BH: 'BHD',
  // اليمن
  YE: 'YER',
  // دول عربية أخرى
  EG: 'EGP',
  MA: 'MAD',
  TN: 'TND',
  LY: 'LYD',
  DZ: 'DZD',
  SD: 'SDG',
  JO: 'JOD',
  IQ: 'IQD',
  SY: 'SYP',
  LB: 'LBP',
  PS: 'ILS',
  // دول أخرى
  TR: 'TRY',
  PK: 'PKR',
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
};

// خريطة كود الاتصال الهاتفي → كود الدولة ISO والعملة
export const DIAL_CODE_MAP: Record<string, { country: string; currency: string }> = {
  '+966': { country: 'SA', currency: 'SAR' },
  '966':  { country: 'SA', currency: 'SAR' },
  '+967': { country: 'YE', currency: 'YER' },
  '967':  { country: 'YE', currency: 'YER' },
  '+971': { country: 'AE', currency: 'AED' },
  '971':  { country: 'AE', currency: 'AED' },
  '+974': { country: 'QA', currency: 'QAR' },
  '974':  { country: 'QA', currency: 'QAR' },
  '+965': { country: 'KW', currency: 'KWD' },
  '965':  { country: 'KW', currency: 'KWD' },
  '+968': { country: 'OM', currency: 'OMR' },
  '968':  { country: 'OM', currency: 'OMR' },
  '+973': { country: 'BH', currency: 'BHD' },
  '973':  { country: 'BH', currency: 'BHD' },
  '+20':  { country: 'EG', currency: 'EGP' },
  '20':   { country: 'EG', currency: 'EGP' },
  '+962': { country: 'JO', currency: 'JOD' },
  '962':  { country: 'JO', currency: 'JOD' },
  '+1':   { country: 'US', currency: 'USD' },
  '1':    { country: 'US', currency: 'USD' },
};

/**
 * الحصول على كود الدولة ISO الموحد (مثلاً YE أو SA) من كود اتصال أو كود ISO
 */
export function getCountryIsoCode(input?: string | null): string {
  if (!input) return 'SA';
  const clean = input.trim();
  if (DIAL_CODE_MAP[clean]) {
    return DIAL_CODE_MAP[clean].country;
  }
  const upper = clean.toUpperCase();
  if (COUNTRY_CURRENCY_MAP[upper]) {
    return upper;
  }
  return 'SA';
}

/**
 * الحصول على رمز العملة الافتراضي بناءً على كود الدولة أو كود الاتصال
 * @param input كود الدولة (SA, YE...) أو كود الاتصال (+966, +967...)
 * @returns رمز العملة (SAR, YER, AED...) أو SAR كـ fallback
 */
export function getCurrencyByCountry(input?: string | null): string {
  if (!input) return 'SAR';
  const clean = input.trim();
  if (DIAL_CODE_MAP[clean]) {
    return DIAL_CODE_MAP[clean].currency;
  }
  const upper = clean.toUpperCase();
  if (COUNTRY_CURRENCY_MAP[upper]) {
    return COUNTRY_CURRENCY_MAP[upper];
  }
  return 'SAR';
}
