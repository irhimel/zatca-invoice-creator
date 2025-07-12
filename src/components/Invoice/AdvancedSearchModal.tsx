// src/components/Invoice/AdvancedSearchModal.tsx

import { CalendarIcon, DollarSignIcon, FilterIcon, SearchIcon, UserIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import { InvoiceFilters } from '../../types/invoice';

interface AdvancedSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (filters: InvoiceFilters) => void;
    initialFilters?: InvoiceFilters;
}

export default function AdvancedSearchModal({
    isOpen,
    onClose,
    onSearch,
    initialFilters = {}
}: AdvancedSearchModalProps) {
    const { isArabic } = useLanguage();
    const [filters, setFilters] = useState<InvoiceFilters>(initialFilters);

    const labels = {
        title: { en: 'Advanced Search', ar: 'البحث المتقدم' },
        search: { en: 'Search', ar: 'بحث' },
        clear: { en: 'Clear All', ar: 'مسح الكل' },
        cancel: { en: 'Cancel', ar: 'إلغاء' },
        general: { en: 'General', ar: 'عام' },
        amounts: { en: 'Amounts', ar: 'المبالغ' },
        dates: { en: 'Dates', ar: 'التواريخ' },
        options: { en: 'Options', ar: 'خيارات' },
        searchText: { en: 'Search Text', ar: 'نص البحث' },
        searchPlaceholder: { en: 'Invoice number, client name, description...', ar: 'رقم الفاتورة، اسم العميل، الوصف...' },
        status: { en: 'Status', ar: 'الحالة' },
        allStatuses: { en: 'All Statuses', ar: 'جميع الحالات' },
        draft: { en: 'Draft', ar: 'مسودة' },
        signed: { en: 'Signed', ar: 'موقعة' },
        sent: { en: 'Sent', ar: 'مرسلة' },
        paid: { en: 'Paid', ar: 'مدفوعة' },
        cancelled: { en: 'Cancelled', ar: 'ملغية' },
        paymentStatus: { en: 'Payment Status', ar: 'حالة الدفع' },
        allPayments: { en: 'All Payments', ar: 'جميع المدفوعات' },
        pending: { en: 'Pending', ar: 'معلقة' },
        partial: { en: 'Partial', ar: 'جزئية' },
        overdue: { en: 'Overdue', ar: 'متأخرة' },
        currency: { en: 'Currency', ar: 'العملة' },
        allCurrencies: { en: 'All Currencies', ar: 'جميع العملات' },
        minAmount: { en: 'Minimum Amount', ar: 'الحد الأدنى للمبلغ' },
        maxAmount: { en: 'Maximum Amount', ar: 'الحد الأقصى للمبلغ' },
        dateFrom: { en: 'From Date', ar: 'من تاريخ' },
        dateTo: { en: 'To Date', ar: 'إلى تاريخ' },
        hasQR: { en: 'Has QR Code', ar: 'لديه رمز QR' },
        zatcaCompliant: { en: 'ZATCA Compliant', ar: 'متوافق مع زاتكا' },
        tags: { en: 'Tags', ar: 'العلامات' },
        tagsPlaceholder: { en: 'Enter tags separated by commas', ar: 'أدخل العلامات مفصولة بفواصل' }
    };

    const handleFilterChange = (field: keyof InvoiceFilters, value: string | number | Date | boolean | string[] | undefined) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(filters);
        onClose();
    };

    const handleClear = () => {
        setFilters({});
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a213a] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <SearchIcon className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">
                            {isArabic ? labels.title.ar : labels.title.en}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* General Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FilterIcon className="w-5 h-5 text-blue-400" />
                            {isArabic ? labels.general.ar : labels.general.en}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search Text */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.searchText.ar : labels.searchText.en}
                                </label>
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder={isArabic ? labels.searchPlaceholder.ar : labels.searchPlaceholder.en}
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.status.ar : labels.status.en}
                                </label>
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">{isArabic ? labels.allStatuses.ar : labels.allStatuses.en}</option>
                                    <option value="draft">{isArabic ? labels.draft.ar : labels.draft.en}</option>
                                    <option value="signed">{isArabic ? labels.signed.ar : labels.signed.en}</option>
                                    <option value="sent">{isArabic ? labels.sent.ar : labels.sent.en}</option>
                                    <option value="paid">{isArabic ? labels.paid.ar : labels.paid.en}</option>
                                    <option value="cancelled">{isArabic ? labels.cancelled.ar : labels.cancelled.en}</option>
                                </select>
                            </div>

                            {/* Payment Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.paymentStatus.ar : labels.paymentStatus.en}
                                </label>
                                <select
                                    value={filters.paymentStatus || ''}
                                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">{isArabic ? labels.allPayments.ar : labels.allPayments.en}</option>
                                    <option value="pending">{isArabic ? labels.pending.ar : labels.pending.en}</option>
                                    <option value="partial">{isArabic ? labels.partial.ar : labels.partial.en}</option>
                                    <option value="paid">{isArabic ? labels.paid.ar : labels.paid.en}</option>
                                    <option value="overdue">{isArabic ? labels.overdue.ar : labels.overdue.en}</option>
                                </select>
                            </div>

                            {/* Currency */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.currency.ar : labels.currency.en}
                                </label>
                                <select
                                    value={filters.currency || ''}
                                    onChange={(e) => handleFilterChange('currency', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">{isArabic ? labels.allCurrencies.ar : labels.allCurrencies.en}</option>
                                    <option value="SAR">SAR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                    <option value="GBP">GBP</option>
                                    <option value="AED">AED</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Amounts Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <DollarSignIcon className="w-5 h-5 text-green-400" />
                            {isArabic ? labels.amounts.ar : labels.amounts.en}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Min Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.minAmount.ar : labels.minAmount.en}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={filters.amountMin || ''}
                                    onChange={(e) => handleFilterChange('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* Max Amount */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.maxAmount.ar : labels.maxAmount.en}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={filters.amountMax || ''}
                                    onChange={(e) => handleFilterChange('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Dates Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-purple-400" />
                            {isArabic ? labels.dates.ar : labels.dates.en}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.dateFrom.ar : labels.dateFrom.en}
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateFrom ? new Date(filters.dateFrom).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            {/* To Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.dateTo.ar : labels.dateTo.en}
                                </label>
                                <input
                                    type="date"
                                    value={filters.dateTo ? new Date(filters.dateTo).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Options Section */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-yellow-400" />
                            {isArabic ? labels.options.ar : labels.options.en}
                        </h3>

                        <div className="space-y-4">
                            {/* Checkboxes */}
                            <div className="flex flex-wrap gap-6">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.hasQR || false}
                                        onChange={(e) => handleFilterChange('hasQR', e.target.checked || undefined)}
                                        className="w-4 h-4 text-blue-600 bg-[#0e1726] border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">
                                        {isArabic ? labels.hasQR.ar : labels.hasQR.en}
                                    </span>
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={filters.isZATCACompliant || false}
                                        onChange={(e) => handleFilterChange('isZATCACompliant', e.target.checked || undefined)}
                                        className="w-4 h-4 text-blue-600 bg-[#0e1726] border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-300">
                                        {isArabic ? labels.zatcaCompliant.ar : labels.zatcaCompliant.en}
                                    </span>
                                </label>
                            </div>

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {isArabic ? labels.tags.ar : labels.tags.en}
                                </label>
                                <input
                                    type="text"
                                    value={filters.tags?.join(', ') || ''}
                                    onChange={(e) => handleFilterChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                                    className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                    placeholder={isArabic ? labels.tagsPlaceholder.ar : labels.tagsPlaceholder.en}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            {isArabic ? labels.clear.ar : labels.clear.en}
                        </button>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                {isArabic ? labels.cancel.ar : labels.cancel.en}
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                            >
                                <SearchIcon className="w-4 h-4" />
                                {isArabic ? labels.search.ar : labels.search.en}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
