export interface CurrencyMetadata {
    code: string;
    nameAr: string;
    nameEn: string;
    symbolAr: string;
    symbolEn: string;
    flag: string;
    decimals: number;
}
export declare const SUPPORTED_CURRENCIES: Record<string, CurrencyMetadata>;
export declare const COUNTRY_CURRENCY_MAP: Record<string, string>;
export declare const DIAL_CODE_MAP: Record<string, {
    country: string;
    currency: string;
}>;
export declare function getCountryIsoCode(input?: string | null): string;
export declare function getCurrencyByCountry(input?: string | null): string;
