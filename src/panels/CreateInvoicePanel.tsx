import { AlertTriangleIcon, BookTemplateIcon, CalendarIcon, ClockIcon, DatabaseIcon, EyeIcon, FileTextIcon, SaveIcon, SendIcon } from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSettings } from '../context/utils/appSettingsContextUtils';
import { useLanguage } from '../context/utils/languageContextUtils';
import { useZATCA } from '../context/utils/zatcaContextUtils';
import { dbService } from '../services/database';
import { Client } from '../types/client';
import { ZATCAInvoice } from '../types/zatca';

// Lazy load heavy components
const CustomerForm = lazy(() => import('../components/Invoice/CustomerForm'));
const InvoiceItems = lazy(() => import('../components/Invoice/InvoiceItems'));
const InvoiceActions = lazy(() => import('../components/Invoice/InvoiceActions'));
const ClientSelector = lazy(() => import('../components/Invoice/ClientSelector'));
const ClientFormModal = lazy(() => import('../components/Client/ClientFormModal'));

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

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    vatNumber: string;
}

interface InvoiceTemplate {
    id: string;
    name: string;
    items: InvoiceItem[];
    notes: string;
    createdAt: Date;
}

interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export default function CreateInvoicePanel() {
    const { isArabic } = useLanguage();
    const { settings } = useAppSettings();
    const { generateSimplifiedInvoice, generatePDFInvoice, reportInvoice, validateInvoice, isProcessing } = useZATCA();

    // Client management
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showClientModal, setShowClientModal] = useState(false);

    // Invoice states
    const [generatedInvoice, setGeneratedInvoice] = useState<ZATCAInvoice | null>(null);
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } | null>(null);

    // Form states
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
            unitPrice: 0,
            taxRate: settings.defaultVatRate,
            total: 0
        }
    ]);

    const [invoiceDetails, setInvoiceDetails] = useState({
        invoiceNumber: settings.autoGenerateInvoiceNumber ?
            `${settings.invoicePrefix}-${Date.now()}` :
            `INV-${Date.now()}`,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
    });

    // Enhanced states
    const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Database status
    const [dbStatus, setDbStatus] = useState({
        azure: false,
        online: false,
        autoSyncActive: false,
        offlineCount: 0
    });

    // Enhanced validation function
    const validateForm = useCallback((): ValidationError[] => {
        const errors: ValidationError[] = [];

        // Customer validation
        if (!customerInfo.name.trim()) {
            errors.push({ field: 'customer.name', message: isArabic ? 'اسم العميل مطلوب' : 'Customer name is required', severity: 'error' });
        }

        if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
            errors.push({ field: 'customer.email', message: isArabic ? 'البريد الإلكتروني غير صحيح' : 'Invalid email format', severity: 'warning' });
        }

        if (customerInfo.vatNumber && !/^\d{15}$/.test(customerInfo.vatNumber)) {
            errors.push({ field: 'customer.vatNumber', message: isArabic ? 'رقم ضريبي غير صحيح (15 رقم)' : 'Invalid VAT number (15 digits)', severity: 'warning' });
        }

        // Items validation
        const validItems = items.filter(item => item.description.trim() && item.quantity > 0);
        if (validItems.length === 0) {
            errors.push({ field: 'items', message: isArabic ? 'يجب إضافة عنصر واحد على الأقل' : 'At least one item is required', severity: 'error' });
        }

        validItems.forEach((item, index) => {
            if (item.unitPrice <= 0) {
                errors.push({ field: `items.${index}.unitPrice`, message: isArabic ? `سعر العنصر ${index + 1} يجب أن يكون أكبر من صفر` : `Item ${index + 1} unit price must be greater than 0`, severity: 'error' });
            }
        });

        // Invoice details validation
        if (!invoiceDetails.invoiceNumber.trim()) {
            errors.push({ field: 'invoiceNumber', message: isArabic ? 'رقم الفاتورة مطلوب' : 'Invoice number is required', severity: 'error' });
        }

        const issueDate = new Date(invoiceDetails.issueDate);
        const dueDate = new Date(invoiceDetails.dueDate);
        if (dueDate < issueDate) {
            errors.push({ field: 'dueDate', message: isArabic ? 'تاريخ الاستحقاق يجب أن يكون بعد تاريخ الإصدار' : 'Due date must be after issue date', severity: 'warning' });
        }

        return errors;
    }, [customerInfo, items, invoiceDetails, isArabic]);

    // Auto-save functionality
    const autoSaveDraft = useCallback(async () => {
        try {
            setAutoSaveStatus('saving');
            const draftData = {
                customerInfo,
                items,
                invoiceDetails,
                selectedClientId: selectedClient?.id,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('auto-draft-invoice', JSON.stringify(draftData));
            setAutoSaveStatus('saved');
            setLastSaved(new Date());

            // Reset status after 2 seconds
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Auto-save failed:', error);
            setAutoSaveStatus('error');
            setTimeout(() => setAutoSaveStatus('idle'), 2000);
        }
    }, [customerInfo, items, invoiceDetails, selectedClient]);

    // Load templates
    const loadTemplates = useCallback(async () => {
        try {
            const savedTemplates = localStorage.getItem('invoice-templates');
            if (savedTemplates) {
                setTemplates(JSON.parse(savedTemplates));
            }
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    }, []);

    // Save template
    const saveAsTemplate = useCallback(async (templateName: string) => {
        try {
            const newTemplate: InvoiceTemplate = {
                id: Date.now().toString(),
                name: templateName,
                items: items.filter(item => item.description.trim()),
                notes: invoiceDetails.notes,
                createdAt: new Date()
            };

            const updatedTemplates = [...templates, newTemplate];
            setTemplates(updatedTemplates);
            localStorage.setItem('invoice-templates', JSON.stringify(updatedTemplates));
        } catch (error) {
            console.error('Failed to save template:', error);
        }
    }, [items, invoiceDetails.notes, templates]);

    // Load template
    const loadTemplate = useCallback((template: InvoiceTemplate) => {
        setItems(template.items.map(item => ({ ...item, id: Date.now().toString() + Math.random() })));
        setInvoiceDetails(prev => ({ ...prev, notes: template.notes }));
        setShowTemplateModal(false);
    }, []);

    // Calculate totals with memoization
    const totals = useMemo(() => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const totalTax = items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            return sum + (itemSubtotal * (item.taxRate / 100));
        }, 0);
        const total = subtotal + totalTax;

        return { subtotal, totalTax, total };
    }, [items]);

    // Database status update function
    const updateDbStatus = useCallback(async () => {
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
    }, []);

    // Initialize database service and load data
    useEffect(() => {
        const initializeDb = async () => {
            try {
                await dbService.initialize();
                await updateDbStatus();
                await loadTemplates();

                // Load auto-saved draft
                const autoDraft = localStorage.getItem('auto-draft-invoice');
                if (autoDraft) {
                    try {
                        const draftData = JSON.parse(autoDraft);
                        const draftAge = Date.now() - new Date(draftData.timestamp).getTime();

                        // Only load if draft is less than 24 hours old
                        if (draftAge < 24 * 60 * 60 * 1000) {
                            setCustomerInfo(prev => draftData.customerInfo || prev);
                            setItems(prev => draftData.items || prev);
                            setInvoiceDetails(prev => draftData.invoiceDetails || prev);

                            if (draftData.selectedClientId) {
                                console.log('Auto-loaded draft from', new Date(draftData.timestamp));
                            }
                        }
                    } catch (error) {
                        console.error('Failed to load auto-saved draft:', error);
                    }
                }
            } catch (error) {
                console.error('Failed to initialize database:', error);
            }
        };

        initializeDb();
        const interval = setInterval(updateDbStatus, 30000); // Update every 30 seconds
        return () => clearInterval(interval);
    }, [loadTemplates, updateDbStatus]);

    // Auto-save effect
    useEffect(() => {
        const autoSaveInterval = setInterval(autoSaveDraft, 30000); // Auto-save every 30 seconds
        return () => clearInterval(autoSaveInterval);
    }, [autoSaveDraft]);

    // Validation effect
    useEffect(() => {
        const errors = validateForm();
        setValidationErrors(errors);
    }, [validateForm]);

    // Event handlers
    const handleSelectClient = (client: Client | null) => {
        setSelectedClient(client);
        if (client) {
            setCustomerInfo({
                name: client.name,
                email: client.email,
                phone: client.phone,
                address: client.address,
                vatNumber: client.vatNumber || ''
            });
        } else {
            setCustomerInfo({
                name: '',
                email: '',
                phone: '',
                address: '',
                vatNumber: ''
            });
        }
    };

    const handleCreateNewClient = () => {
        setShowClientModal(true);
    };

    const handleClientModalSave = () => {
        setShowClientModal(false);
    };

    const handleUpdateCustomer = (field: keyof CustomerInfo, value: string) => {
        setCustomerInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
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

    const handleAddItem = () => {
        const newItem: InvoiceItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            taxRate: settings.defaultVatRate,
            total: 0
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleRemoveItem = (id: string) => {
        if (items.length > 1) {
            setItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleGenerateInvoice = async () => {
        try {
            const invoiceData = {
                supplier: {
                    name: settings.companyName,
                    vatNumber: settings.companyVatNumber,
                    crNumber: settings.companyRegistrationNumber,
                    address: {
                        street: settings.companyAddress,
                        cityName: 'Riyadh', // Default value
                        countryCode: 'SA',
                        buildingNumber: '1', // Default value
                        postalZone: '11111', // Default value
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

    const handleValidateInvoice = async () => {
        if (!generatedInvoice) return;
        try {
            const result = await validateInvoice(generatedInvoice);
            setValidationResult(result);
        } catch (error) {
            console.error('Failed to validate invoice:', error);
        }
    };

    const handleDownloadPDF = async () => {
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

    const handleReportToZATCA = async () => {
        if (!generatedInvoice || !validationResult?.isValid) return;
        try {
            await reportInvoice(generatedInvoice);
            await updateDbStatus();
        } catch (error) {
            console.error('Failed to report to ZATCA:', error);
        }
    };

    const hasErrors = validationErrors.some(error => error.severity === 'error');
    const hasWarnings = validationErrors.some(error => error.severity === 'warning');

    return (
        <div className="space-y-6">
            {/* Header with Enhanced Status */}
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

                {/* Enhanced Status Bar */}
                <div className="flex items-center gap-4 text-sm">
                    {/* Auto-save Status */}
                    <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4" />
                        <span className={`px-2 py-1 rounded text-xs ${autoSaveStatus === 'saved' ? 'bg-green-900/50 text-green-200' :
                            autoSaveStatus === 'saving' ? 'bg-blue-900/50 text-blue-200' :
                                autoSaveStatus === 'error' ? 'bg-red-900/50 text-red-200' :
                                    'bg-gray-700 text-gray-300'
                            }`}>
                            {autoSaveStatus === 'saved' ? (isArabic ? 'محفوظ تلقائياً' : 'Auto-saved') :
                                autoSaveStatus === 'saving' ? (isArabic ? 'جاري الحفظ...' : 'Saving...') :
                                    autoSaveStatus === 'error' ? (isArabic ? 'خطأ في الحفظ' : 'Save error') :
                                        (isArabic ? 'لم يحفظ' : 'Not saved')}
                        </span>
                        {lastSaved && (
                            <span className="text-xs text-gray-400">
                                {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* Database Status */}
                    <div className="flex items-center gap-2">
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
            </div>

            {/* Validation Alerts */}
            {(hasErrors || hasWarnings) && (
                <div className="space-y-2">
                    {hasErrors && (
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-200">
                                <AlertTriangleIcon className="w-5 h-5" />
                                <span className="font-semibold">
                                    {isArabic ? 'أخطاء في النموذج' : 'Form Errors'}
                                </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-red-300">
                                {validationErrors.filter(e => e.severity === 'error').map((error, index) => (
                                    <li key={index}>• {error.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {hasWarnings && (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-yellow-200">
                                <AlertTriangleIcon className="w-5 h-5" />
                                <span className="font-semibold">
                                    {isArabic ? 'تحذيرات' : 'Warnings'}
                                </span>
                            </div>
                            <ul className="mt-2 space-y-1 text-sm text-yellow-300">
                                {validationErrors.filter(e => e.severity === 'warning').map((error, index) => (
                                    <li key={index}>• {error.message}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Template Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BookTemplateIcon className="w-5 h-5 text-blue-400" />
                        {isArabic ? 'القوالب' : 'Templates'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-sm transition-colors"
                        >
                            {isArabic ? 'استخدام قالب' : 'Use Template'}
                        </button>
                        <button
                            onClick={() => {
                                const templateName = prompt(isArabic ? 'اسم القالب:' : 'Template name:');
                                if (templateName) saveAsTemplate(templateName);
                            }}
                            disabled={!items.some(item => item.description.trim())}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1.5 rounded text-sm transition-colors"
                        >
                            {isArabic ? 'حفظ كقالب' : 'Save as Template'}
                        </button>
                    </div>
                </div>

                {/* Total Summary */}
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-700 rounded p-3">
                        <div className="text-sm text-gray-400">{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</div>
                        <div className="text-lg font-semibold">{totals.subtotal.toFixed(2)} {isArabic ? 'ر.س' : 'SAR'}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3">
                        <div className="text-sm text-gray-400">{isArabic ? 'الضريبة' : 'Tax'}</div>
                        <div className="text-lg font-semibold">{totals.totalTax.toFixed(2)} {isArabic ? 'ر.س' : 'SAR'}</div>
                    </div>
                    <div className="bg-blue-700 rounded p-3">
                        <div className="text-sm text-blue-200">{isArabic ? 'المجموع الكلي' : 'Total'}</div>
                        <div className="text-lg font-bold">{totals.total.toFixed(2)} {isArabic ? 'ر.س' : 'SAR'}</div>
                    </div>
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
                            onChange={(e) => setInvoiceDetails(prev => ({ ...prev, invoiceNumber: e.target.value }))}
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
                            onChange={(e) => setInvoiceDetails(prev => ({ ...prev, issueDate: e.target.value }))}
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
                            onChange={(e) => setInvoiceDetails(prev => ({ ...prev, dueDate: e.target.value }))}
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
                            onChange={(e) => setInvoiceDetails(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={isArabic ? 'ملاحظات إضافية' : 'Additional notes'}
                        />
                    </div>
                </div>
            </div>

            {/* Client Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DatabaseIcon className="w-5 h-5 text-blue-400" />
                    {isArabic ? 'اختيار العميل' : 'Client Selection'}
                </h3>

                <Suspense fallback={<ComponentLoading />}>
                    <ClientSelector
                        selectedClient={selectedClient}
                        onSelectClient={handleSelectClient}
                        onCreateNew={handleCreateNewClient}
                    />
                </Suspense>
            </div>

            {/* Customer Form */}
            <Suspense fallback={<ComponentLoading />}>
                <CustomerForm
                    customerInfo={customerInfo}
                    onUpdateCustomer={handleUpdateCustomer}
                />
            </Suspense>

            {/* Invoice Items */}
            <Suspense fallback={<ComponentLoading />}>
                <InvoiceItems
                    items={items}
                    onUpdateItem={handleUpdateItem}
                    onAddItem={handleAddItem}
                    onRemoveItem={handleRemoveItem}
                />
            </Suspense>

            {/* Enhanced Generate Invoice Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleGenerateInvoice}
                    disabled={isProcessing || hasErrors || !customerInfo.name || !items.some(item => item.description.trim())}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-3"
                >
                    <SendIcon className="w-5 h-5" />
                    {isProcessing
                        ? (isArabic ? 'جاري الإنشاء...' : 'Generating...')
                        : (isArabic ? 'إنشاء الفاتورة' : 'Generate Invoice')
                    }
                </button>
            </div>

            {/* Invoice Actions */}
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

            {/* Enhanced Save Options */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => {
                        const data = { customerInfo, items, invoiceDetails };
                        localStorage.setItem('draft-invoice', JSON.stringify(data));
                        alert(isArabic ? 'تم حفظ المسودة' : 'Draft saved');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors flex items-center gap-2 text-sm"
                >
                    <SaveIcon className="w-4 h-4" />
                    {isArabic ? 'حفظ كمسودة' : 'Save Draft'}
                </button>

                {showPreview && (
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded transition-colors flex items-center gap-2 text-sm"
                    >
                        <EyeIcon className="w-4 h-4" />
                        {isArabic ? 'معاينة' : 'Preview'}
                    </button>
                )}
            </div>

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {isArabic ? 'اختيار قالب' : 'Select Template'}
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => loadTemplate(template)}
                                    className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                                >
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-sm text-gray-400">
                                        {template.items.length} {isArabic ? 'عناصر' : 'items'} •
                                        {new Date(template.createdAt).toLocaleDateString()}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                            >
                                {isArabic ? 'إلغاء' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Client Creation Modal */}
            {showClientModal && (
                <Suspense fallback={<ComponentLoading />}>
                    <ClientFormModal
                        isOpen={showClientModal}
                        onClose={() => setShowClientModal(false)}
                        onSave={handleClientModalSave}
                        mode="create"
                    />
                </Suspense>
            )}
        </div>
    );
}
