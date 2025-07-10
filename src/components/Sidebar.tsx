import { BarChart3Icon, ClipboardListIcon, FileTextIcon, HomeIcon, LogOutIcon, MenuIcon, MessageSquareIcon, PlusCircleIcon, SettingsIcon, ShieldCheckIcon, UsersIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { useAppSettings } from '../context/utils/appSettingsContextUtils';
import { useLanguage } from '../context/utils/languageContextUtils';
import LanguageToggle from './LanguageToggle';
import { ActivePanel } from './Layout/MainLayout';

const navItems = [
    { id: 'dashboard' as ActivePanel, icon: HomeIcon, label: { en: 'Dashboard', ar: 'لوحة القيادة' } },
    { id: 'invoices' as ActivePanel, icon: FileTextIcon, label: { en: 'Invoices', ar: 'الفواتير' } },
    { id: 'create-invoice' as ActivePanel, icon: PlusCircleIcon, label: { en: 'Create E-Invoice', ar: 'إنشاء فاتورة إلكترونية' } },
    { id: 'clients' as ActivePanel, icon: UsersIcon, label: { en: 'Clients', ar: 'العملاء' } },
    { id: 'quotes' as ActivePanel, icon: MessageSquareIcon, label: { en: 'Quotes', ar: 'عروض الأسعار' } },
    { id: 'reports' as ActivePanel, icon: BarChart3Icon, label: { en: 'Reports', ar: 'التقارير' } },
    { id: 'certificates' as ActivePanel, icon: ShieldCheckIcon, label: { en: 'Certificates', ar: 'الشهادات' } },
    { id: 'audit' as ActivePanel, icon: ClipboardListIcon, label: { en: 'Audit Trail', ar: 'سجل التدقيق' } },
    { id: 'settings' as ActivePanel, icon: SettingsIcon, label: { en: 'Settings', ar: 'الإعدادات' } },
];

interface SidebarProps {
    activePanel: ActivePanel;
    setActivePanel: (panel: ActivePanel) => void;
}

export default function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
    const { isArabic } = useLanguage();
    const { settings } = useAppSettings();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={toggleMobileMenu}
                className={`fixed top-4 z-50 p-2 bg-[#1a213a] text-white rounded-md shadow-lg md:hidden transition-all duration-300 ${isArabic ? 'right-4' : 'left-4'
                    }`}
            >
                {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={toggleMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed md:static inset-y-0 z-40 w-64 
          bg-gradient-to-b from-[#0e1726] to-[#1a213a] 
          flex flex-col px-4 py-6 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isArabic ? 'right-0' : 'left-0'}
          ${isMobileMenuOpen ? 'translate-x-0' : isArabic ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isArabic ? 'md:order-last' : ''}
        `}
                dir={isArabic ? 'rtl' : 'ltr'}
            >
                {/* Logo & App Name */}
                <div className={`flex flex-col items-center mb-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <div className="relative">
                        <img src={settings.companyLogo} alt="Logo" className="w-20 h-20 object-contain drop-shadow-sm transition-transform hover:scale-105 rounded-lg" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <h1 className="text-lg font-bold mt-2 text-center text-white">
                        {isArabic ? settings.companyNameAr : settings.companyName}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-1">
                        {isArabic ? 'منشئ فواتير المعادن' : 'Metal Scrap Invoices'}
                    </p>
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map(({ id, icon: Icon, label }) => (
                        <button
                            key={id}
                            onClick={() => {
                                setActivePanel(id);
                                setIsMobileMenuOpen(false);
                            }}
                            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                text-sm font-medium group relative overflow-hidden
                ${isArabic ? 'flex-row-reverse text-right' : 'text-left'}
                ${activePanel === id
                                    ? 'bg-blue-600/20 text-blue-400 shadow-lg'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }
              `}
                        >
                            {/* Active indicator */}
                            {activePanel === id && (
                                <div
                                    className={`absolute top-0 bottom-0 w-1 bg-blue-400 transition-all duration-200 ${isArabic ? 'right-0 rounded-l-full' : 'left-0 rounded-r-full'
                                        }`}
                                />
                            )}

                            <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activePanel === id ? 'text-blue-400' : 'text-gray-400'
                                }`} />

                            <span className="transition-colors">
                                {isArabic ? label.ar : label.en}
                            </span>

                            {/* Hover effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </button>
                    ))}
                </nav>

                {/* User Section */}
                <div className="mt-auto">
                    {/* User Info */}
                    <div className={`flex items-center gap-3 p-3 mb-4 bg-white/5 rounded-lg ${isArabic ? 'flex-row-reverse' : ''
                        }`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            U
                        </div>
                        <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <p className="text-sm font-medium text-white">
                                {isArabic ? 'المستخدم' : 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {isArabic ? 'مدير' : 'Admin'}
                            </p>
                        </div>
                    </div>

                    {/* Language Toggle & Logout */}
                    <div className="border-t border-white/10 pt-4 space-y-3">
                        {/* Language Toggle */}
                        <LanguageToggle />

                        {/* Logout */}
                        <button
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 group ${isArabic ? 'flex-row-reverse text-right' : 'text-left'
                                }`}
                        >
                            <LogOutIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                            <span>{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
                        </button>

                        {/* Version & Status */}
                        <div className={`text-center pt-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>{isArabic ? 'متصل' : 'Online'}</span>
                                <span>•</span>
                                <span>v1.0.0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
