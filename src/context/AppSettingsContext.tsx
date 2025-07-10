import { useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, mergeWithDefaults } from '../utils/appSettings';
import { AppSettingsContext, AppSettingsProviderProps } from './utils/appSettingsContextUtils';

// Only export provider and hook
export function AppSettingsProvider({ children }: AppSettingsProviderProps) {
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings((prev: AppSettings) => mergeWithDefaults({ ...prev, ...newSettings }));
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
    };

    const saveSettings = async () => {
        try {
            localStorage.setItem('app-settings', JSON.stringify(settings));
            setLastSaved(new Date());
        } catch (error) {
            console.error('Failed to save settings:', error);
            throw error;
        }
    };

    const loadSettings = async () => {
        try {
            const savedSettings = localStorage.getItem('app-settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                setSettings(mergeWithDefaults(parsed));
                setLastSaved(new Date());
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Don't throw here, just use defaults
        }
    };

    return (
        <AppSettingsContext.Provider value={{
            settings,
            updateSettings,
            resetSettings,
            saveSettings,
            loadSettings,
            lastSaved,
        }}>
            {children}
        </AppSettingsContext.Provider>
    );
}

