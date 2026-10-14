/**
 * قائمة العملات والدول الـ 7 المعتمدة للنظام (المملكة العربية السعودية، الإمارات، قطر، الكويت، عُمان، البحرين، اليمن)
 * الترتيب مطابق لواجهة اختيار العملات المعتمدة في النظام.
 */

export const SUPPORTED_CURRENCIES = [
  {
    code: 'SAR',
    country: 'SA',
    flag: '🇸🇦',
    nameAr: 'ريال سعودي',
    nameEn: 'Saudi Riyal',
    symbolAr: 'ر.س',
    symbolEn: 'SAR',
    subtitleAr: 'ر.س · SAR · SAR',
    rateFromSAR: 1.0,
    quickAmounts: [100, 250, 500, 1000, 2500],
  },
  {
    code: 'AED',
    country: 'AE',
    flag: '🇦🇪',
    nameAr: 'درهم إماراتي',
    nameEn: 'UAE Dirham',
    symbolAr: 'د.إ',
    symbolEn: 'AED',
    subtitleAr: 'د.إ · AED · AED',
    rateFromSAR: 0.98,
    quickAmounts: [100, 250, 500, 1000, 2500],
  },
  {
    code: 'QAR',
    country: 'QA',
    flag: '🇶🇦',
    nameAr: 'ريال قطري',
    nameEn: 'Qatari Riyal',
    symbolAr: 'ر.ق',
    symbolEn: 'QAR',
    subtitleAr: 'ر.ق · QAR · QAR',
    rateFromSAR: 0.97,
    quickAmounts: [100, 250, 500, 1000, 2500],
  },
  {
    code: 'KWD',
    country: 'KW',
    flag: '🇰🇼',
    nameAr: 'دينار كويتي',
    nameEn: 'Kuwaiti Dinar',
    symbolAr: 'د.ك',
    symbolEn: 'KWD',
    subtitleAr: 'د.ك · KWD · KWD',
    rateFromSAR: 0.082,
    quickAmounts: [10, 25, 50, 100, 250],
  },
  {
    code: 'OMR',
    country: 'OM',
    flag: '🇴🇲',
    nameAr: 'ريال عُماني',
    nameEn: 'Omani Rial',
    symbolAr: 'ر.ع',
    symbolEn: 'OMR',
    subtitleAr: 'ر.ع · OMR · OMR',
    rateFromSAR: 0.103,
    quickAmounts: [10, 25, 50, 100, 250],
  },
  {
    code: 'BHD',
    country: 'BH',
    flag: '🇧🇭',
    nameAr: 'دينار بحريني',
    nameEn: 'Bahraini Dinar',
    symbolAr: 'د.ب',
    symbolEn: 'BHD',
    subtitleAr: 'د.ب · BHD · BHD',
    rateFromSAR: 0.100,
    quickAmounts: [10, 25, 50, 100, 250],
  },
  {
    code: 'YER',
    country: 'YE',
    flag: '🇾🇪',
    nameAr: 'ريال يمني',
    nameEn: 'Yemeni Rial',
    symbolAr: 'ر.ي',
    symbolEn: 'YER',
    subtitleAr: 'ر.ي · YER · YER',
    rateFromSAR: 430.0,
    quickAmounts: [5000, 10000, 25000, 50000, 100000],
  },
  {
    code: 'USD',
    country: 'US',
    flag: '🇺🇸',
    nameAr: 'دولار أمريكي',
    nameEn: 'US Dollar',
    symbolAr: '$',
    symbolEn: '$',
    subtitleAr: '$ · USD · USD',
    rateFromSAR: 0.2667,
    quickAmounts: [25, 50, 100, 250, 500],
  },
  {
    code: 'EUR',
    country: 'EU',
    flag: '🇪🇺',
    nameAr: 'يورو أوروبي',
    nameEn: 'Euro',
    symbolAr: '€',
    symbolEn: '€',
    subtitleAr: '€ · EUR · EUR',
    rateFromSAR: 0.245,
    quickAmounts: [25, 50, 100, 250, 500],
  },
]

export const COUNTRY_OPTIONS = [
  { code: 'SA', nameAr: 'المملكة العربية السعودية', nameEn: 'Saudi Arabia', flag: '🇸🇦', defaultCurrency: 'SAR' },
  { code: 'AE', nameAr: 'الإمارات العربية المتحدة', nameEn: 'UAE', flag: '🇦🇪', defaultCurrency: 'AED' },
  { code: 'QA', nameAr: 'قطر', nameEn: 'Qatar', flag: '🇶🇦', defaultCurrency: 'QAR' },
  { code: 'KW', nameAr: 'الكويت', nameEn: 'Kuwait', flag: '🇰🇼', defaultCurrency: 'KWD' },
  { code: 'OM', nameAr: 'سلطنة عُمان', nameEn: 'Oman', flag: '🇴🇲', defaultCurrency: 'OMR' },
  { code: 'BH', nameAr: 'البحرين', nameEn: 'Bahrain', flag: '🇧🇭', defaultCurrency: 'BHD' },
  { code: 'YE', nameAr: 'اليمن', nameEn: 'Yemen', flag: '🇾🇪', defaultCurrency: 'YER' },
]

export const COUNTRY_TO_CURRENCY = {
  SA: 'SAR',
  AE: 'AED',
  QA: 'QAR',
  KW: 'KWD',
  OM: 'OMR',
  BH: 'BHD',
  YE: 'YER',
}

export const getCurrencyMeta = (currencyCode) => {
  const code = (currencyCode || 'SAR').toUpperCase()
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) || SUPPORTED_CURRENCIES[0]
}

export const formatCurrencySymbol = (currencyCode, lang = 'ar') => {
  const meta = getCurrencyMeta(currencyCode)
  return lang === 'ar' ? meta.symbolAr : meta.symbolEn
}

/**
 * تحويل المبالغ المالية بين العملات استناداً للريال السعودي (SAR) كأساس
 */
export const convertCurrency = (amount, fromCode = 'SAR', toCode = 'SAR') => {
  const num = parseFloat(amount) || 0
  if (!fromCode || !toCode || fromCode.toUpperCase() === toCode.toUpperCase()) {
    return num
  }
  const fromMeta = getCurrencyMeta(fromCode)
  const toMeta = getCurrencyMeta(toCode)
  
  // Convert from source to SAR first, then from SAR to target
  const inSAR = num / (fromMeta.rateFromSAR || 1.0)
  return inSAR * (toMeta.rateFromSAR || 1.0)
}

/**
 * تنسيق المبالغ المالية بالشكل المناسب لكل عملة
 */
export const formatAmount = (amount, currencyCode = 'SAR', lang = 'ar') => {
  const meta = getCurrencyMeta(currencyCode)
  const val = Number(amount) || 0
  const symbol = lang === 'ar' ? meta.symbolAr : meta.symbolEn

  let formattedNumber
  if (meta.code === 'YER') {
    formattedNumber = Math.round(val).toLocaleString('en-US')
  } else if (['KWD', 'OMR', 'BHD'].includes(meta.code)) {
    formattedNumber = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } else {
    formattedNumber = val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  return lang === 'ar' ? `${formattedNumber} ${symbol}` : `${symbol} ${formattedNumber}`
}
