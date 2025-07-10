import { CalendarIcon, DatabaseIcon, FileTextIcon, SaveIcon, SendIcon } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useAppSettings } from '../context/utils/appSettingsContextUtils';
import { useLanguage } from '../context/utils/languageContextUtils';
import { useZATCA } from '../context/utils/zatcaContextUtils';
import { dbService } from '../services/database';
import { ZATCAInvoice } from '../types/zatca';

// Lazy load heavy components
const CustomerForm = lazy(() => import('../components/Invoice/CustomerForm'));
const InvoiceItems = lazy(() => import('../components/Invoice/InvoiceItems'));
const InvoiceActions = lazy(() => import('../components/Invoice/InvoiceActions'));

// Loading component
const ComponentLoading = () => (
    <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-600 rounded w-1/4"></div>
            <div className="space-y-3">
                <div className="h-10 bg-gray-600 rounded"></div>
                <div className="h-10 bg-gray-600 rounded"></div>
            </div>
        </div>
    </div>
);


// Use the global InvoiceItem type for consistency and type safety

import type { InvoiceItem } from '../types';



interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    vatNumber: string;
}

interface InvoiceDetails {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    notes: string;
}

interface DbStatus {
    azure: boolean;
    online: boolean;
    autoSyncActive: boolean;
    offlineCount: number;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}


const CreateInvoicePanel: React.FC = () => {
    const { isArabic } = useLanguage();
    const { settings } = useAppSettings();
    const { generateSimplifiedInvoice, generatePDFInvoice, reportInvoice, validateInvoice, isProcessing } = useZATCA();

    const [generatedInvoice, setGeneratedInvoice] = useState<ZATCAInvoice | null>(null);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: '',
        email: '',
        phone: '',
        address: '',
        vatNumber: ''
    });

    const [items, setItems] = useState<InvoiceItem[]>([
        {
            id: '1',
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            unitPrice: 0,
            taxRate: settings.defaultVatRate,
            taxAmount: 0,
            total: 0
        }
    ]);

    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
        invoiceNumber: settings.autoGenerateInvoiceNumber ?
            `${settings.invoicePrefix}-${Date.now()}` :
            `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    });

    // Database status
    const [dbStatus, setDbStatus] = useState<DbStatus>({
        azure: false,
        online: false,
        autoSyncActive: false,
        offlineCount: 0
    });

    // Initialize database service

    useEffect(() => {
        const initializeDb = async () => {
            try {
                await dbService.initialize();
                updateDbStatus();
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };

        initializeDb();
        const interval = setInterval(updateDbStatus, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
        // updateDbStatus is stable (from dbService), so no need to add as dependency
    }, []);


    const updateDbStatus = async (): Promise<void> => {
        try {
            const status = dbService.getConnectionStatus();
            const metrics = await dbService.getMetrics();
            setDbStatus({
                azure: status.azure,
                online: status.online,
                autoSyncActive: status.autoSyncActive,
                offlineCount: metrics.pendingSyncCount
            });
        } catch (error) {
            console.error('Failed to get database status:', error);
        }
    };

    // Event handlers

    const handleUpdateCustomer = (field: keyof CustomerInfo, value: string): void => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string | number): void => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                if (field === 'quantity' || field === 'unitPrice' || field === 'taxRate') {
                    const subtotal = updated.quantity * updated.unitPrice;
                    const tax = subtotal * (updated.taxRate / 100);
                    updated.total = subtotal + tax;
                }
                return updated;
            }
            return item;
        }));
    };

    const handleAddItem = (): void => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            unitPrice: 0,
            taxRate: settings.defaultVatRate,
            taxAmount: 0,
            total: 0
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (id: string): void => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };


    const handleGenerateInvoice = async (): Promise<void> => {
        try {
            // Calculate totals
            const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            const totalTax = items.reduce((sum, item) => {
                const itemSubtotal = item.quantity * item.unitPrice;
                return sum + (itemSubtotal * (item.taxRate / 100));
            }, 0);
            // const total = subtotal + totalTax; // Not used in current implementation

            const invoiceData = {
                supplier: {
                    name: settings.companyName,
                    vatNumber: settings.companyVatNumber,
                    crNumber: settings.companyRegistrationNumber,
                    address: {
                        street: settings.companyAddress,
                        cityName: 'Riyadh',
                        countryCode: 'SA',
                        buildingNumber: '1',
                        postalZone: '11111',
                        countrySubentity: 'Riyadh'
                    }
                },
                customer: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                    vatNumber: customerInfo.vatNumber,
                    address: customerInfo.address ? {
                        street: customerInfo.address,
                        cityName: 'Riyadh',
                        countryCode: 'SA'
                    } : undefined
                },
                items: items.filter(item => item.description.trim() && item.quantity > 0).map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                    total: item.total
                }))
            };

            const invoice = await generateSimplifiedInvoice(invoiceData);
            setGeneratedInvoice(invoice);

            // Save to database
            await dbService.createInvoice(invoice);
            await updateDbStatus();

        } catch (error) {
            console.error('Failed to generate invoice:', error);
        }
    };


    const handleValidateInvoice = async (): Promise<void> => {
        if (!generatedInvoice) return;
        try {
            const result = await validateInvoice(generatedInvoice);
            setValidationResult(result);
        } catch (error) {
            console.error('Failed to validate invoice:', error);
        }
    };

    const handleDownloadPDF = async (): Promise<void> => {
        if (!generatedInvoice) return;
        try {
            const pdfBlob = await generatePDFInvoice(generatedInvoice);
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `invoice-${generatedInvoice.id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    const handleReportToZATCA = async (): Promise<void> => {
        if (!generatedInvoice || !validationResult?.isValid) return;
        try {
            await reportInvoice(generatedInvoice);
            await updateDbStatus();
        } catch (error) {
            console.error('Failed to report to ZATCA:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileTextIcon className="w-8 h-8 text-blue-400" />
                        {isArabic ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {isArabic
                            ? 'أنشئ فاتورة مبسطة متوافقة مع زاتكا'
                            : 'Create a ZATCA-compliant simplified tax invoice'
                        }
                    </p>
                </div>

                {/* Database Status */}
                <div className="flex items-center gap-2 text-sm">
                    <DatabaseIcon className="w-4 h-4" />
                    <span className={`px-2 py-1 rounded text-xs ${dbStatus.azure
                        ? 'bg-green-900/50 text-green-200'
                        : dbStatus.online
                            ? 'bg-yellow-900/50 text-yellow-200'
                            : 'bg-red-900/50 text-red-200'
                        }`}>
                        {dbStatus.azure
                            ? (isArabic ? 'متصل بـ Azure' : 'Azure Connected')
                            : dbStatus.online
                                ? (isArabic ? 'وضع عدم الاتصال' : 'Offline Mode')
                                : (isArabic ? 'غير متصل' : 'Disconnected')
                        }
                    </span>
                    {dbStatus.offlineCount > 0 && (
                        <span className="px-2 py-1 bg-blue-900/50 text-blue-200 rounded text-xs">
                            {dbStatus.offlineCount} {isArabic ? 'في انتظار المزامنة' : 'pending sync'}
                        </span>
                    )}
                </div>
            </div>

            {/* Invoice Details */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-400" />
                    {isArabic ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'رقم الفاتورة' : 'Invoice Number'}
                        </label>
                        <input
                            type="text"
                            value={invoiceDetails.invoiceNumber}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDetails(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'تاريخ الإصدار' : 'Issue Date'}
                        </label>
                        <input
                            type="date"
                            value={invoiceDetails.issueDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDetails(prev => ({ ...prev, issueDate: e.target.value }))}
                            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'تاريخ الاستحقاق' : 'Due Date'}
                        </label>
                        <input
                            type="date"
                            value={invoiceDetails.dueDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDetails(prev => ({ ...prev, dueDate: e.target.value }))}
                            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {isArabic ? 'ملاحظات' : 'Notes'}
                        </label>
                        <input
                            type="text"
                            value={invoiceDetails.notes}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDetails(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={isArabic ? 'ملاحظات إضافية' : 'Additional notes'}
                        />
                    </div>
                </div>
            </div>

            {/* Customer Form - Lazy Loaded */}
            <Suspense fallback={<ComponentLoading />}>
                <CustomerForm
                    customerInfo={customerInfo}
                    onUpdateCustomer={handleUpdateCustomer}
                />
            </Suspense>

            {/* Invoice Items - Lazy Loaded */}
            <Suspense fallback={<ComponentLoading />}>
                <InvoiceItems
                    items={items}
                    onUpdateItem={handleUpdateItem}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                />
            </Suspense>

            {/* Generate Invoice Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleGenerateInvoice}
                    disabled={isProcessing || !customerInfo.name || !items.some(item => item.description.trim())}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3"
                >
                    <SendIcon className="w-5 h-5" />
                    {isProcessing
                        ? (isArabic ? 'جاري الإنشاء...' : 'Generating...')
                        : (isArabic ? 'إنشاء الفاتورة' : 'Generate Invoice')
                    }
                </button>
            </div>

            {/* Invoice Actions - Lazy Loaded */}
            {generatedInvoice && (
                <Suspense fallback={<ComponentLoading />}>
                    <InvoiceActions
                        generatedInvoice={generatedInvoice}
                        validationResult={validationResult}
                        onValidate={handleValidateInvoice}
                        onDownloadPDF={handleDownloadPDF}
                        onReportToZATCA={handleReportToZATCA}
                    />
                </Suspense>
            )}

            {/* Quick Save */}
            <div className="flex justify-end">
                <button
                    onClick={(): void => {
                        const data = { customerInfo, items, invoiceDetails };
                        localStorage.setItem('draft-invoice', JSON.stringify(data));
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors flex items-center gap-2 text-sm"
                >
                    <SaveIcon className="w-4 h-4" />
                    {isArabic ? 'حفظ كمسودة' : 'Save Draft'}
                </button>
            </div>
        </div>
    );
};

export default CreateInvoicePanel;
