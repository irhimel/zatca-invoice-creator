import {
    AlertCircleIcon,
    BuildingIcon,
    CheckCircleIcon,
    CreditCardIcon,
    FileTextIcon,
    GlobeIcon,
    RefreshCwIcon,
    SaveIcon,
    SettingsIcon,
    ShieldIcon
} from 'lucide-react';
import { useState } from 'react';
import { useAppSettings } from '../context/utils/appSettingsContextUtils';
import { useLanguage } from '../context/utils/languageContextUtils';


export default function SettingsPanel() {
    const { isArabic } = useLanguage();
    const { settings, updateSettings, saveSettings, resetSettings } = useAppSettings();


    const [activeTab, setActiveTab] = useState<string>('company');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');


    const handleSave = async () => {
        setSaveStatus('idle');
        try {
            await saveSettings();
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            setSaveStatus('error');
            console.error('Failed to save settings:', error);
        }
    };


    const handleReset = () => {
        if (confirm(isArabic ? 'هل تريد إعادة تعيين الإعدادات؟' : 'Are you sure you want to reset settings?')) {
            resetSettings();
        }
    };

    const tabs = [
        { id: 'company', icon: BuildingIcon, label: { en: 'Company', ar: 'الشركة' } },
        { id: 'tax', icon: CreditCardIcon, label: { en: 'Tax & VAT', ar: 'الضرائب والقيمة المضافة' } },
        { id: 'invoice', icon: FileTextIcon, label: { en: 'Invoice', ar: 'الفاتورة' } },
        { id: 'localization', icon: GlobeIcon, label: { en: 'Localization', ar: 'التوطين' } },
        { id: 'zatca', icon: ShieldIcon, label: { en: 'ZATCA', ar: 'هيئة الزكاة والضريبة' } },
    ];

    const renderCompanySettings = () => (
        <div className="space-y-6">
            {/* Logo Upload */}
            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    {isArabic ? 'شعار الشركة' : 'Company Logo'}
                </label>
                <div className="flex items-center space-x-4">
                    <img
                        src={settings.companyLogo}
                        alt="Company Logo"
                        className="w-16 h-16 object-contain rounded-lg border border-gray-600"
                    />
                    <input
                        type="text"
                        value={settings.companyLogo}
                        onChange={(e) => updateSettings({ companyLogo: e.target.value })}
                        className="flex-1 p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder={isArabic ? 'مسار الشعار' : 'Logo path'}
                    />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                    {isArabic ? 'يمكنك استخدام مسار محلي أو رابط' : 'You can use a local path or URL'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'اسم الشركة (إنجليزي)' : 'Company Name (English)'}
                    </label>
                    <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => updateSettings({ companyName: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'اسم الشركة (عربي)' : 'Company Name (Arabic)'}
                    </label>
                    <input
                        type="text"
                        value={settings.companyNameAr}
                        onChange={(e) => updateSettings({ companyNameAr: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                        dir="rtl"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'رقم الضريبة' : 'VAT Number'}
                    </label>
                    <input
                        type="text"
                        value={settings.companyVatNumber}
                        onChange={(e) => updateSettings({ companyVatNumber: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'رقم التسجيل التجاري' : 'Registration Number'}
                    </label>
                    <input
                        type="text"
                        value={settings.companyRegistrationNumber}
                        onChange={(e) => updateSettings({ companyRegistrationNumber: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );

    const renderTaxSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'معدل الضريبة الافتراضي' : 'Default VAT Rate'}
                    </label>
                    <select
                        value={settings.defaultVatRate}
                        onChange={(e) => updateSettings({ defaultVatRate: parseFloat(e.target.value) })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                        <option value={0}>0%</option>
                        <option value={0.05}>5%</option>
                        <option value={0.15}>15%</option>
                        <option value={0.20}>20%</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'تفعيل الضريبة' : 'Enable VAT'}
                    </label>
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            checked={settings.vatEnabled}
                            onChange={(e) => updateSettings({ vatEnabled: e.target.checked })}
                            className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">
                            {isArabic ? 'تفعيل ضريبة القيمة المضافة' : 'Enable Value Added Tax'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInvoiceSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'بادئة الفاتورة' : 'Invoice Prefix'}
                    </label>
                    <input
                        type="text"
                        value={settings.invoicePrefix}
                        onChange={(e) => updateSettings({ invoicePrefix: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'أيام الاستحقاق الافتراضية' : 'Default Due Days'}
                    </label>
                    <input
                        type="number"
                        value={settings.defaultDueDays}
                        onChange={(e) => updateSettings({ defaultDueDays: parseInt(e.target.value) })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );

    const renderLocalizationSettings = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'رمز العملة' : 'Currency Symbol'}
                    </label>
                    <input
                        type="text"
                        value={settings.currencySymbol}
                        onChange={(e) => updateSettings({ currencySymbol: e.target.value })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'موضع العملة' : 'Currency Position'}
                    </label>
                    <select
                        value={settings.currencyPosition}
                        onChange={(e) => updateSettings({ currencyPosition: e.target.value as 'before' | 'after' })}
                        className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                        <option value="before">{isArabic ? 'قبل المبلغ' : 'Before Amount'}</option>
                        <option value="after">{isArabic ? 'بعد المبلغ' : 'After Amount'}</option>
                    </select>
                </div>
            </div>
        </div>
    );

    const renderZATCASettings = () => (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium mb-2">
                    {isArabic ? 'بيئة هيئة الزكاة والضريبة' : 'ZATCA Environment'}
                </label>
                <select
                    value={settings.zatcaEnvironment}
                    onChange={(e) => updateSettings({ zatcaEnvironment: e.target.value as 'sandbox' | 'production' })}
                    className="w-full p-3 bg-[#0e1726] border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                    <option value="sandbox">{isArabic ? 'بيئة الاختبار' : 'Sandbox'}</option>
                    <option value="production">{isArabic ? 'بيئة الإنتاج' : 'Production'}</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2">
                    {isArabic ? 'الإرسال التلقائي' : 'Auto Submit'}
                </label>
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        checked={settings.zatcaAutoSubmit}
                        onChange={(e) => updateSettings({ zatcaAutoSubmit: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">
                        {isArabic ? 'إرسال الفواتير تلقائياً إلى هيئة الزكاة والضريبة' : 'Auto submit invoices to ZATCA'}
                    </span>
                </div>
            </div>
        </div>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'company':
                return renderCompanySettings();
            case 'tax':
                return renderTaxSettings();
            case 'invoice':
                return renderInvoiceSettings();
            case 'localization':
                return renderLocalizationSettings();
            case 'zatca':
                return renderZATCASettings();
            default:
                return renderCompanySettings();
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6" dir={isArabic ? 'rtl' : 'ltr'}>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <SettingsIcon className="w-8 h-8 text-blue-500" />
                    {isArabic ? 'إعدادات التطبيق' : 'App Settings'}
                </h1>
                <p className="text-gray-400">
                    {isArabic ? 'إدارة إعدادات التطبيق والتكوين' : 'Manage app settings and configuration'}
                </p>
            </div>

            {/* Settings Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-600 pb-4">
                {tabs.map(({ id, icon: Icon, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {isArabic ? label.ar : label.en}
                    </button>
                ))}
            </div>

            {/* Settings Content */}
            <div className="bg-[#1a213a] rounded-lg p-6 mb-6">
                {renderActiveTab()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        // No isLoading state, always enabled
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white`}
                    >
                        <SaveIcon className="w-5 h-5" />
                        {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}
                    </button>

                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                        <RefreshCwIcon className="w-5 h-5" />
                        {isArabic ? 'إعادة تعيين' : 'Reset'}
                    </button>
                </div>

                {/* Save Status */}
                {saveStatus !== 'idle' && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${saveStatus === 'success' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                        }`}>
                        {saveStatus === 'success' ? (
                            <CheckCircleIcon className="w-5 h-5" />
                        ) : (
                            <AlertCircleIcon className="w-5 h-5" />
                        )}
                        <span>
                            {saveStatus === 'success'
                                ? (isArabic ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully')
                                : (isArabic ? 'فشل في حفظ الإعدادات' : 'Failed to save settings')
                            }
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
