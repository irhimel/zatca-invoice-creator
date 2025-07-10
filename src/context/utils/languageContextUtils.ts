import React, { createContext, useContext } from 'react';

export interface LanguageContextType {
    currentLanguage: string;
    isArabic: boolean;
    toggleLanguage: () => void;
    setLanguage: (language: string) => void;
    direction: 'rtl' | 'ltr';
}

export interface LanguageProviderProps {
    children: React.ReactNode;
}

// Context object
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hook
export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
