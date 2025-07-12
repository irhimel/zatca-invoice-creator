// src/components/MainLayout.tsx
import { useState } from 'react';
import { useLanguage } from '../context/utils/languageContextUtils';
import AuditTrailPanel from '../panels/AuditTrailPanel';
import CertificateManagerPanel from '../panels/CertificateManagerPanel';
import DashboardPanel from '../panels/DashboardPanel';
import InvoicesPanel from '../panels/InvoicesPanel';
import ReportDashboardPanel from '../panels/ReportDashboardPanel';
import type { ActivePanel } from './Layout/MainLayout';
import Sidebar from './Sidebar';

export default function MainLayout() {
    const { isArabic } = useLanguage();
    const [activePanel, setActivePanel] = useState<ActivePanel>('dashboard');

    // Panel rendering function
    const renderActivePanel = () => {
        switch (activePanel) {
            case 'dashboard':
                return <DashboardPanel />;
            case 'invoices':
                return <InvoicesPanel />;
            case 'reports':
                return <ReportDashboardPanel />;
            case 'certificates':
                return <CertificateManagerPanel />;
            case 'audit':
                return <AuditTrailPanel />;
            case 'settings':
                return <div>Settings Panel (Coming Soon)</div>;
            default:
                return <DashboardPanel />;
        }
    };

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="flex h-screen bg-[#0e1726] text-white"
        >
            {/* Sidebar Component */}
            <Sidebar
                activePanel={activePanel}
                setActivePanel={setActivePanel}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-6 py-4">
                {renderActivePanel()}
            </main>
        </div>
    );
}
