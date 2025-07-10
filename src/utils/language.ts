/**
 * Language utilities and constants
 */

export interface Language {
    code: string;
    name: string;
    dir: 'ltr' | 'rtl';
    flag: string;
}

export const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', dir: 'ltr', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', dir: 'rtl', flag: '🇸🇦' }
];

export const DEFAULT_LANGUAGE = 'en';

/**
 * Get language by code
 */
export function getLanguageByCode(code: string): Language | undefined {
    return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Check if language is RTL
 */
export function isRTL(languageCode: string): boolean {
    const language = getLanguageByCode(languageCode);
    return language?.dir === 'rtl';
}

/**
 * Get supported language codes
 */
export function getSupportedLanguageCodes(): string[] {
    return LANGUAGES.map(lang => lang.code);
}

/**
 * Validate language code
 */
export function isValidLanguageCode(code: string): boolean {
    return getSupportedLanguageCodes().includes(code);
}

/**
 * Get browser language preference
 */
export function getBrowserLanguage(): string {
    const browserLang = navigator.language.split('-')[0];
    return isValidLanguageCode(browserLang) ? browserLang : DEFAULT_LANGUAGE;
}

/**
 * Translation key type for type safety
 */
export type TranslationKey = string;

/**
 * Translation function type
 */
export type TranslationFunction = (key: TranslationKey, params?: Record<string, string | number>) => string;
