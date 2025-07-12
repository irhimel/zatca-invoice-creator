// src/panels/EnhancedInvoicesPanel.tsx

import {
    DownloadIcon,
    EditIcon,
    EyeIcon,
    FileTextIcon,
    FilterIcon,
    MoreVerticalIcon,
    PlusIcon,
    RefreshCcwIcon,
    SearchIcon,
    SortAscIcon,
    SortDescIcon
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import AdvancedSearchModal from '../components/Invoice/AdvancedSearchModal';
import { useLanguage } from '../context/utils/languageContextUtils';
import { BulkOperation, InvoiceFilters, InvoiceSort } from '../types/invoice';
import { SimpleInvoice } from '../types/simpleInvoice';

interface EnhancedInvoicesPanelProps {
    onNavigate?: (panel: import('../components/Layout/MainLayout').ActivePanel) => void;
}

export default function EnhancedInvoicesPanel({ onNavigate }: EnhancedInvoicesPanelProps) {
    const { isArabic } = useLanguage();

    // State
    const [invoices, setInvoices] = useState<SimpleInvoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<SimpleInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [currentFilters, setCurrentFilters] = useState<InvoiceFilters>({});
    const [sortConfig, setSortConfig] = useState<InvoiceSort>({
        field: 'createdAt',
        direction: 'desc'
    });
    const [quickSearch, setQuickSearch] = useState('');
    // Future: Add view mode toggle functionality
    // const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    const labels = {
        title: { en: 'Invoice Management', ar: 'إدارة الفواتير' },
        subtitle: { en: 'Manage your ZATCA-compliant invoices', ar: 'إدارة فواتيرك المتوافقة مع زاتكا' },
        quickSearch: { en: 'Quick search...', ar: 'بحث سريع...' },
        advancedSearch: { en: 'Advanced Search', ar: 'البحث المتقدم' },
        createInvoice: { en: 'Create Invoice', ar: 'إنشاء فاتورة' },
        bulkActions: { en: 'Bulk Actions', ar: 'إجراءات مجمعة' },
        selectAll: { en: 'Select All', ar: 'تحديد الكل' },
        deselectAll: { en: 'Deselect All', ar: 'إلغاء التحديد' },
        delete: { en: 'Delete', ar: 'حذف' },
        export: { en: 'Export', ar: 'تصدير' },
        send: { en: 'Send', ar: 'إرسال' },
        duplicate: { en: 'Duplicate', ar: 'نسخ' },
        refresh: { en: 'Refresh', ar: 'تحديث' },
        noInvoices: { en: 'No invoices found', ar: 'لا توجد فواتير' },
        loading: { en: 'Loading invoices...', ar: 'تحميل الفواتير...' },
        selected: { en: 'selected', ar: 'محدد' },
        totalFound: { en: 'Total found', ar: 'إجمالي النتائج' },
        invoiceNumber: { en: 'Invoice #', ar: 'رقم الفاتورة' },
        client: { en: 'Client', ar: 'العميل' },
        amount: { en: 'Amount', ar: 'المبلغ' },
        status: { en: 'Status', ar: 'الحالة' },
        date: { en: 'Date', ar: 'التاريخ' },
        dueDate: { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
        actions: { en: 'Actions', ar: 'الإجراءات' },
        view: { en: 'View', ar: 'عرض' },
        edit: { en: 'Edit', ar: 'تعديل' },
        download: { en: 'Download', ar: 'تحميل' },
        more: { en: 'More', ar: 'المزيد' },
        draft: { en: 'Draft', ar: 'مسودة' },
        signed: { en: 'Signed', ar: 'موقعة' },
        sent: { en: 'Sent', ar: 'مرسلة' },
        paid: { en: 'Paid', ar: 'مدفوعة' },
        cancelled: { en: 'Cancelled', ar: 'ملغية' },
        overdue: { en: 'Overdue', ar: 'متأخرة' }
    };

    // Mock data - replace with actual API calls
    useEffect(() => {
        loadInvoices();
    }, []);

    const filterAndSortInvoices = useCallback(() => {
        let filtered = [...invoices];

        // Apply quick search
        if (quickSearch) {
            const query = quickSearch.toLowerCase();
            filtered = filtered.filter(invoice =>
                invoice.invoiceNumber?.toLowerCase().includes(query) ||
                invoice.clientName.toLowerCase().includes(query) ||
                invoice.description?.toLowerCase().includes(query)
            );
        }

        // Apply advanced filters
        if (currentFilters.search) {
            const query = currentFilters.search.toLowerCase();
            filtered = filtered.filter(invoice =>
                invoice.invoiceNumber?.toLowerCase().includes(query) ||
                invoice.clientName.toLowerCase().includes(query) ||
                invoice.description?.toLowerCase().includes(query)
            );
        }

        if (currentFilters.amountMin !== undefined) {
            filtered = filtered.filter(invoice => invoice.totalAmount >= currentFilters.amountMin!);
        }

        if (currentFilters.amountMax !== undefined) {
            filtered = filtered.filter(invoice => invoice.totalAmount <= currentFilters.amountMax!);
        }

        if (currentFilters.dateFrom) {
            filtered = filtered.filter(invoice => invoice.issueDate >= currentFilters.dateFrom!);
        }

        if (currentFilters.dateTo) {
            filtered = filtered.filter(invoice => invoice.issueDate <= currentFilters.dateTo!);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: string | number, bValue: string | number;

            switch (sortConfig.field) {
                case 'invoiceNumber':
                    aValue = a.invoiceNumber || '';
                    bValue = b.invoiceNumber || '';
                    break;
                case 'clientName':
                    aValue = a.clientName.toLowerCase();
                    bValue = b.clientName.toLowerCase();
                    break;
                case 'totalAmount':
                    aValue = a.totalAmount;
                    bValue = b.totalAmount;
                    break;
                case 'createdAt':
                    aValue = a.createdAt.getTime();
                    bValue = b.createdAt.getTime();
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        setFilteredInvoices(filtered);
    }, [invoices, currentFilters, sortConfig, quickSearch]);

    useEffect(() => {
        filterAndSortInvoices();
    }, [filterAndSortInvoices]);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mock data - replace with actual API call
            const mockInvoices: SimpleInvoice[] = [
                {
                    id: '1',
                    invoiceNumber: 'INV-2025-001',
                    issueDate: new Date('2025-01-15'),
                    dueDate: new Date('2025-02-14'),
                    status: 'signed',
                    paymentStatus: 'pending',
                    clientId: 'client-1',
                    clientName: 'ABC Trading LLC',
                    clientVatNumber: '987654321098765',
                    clientEmail: 'contact@abctrading.com',
                    subtotal: 1500.00,
                    taxAmount: 225.00,
                    totalAmount: 1725.00,
                    paidAmount: 0,
                    currency: 'SAR',
                    hasQRCode: true,
                    isZATCACompliant: true,
                    qrCodeData: 'mock-qr-data',
                    description: 'Software consulting services',
                    notes: 'Payment due within 30 days',
                    tags: ['software', 'consulting'],
                    createdAt: new Date('2025-01-15'),
                    updatedAt: new Date('2025-01-15'),
                    createdBy: 'user-1'
                },
                {
                    id: '2',
                    invoiceNumber: 'INV-2025-002',
                    issueDate: new Date('2025-01-14'),
                    dueDate: new Date('2025-02-13'),
                    status: 'sent',
                    paymentStatus: 'partial',
                    clientId: 'client-2',
                    clientName: 'John Doe',
                    clientEmail: 'john.doe@email.com',
                    subtotal: 850.00,
                    taxAmount: 127.50,
                    totalAmount: 977.50,
                    paidAmount: 500.00,
                    currency: 'SAR',
                    hasQRCode: true,
                    isZATCACompliant: true,
                    qrCodeData: 'mock-qr-data-2',
                    description: 'Hardware maintenance',
                    notes: 'Partial payment received',
                    tags: ['hardware', 'maintenance'],
                    createdAt: new Date('2025-01-14'),
                    updatedAt: new Date('2025-01-15'),
                    createdBy: 'user-1'
                },
                {
                    id: '3',
                    invoiceNumber: 'INV-2025-003',
                    issueDate: new Date('2025-01-13'),
                    dueDate: new Date('2025-02-12'),
                    status: 'paid',
                    paymentStatus: 'paid',
                    clientId: 'client-3',
                    clientName: 'XYZ Corporation',
                    clientVatNumber: '123456789012345',
                    clientEmail: 'billing@xyzcorp.com',
                    subtotal: 3200.00,
                    taxAmount: 480.00,
                    totalAmount: 3680.00,
                    paidAmount: 3680.00,
                    currency: 'SAR',
                    hasQRCode: true,
                    isZATCACompliant: true,
                    qrCodeData: 'mock-qr-data-3',
                    description: 'System integration project',
                    notes: 'Payment completed on time',
                    tags: ['integration', 'project'],
                    createdAt: new Date('2025-01-13'),
                    updatedAt: new Date('2025-01-16'),
                    createdBy: 'user-1'
                }
            ];

            setInvoices(mockInvoices);
        } catch (error) {
            console.error('Error loading invoices:', error);
            setError('Failed to load invoices');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: InvoiceSort['field']) => {
        setSortConfig(prev => ({
            field,
            direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectInvoice = (invoiceId: string, selected: boolean) => {
        const newSelected = new Set(selectedInvoices);
        if (selected) {
            newSelected.add(invoiceId);
        } else {
            newSelected.delete(invoiceId);
        }
        setSelectedInvoices(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedInvoices.size === filteredInvoices.length) {
            setSelectedInvoices(new Set());
        } else {
            setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
        }
    };

    const handleBulkAction = async (action: BulkOperation['action']) => {
        if (selectedInvoices.size === 0) return;

        const invoiceIds = Array.from(selectedInvoices);

        try {
            // Implement bulk actions
            console.log(`Bulk ${action} for invoices:`, invoiceIds);

            // For demo purposes, just show alert
            alert(`${action} action performed on ${invoiceIds.length} invoices`);

            // Clear selection
            setSelectedInvoices(new Set());

            // Refresh data
            await loadInvoices();
        } catch (error) {
            console.error(`Error performing bulk ${action}:`, error);
            alert(`Failed to perform ${action}`);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR'
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(isArabic ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-500/20 text-green-400';
            case 'signed':
                return 'bg-blue-500/20 text-blue-400';
            case 'sent':
                return 'bg-purple-500/20 text-purple-400';
            case 'draft':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'cancelled':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-400">{isArabic ? labels.loading.ar : labels.loading.en}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={loadInvoices}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    {isArabic ? 'إعادة المحاولة' : 'Retry'}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FileTextIcon className="w-8 h-8 text-blue-400" />
                        {isArabic ? labels.title.ar : labels.title.en}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {isArabic ? labels.subtitle.ar : labels.subtitle.en}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onNavigate?.('create-invoice')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        {isArabic ? labels.createInvoice.ar : labels.createInvoice.en}
                    </button>

                    <button
                        onClick={loadInvoices}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <RefreshCcwIcon className="w-4 h-4" />
                        {isArabic ? labels.refresh.ar : labels.refresh.en}
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#1a213a] rounded-lg p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Quick Search */}
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={isArabic ? labels.quickSearch.ar : labels.quickSearch.en}
                            value={quickSearch}
                            onChange={(e) => setQuickSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Advanced Search Button */}
                    <button
                        onClick={() => setShowAdvancedSearch(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                        <FilterIcon className="w-4 h-4" />
                        {isArabic ? labels.advancedSearch.ar : labels.advancedSearch.en}
                    </button>
                </div>

                {/* Results and Selection Info */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                        {isArabic
                            ? `${filteredInvoices.length} ${labels.totalFound.ar}`
                            : `${filteredInvoices.length} ${labels.totalFound.en}`
                        }
                        {selectedInvoices.size > 0 && (
                            <span className="ml-2 text-blue-400">
                                • {selectedInvoices.size} {isArabic ? labels.selected.ar : labels.selected.en}
                            </span>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    {selectedInvoices.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">
                                {isArabic ? labels.bulkActions.ar : labels.bulkActions.en}:
                            </span>
                            <button
                                onClick={() => handleBulkAction('export')}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                            >
                                {isArabic ? labels.export.ar : labels.export.en}
                            </button>
                            <button
                                onClick={() => handleBulkAction('sendEmail')}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                            >
                                {isArabic ? labels.send.ar : labels.send.en}
                            </button>
                            <button
                                onClick={() => handleBulkAction('delete')}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                            >
                                {isArabic ? labels.delete.ar : labels.delete.en}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Table */}
            {filteredInvoices.length === 0 ? (
                <div className="bg-[#1a213a] rounded-lg p-8 text-center">
                    <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {isArabic ? labels.noInvoices.ar : labels.noInvoices.en}
                    </p>
                </div>
            ) : (
                <div className="bg-[#1a213a] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[#0e1726] border-b border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 bg-[#1a213a] border-gray-600 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('invoiceNumber')}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isArabic ? labels.invoiceNumber.ar : labels.invoiceNumber.en}
                                            {sortConfig.field === 'invoiceNumber' && (
                                                sortConfig.direction === 'asc' ?
                                                    <SortAscIcon className="w-4 h-4" /> :
                                                    <SortDescIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('clientName')}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isArabic ? labels.client.ar : labels.client.en}
                                            {sortConfig.field === 'clientName' && (
                                                sortConfig.direction === 'asc' ?
                                                    <SortAscIcon className="w-4 h-4" /> :
                                                    <SortDescIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('totalAmount')}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isArabic ? labels.amount.ar : labels.amount.en}
                                            {sortConfig.field === 'totalAmount' && (
                                                sortConfig.direction === 'asc' ?
                                                    <SortAscIcon className="w-4 h-4" /> :
                                                    <SortDescIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                                        {isArabic ? labels.status.ar : labels.status.en}
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-gray-300 font-semibold cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('createdAt')}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isArabic ? labels.date.ar : labels.date.en}
                                            {sortConfig.field === 'createdAt' && (
                                                sortConfig.direction === 'asc' ?
                                                    <SortAscIcon className="w-4 h-4" /> :
                                                    <SortDescIcon className="w-4 h-4" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-gray-300 font-semibold">
                                        {isArabic ? labels.actions.ar : labels.actions.en}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.id} className="border-b border-gray-700 hover:bg-[#0e1726]/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedInvoices.has(invoice.id)}
                                                onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 bg-[#1a213a] border-gray-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{invoice.invoiceNumber}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white">{invoice.clientName}</div>
                                            {invoice.clientVatNumber && (
                                                <div className="text-sm text-gray-400">VAT: {invoice.clientVatNumber}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-white">{formatCurrency(invoice.totalAmount)}</div>
                                            <div className="text-sm text-gray-400">Tax: {formatCurrency(invoice.taxAmount)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                                                {invoice.status === 'signed' ? (isArabic ? labels.signed.ar : labels.signed.en) :
                                                    invoice.status === 'paid' ? (isArabic ? labels.paid.ar : labels.paid.en) :
                                                        invoice.status === 'sent' ? (isArabic ? labels.sent.ar : labels.sent.en) :
                                                            invoice.status === 'draft' ? (isArabic ? labels.draft.ar : labels.draft.en) :
                                                                invoice.status === 'cancelled' ? (isArabic ? labels.cancelled.ar : labels.cancelled.en) : invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-white">{formatDate(invoice.createdAt)}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                                    title={isArabic ? labels.view.ar : labels.view.en}
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                                                    title={isArabic ? labels.edit.ar : labels.edit.en}
                                                >
                                                    <EditIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded transition-colors"
                                                    title={isArabic ? labels.download.ar : labels.download.en}
                                                >
                                                    <DownloadIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-500/10 rounded transition-colors"
                                                    title={isArabic ? labels.more.ar : labels.more.en}
                                                >
                                                    <MoreVerticalIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Advanced Search Modal */}
            <AdvancedSearchModal
                isOpen={showAdvancedSearch}
                onClose={() => setShowAdvancedSearch(false)}
                onSearch={(filters) => setCurrentFilters(filters)}
                initialFilters={currentFilters}
            />
        </div>
    );
}
