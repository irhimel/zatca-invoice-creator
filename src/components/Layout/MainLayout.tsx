// src/components/Layout/MainLayout.tsx
import { Suspense, lazy, useState } from 'react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import Sidebar from '../Sidebar';

// Lazy load panels for better performance
const DashboardPanel = lazy(() => import('../../panels/DashboardPanel'));
const InvoicesPanel = lazy(() => import('../../panels/InvoicesPanel'));
const CreateInvoicePanel = lazy(() => import('../../panels/CreateInvoicePanel'));
const ClientsPanel = lazy(() => import('../../panels/ClientsPanel'));
const QuotesPanel = lazy(() => import('../../panels/QuotesPanel'));
const ReportDashboardPanel = lazy(() => import('../../panels/ReportDashboardPanel'));
const CertificateManagerPanel = lazy(() => import('../../panels/CertificateManagerPanel'));
const AuditTrailPanel = lazy(() => import('../../panels/AuditTrailPanel'));
const SettingsPanel = lazy(() => import('../../panels/SettingsPanel'));

// Loading component
const PanelLoading = () => (
    <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Loading...</p>
        </div>
    </div>
);

// Define all panel types
export type ActivePanel =
    | 'dashboard'
    | 'invoices'
    | 'create-invoice'
    | 'clients'
    | 'quotes'
    | 'reports'
    | 'certificates'
    | 'audit'
    | 'settings';

export default function MainLayout() {
    const { isArabic } = useLanguage();
    const [activePanel, setActivePanel] = useState<ActivePanel>('dashboard');

    // Render appropriate panel based on active selection
    const renderActivePanel = () => {
        switch (activePanel) {
            case 'dashboard':
                return <DashboardPanel onNavigate={setActivePanel} />;
            case 'invoices':
                return <InvoicesPanel />;
            case 'create-invoice':
                return <CreateInvoicePanel />;
            case 'clients':
                return <ClientsPanel />;
            case 'quotes':
                return <QuotesPanel />;
            case 'reports':
                return <ReportDashboardPanel />;
            case 'certificates':
                return <CertificateManagerPanel />;
            case 'audit':
                return <AuditTrailPanel />;
            case 'settings':
                return <SettingsPanel />;
            default:
                return <DashboardPanel onNavigate={setActivePanel} />;
        }
    };

    return (
        <div
            dir={isArabic ? 'rtl' : 'ltr'}
            className="flex h-screen bg-[#0e1726] text-white"
        >
            <Sidebar
                activePanel={activePanel}
                setActivePanel={setActivePanel}
            />

            <main className="flex-1 overflow-y-auto px-6 py-4">
                <Suspense fallback={<PanelLoading />}>
                    {renderActivePanel()}
                </Suspense>
            </main>
        </div>
    );
}
