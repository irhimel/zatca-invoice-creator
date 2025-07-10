import { useAppSettings } from '../context/utils/appSettingsContextUtils';
import { useLanguage } from '../context/utils/languageContextUtils';

interface CompanyLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
}

export default function CompanyLogo({ className = '', size = 'md', showName = false }: CompanyLogoProps) {
    const { settings } = useAppSettings();
    const { isArabic } = useLanguage();

    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-12 h-12',
        lg: 'w-20 h-20'
    };

    const textSizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <img
                src={settings.companyLogo}
                alt="Company Logo"
                className={`${sizeClasses[size]} object-contain drop-shadow-sm`}
            />
            {showName && (
                <div className="flex flex-col">
                    <span className={`font-bold ${textSizeClasses[size]} text-white`}>
                        {isArabic ? settings.companyNameAr : settings.companyName}
                    </span>
                    <span className="text-xs text-gray-400">
                        {isArabic ? 'منشئ فواتير المعادن' : 'Metal Scrap Invoices'}
                    </span>
                </div>
            )}
        </div>
    );
}
