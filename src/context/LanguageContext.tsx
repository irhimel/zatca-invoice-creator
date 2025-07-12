import { useState } from 'react';
import { DEFAULT_LANGUAGE, isRTL, LANGUAGES } from '../utils/language';
import { LanguageContext, type LanguageContextType, type LanguageProviderProps } from './utils/languageContextUtils';

export function LanguageProvider({ children }: LanguageProviderProps) {
    const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE);

    const isArabic = currentLanguage === 'ar';
    const direction = isRTL(currentLanguage) ? 'rtl' : 'ltr';

    const toggleLanguage = () => {
        setCurrentLanguage(prev => prev === 'en' ? 'ar' : 'en');
    };

    const setLanguage = (language: string) => {
        const validLanguage = LANGUAGES.find(lang => lang.code === language);
        if (validLanguage) {
            setCurrentLanguage(language);
        }
    };

    const value: LanguageContextType = {
        currentLanguage,
        isArabic,
        toggleLanguage,
        setLanguage,
        direction,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
