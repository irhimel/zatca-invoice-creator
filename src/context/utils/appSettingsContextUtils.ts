import { createContext, useContext } from 'react';
export const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function useAppSettings() {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
}
// Utility types and functions for AppSettingsContext
import { AppSettings } from '../../utils/appSettings';

export interface AppSettingsContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    resetSettings: () => void;
    saveSettings: () => Promise<void>;
    loadSettings: () => Promise<void>;
    lastSaved: Date | null;
}

export interface AppSettingsProviderProps {
    children: React.ReactNode;
}
