/**
 * Application settings utilities and constants
 */


export interface AppSettings {
    // Company Info
    companyLogo: string;
    companyName: string;
    companyNameAr: string;
    companyAddress: string;
    companyAddressAr: string;
    companyPhone: string;
    companyEmail: string;
    companyVatNumber: string;
    companyRegistrationNumber: string;

    // Tax/Invoice
    defaultVatRate: number;
    vatEnabled: boolean;
    withholdingTaxEnabled: boolean;
    invoicePrefix: string;
    invoiceNumberFormat: string;
    defaultDueDays: number;
    autoGenerateInvoiceNumber: boolean;

    // Localization
    defaultLanguage: 'en' | 'ar';
    dateFormat: string;
    currencySymbol: string;
    currencyPosition: 'before' | 'after';

    // Notifications
    emailNotifications: boolean;
    smsNotifications: boolean;
    zatcaNotifications: boolean;

    // Theme/UI
    theme: 'dark' | 'light';
    sidebarCollapsed: boolean;
    compactView: boolean;

    // Data/Backup
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    dataRetentionDays: number;

    // ZATCA
    zatcaEnvironment: 'sandbox' | 'production';
    zatcaAutoSubmit: boolean;
    zatcaCertificatePath: string;
    zatcaPrivateKeyPath: string;
}


export const DEFAULT_SETTINGS: AppSettings = {
    companyLogo: '',
    companyName: '',
    companyNameAr: '',
    companyAddress: '',
    companyAddressAr: '',
    companyPhone: '',
    companyEmail: '',
    companyVatNumber: '',
    companyRegistrationNumber: '',

    defaultVatRate: 15,
    vatEnabled: true,
    withholdingTaxEnabled: false,
    invoicePrefix: 'INV',
    invoiceNumberFormat: 'INV-{YYYY}-{MM}-{###}',
    defaultDueDays: 30,
    autoGenerateInvoiceNumber: true,

    defaultLanguage: 'en',
    dateFormat: 'DD/MM/YYYY',
    currencySymbol: 'ر.س',
    currencyPosition: 'after',

    emailNotifications: true,
    smsNotifications: false,
    zatcaNotifications: true,

    theme: 'dark',
    sidebarCollapsed: false,
    compactView: false,

    autoBackup: true,
    backupFrequency: 'weekly',
    dataRetentionDays: 365,

    zatcaEnvironment: 'sandbox',
    zatcaAutoSubmit: false,
    zatcaCertificatePath: '',
    zatcaPrivateKeyPath: ''
};

export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nameNative: 'English' },
    { code: 'ar', name: 'Arabic', nameNative: 'العربية' }
] as const;

export const SUPPORTED_CURRENCIES = [
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' }
] as const;

export const DATE_FORMATS = [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY'
] as const;

export const PAPER_SIZES = [
    { value: 'A4', label: 'A4 (210 × 297 mm)' },
    { value: 'Letter', label: 'Letter (8.5 × 11 in)' }
] as const;
/**
 * Validate app settings
 */
export function validateSettings(settings: Partial<AppSettings>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (settings.companyVatNumber && !/^\d{15}$/.test(settings.companyVatNumber)) {
        errors.push('VAT number must be 15 digits');
    }

    if (settings.companyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.companyEmail)) {
        errors.push('Invalid email format');
    }

    if (settings.defaultVatRate !== undefined && (settings.defaultVatRate < 0 || settings.defaultVatRate > 100)) {
        errors.push('VAT rate must be between 0 and 100');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Merge settings with defaults
 */
export function mergeWithDefaults(settings: Partial<AppSettings>): AppSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...settings
    };
}
