import { useLanguage } from '../context/utils/languageContextUtils';

export default function LanguageToggle() {
    const { isArabic, toggleLanguage } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
        text-sm text-gray-300 hover:bg-white/10 hover:text-white group ${isArabic ? 'flex-row-reverse text-right' : 'text-left'
                }`}
        >
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                    {isArabic ? 'A' : 'ع'}
                </span>
            </div>
            <span>{isArabic ? 'English' : 'العربية'}</span>
        </button>
    );
}
