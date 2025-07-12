// src/panels/QuotesPanel.tsx

import {
    ArrowRightIcon,
    CheckIcon,
    ClockIcon,
    EditIcon,
    FilterIcon,
    MessageSquareIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
    XIcon
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../context/utils/languageContextUtils';
import { quoteService } from '../services/quoteService';
import { Quote, QuoteFilters } from '../types/quote';

export default function QuotesPanel() {
    const { isArabic } = useLanguage();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    // Future: Add sorting functionality
    // const [sortConfig, setSortConfig] = useState<QuoteSort>({
    //     field: 'issueDate',
    //     direction: 'desc'
    // });

    // Filters
    const [filters, setFilters] = useState<QuoteFilters>({});

    const labels = {
        title: { en: 'Quotes Management', ar: 'إدارة عروض الأسعار' },
        addQuote: { en: 'Create Quote', ar: 'إنشاء عرض سعر' },
        search: { en: 'Search quotes...', ar: 'البحث عن عروض الأسعار...' },
        filters: { en: 'Filters', ar: 'الفلاتر' },
        quoteNumber: { en: 'Quote Number', ar: 'رقم العرض' },
        client: { en: 'Client', ar: 'العميل' },
        issueDate: { en: 'Issue Date', ar: 'تاريخ الإصدار' },
        validUntil: { en: 'Valid Until', ar: 'صالح حتى' },
        amount: { en: 'Amount', ar: 'المبلغ' },
        status: { en: 'Status', ar: 'الحالة' },
        actions: { en: 'Actions', ar: 'الإجراءات' },
        edit: { en: 'Edit', ar: 'تعديل' },
        delete: { en: 'Delete', ar: 'حذف' },
        convert: { en: 'Convert to Invoice', ar: 'تحويل إلى فاتورة' },
        noQuotes: { en: 'No quotes found', ar: 'لم يتم العثور على عروض أسعار' },
        loading: { en: 'Loading quotes...', ar: 'تحميل عروض الأسعار...' },

        // Status translations
        draft: { en: 'Draft', ar: 'مسودة' },
        sent: { en: 'Sent', ar: 'مُرسل' },
        accepted: { en: 'Accepted', ar: 'مقبول' },
        rejected: { en: 'Rejected', ar: 'مرفوض' },
        expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
        converted: { en: 'Converted', ar: 'محول' }
    };

    const filterAndSortQuotes = useCallback(() => {
        let filtered = [...quotes];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(quote =>
                quote.quoteNumber.toLowerCase().includes(query) ||
                quote.title.toLowerCase().includes(query) ||
                quote.clientName.toLowerCase().includes(query) ||
                (quote.description && quote.description.toLowerCase().includes(query))
            );
        }

        // Apply filters
        if (filters.status) {
            filtered = filtered.filter(quote => quote.status === filters.status);
        }

        // Apply basic date-based sorting for now
        filtered.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

        setFilteredQuotes(filtered);
    }, [quotes, searchQuery, filters]);

    useEffect(() => {
        loadQuotes();
    }, []);

    useEffect(() => {
        filterAndSortQuotes();
    }, [filterAndSortQuotes]);

    const loadQuotes = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await quoteService.getQuotes();
            setQuotes(result.quotes);
        } catch (error) {
            console.error('Error loading quotes:', error);
            setError('Failed to load quotes');
        } finally {
            setLoading(false);
        }
    };

    // Future: Add sorting functionality
    // const handleSort = (field: QuoteSort['field']) => {
    //     setSortConfig(prev => ({
    //         field,
    //         direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    //     }));
    // };

    const handleDeleteQuote = async (quoteId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this quote?')) {
            return;
        }

        try {
            await quoteService.deleteQuote(quoteId);
            await loadQuotes();
        } catch (error) {
            console.error('Error deleting quote:', error);
            alert(isArabic ? 'فشل في حذف العرض' : 'Failed to delete quote');
        }
    };

    const handleConvertToInvoice = async (quoteId: string) => {
        try {
            const result = await quoteService.convertQuoteToInvoice(quoteId);
            alert(isArabic
                ? `تم تحويل العرض إلى فاتورة بنجاح: ${result.invoiceId}`
                : `Quote converted to invoice successfully: ${result.invoiceId}`
            );
            await loadQuotes();
        } catch (error) {
            console.error('Error converting quote:', error);
            alert(isArabic ? 'فشل في تحويل العرض' : 'Failed to convert quote');
        }
    };

    const getStatusColor = (status: Quote['status']) => {
        switch (status) {
            case 'draft':
                return 'bg-gray-500/20 text-gray-400';
            case 'sent':
                return 'bg-blue-500/20 text-blue-400';
            case 'accepted':
                return 'bg-green-500/20 text-green-400';
            case 'rejected':
                return 'bg-red-500/20 text-red-400';
            case 'expired':
                return 'bg-orange-500/20 text-orange-400';
            case 'converted':
                return 'bg-purple-500/20 text-purple-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getStatusIcon = (status: Quote['status']) => {
        switch (status) {
            case 'accepted':
                return CheckIcon;
            case 'rejected':
                return XIcon;
            case 'expired':
                return ClockIcon;
            case 'converted':
                return ArrowRightIcon;
            default:
                return MessageSquareIcon;
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: currency || 'SAR'
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat(isArabic ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
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
                    onClick={loadQuotes}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MessageSquareIcon className="w-8 h-8 text-blue-400" />
                    {isArabic ? labels.title.ar : labels.title.en}
                </h1>
                <button
                    onClick={() => {/* TODO: Open create quote modal */ }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    {isArabic ? labels.addQuote.ar : labels.addQuote.en}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#1a213a] rounded-lg p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={isArabic ? labels.search.ar : labels.search.en}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                            }`}
                    >
                        <FilterIcon className="w-4 h-4" />
                        {isArabic ? labels.filters.ar : labels.filters.en}
                    </button>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {isArabic ? labels.status.ar : labels.status.en}
                                </label>
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        status: e.target.value as Quote['status'] || undefined
                                    }))}
                                    className="w-full bg-[#0e1726] border border-gray-600 rounded text-white p-2"
                                >
                                    <option value="">{isArabic ? 'الكل' : 'All'}</option>
                                    <option value="draft">{isArabic ? labels.draft.ar : labels.draft.en}</option>
                                    <option value="sent">{isArabic ? labels.sent.ar : labels.sent.en}</option>
                                    <option value="accepted">{isArabic ? labels.accepted.ar : labels.accepted.en}</option>
                                    <option value="rejected">{isArabic ? labels.rejected.ar : labels.rejected.en}</option>
                                    <option value="expired">{isArabic ? labels.expired.ar : labels.expired.en}</option>
                                    <option value="converted">{isArabic ? labels.converted.ar : labels.converted.en}</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={() => setFilters({})}
                                    className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                                >
                                    {isArabic ? 'مسح الفلاتر' : 'Clear Filters'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="text-gray-400 text-sm">
                {isArabic
                    ? `عرض ${filteredQuotes.length} من ${quotes.length} عرض سعر`
                    : `Showing ${filteredQuotes.length} of ${quotes.length} quotes`
                }
            </div>

            {/* Quotes Grid */}
            {filteredQuotes.length === 0 ? (
                <div className="bg-[#1a213a] rounded-lg p-8 text-center">
                    <MessageSquareIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {isArabic ? labels.noQuotes.ar : labels.noQuotes.en}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredQuotes.map((quote) => {
                        const StatusIcon = getStatusIcon(quote.status);
                        return (
                            <div key={quote.id} className="bg-[#1a213a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                                {/* Quote Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                            <MessageSquareIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{quote.quoteNumber}</h3>
                                            <p className="text-sm text-gray-300 truncate">{quote.title}</p>
                                        </div>
                                    </div>

                                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(quote.status)}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {isArabic ? labels[quote.status].ar : labels[quote.status].en}
                                    </div>
                                </div>

                                {/* Quote Info */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{isArabic ? labels.client.ar : labels.client.en}:</span>
                                        <span className="text-white font-medium">{quote.clientName}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{isArabic ? labels.amount.ar : labels.amount.en}:</span>
                                        <span className="text-white font-medium">
                                            {formatCurrency(quote.totalAmount, quote.currency)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{isArabic ? labels.validUntil.ar : labels.validUntil.en}:</span>
                                        <span className="text-white">{formatDate(quote.validUntil)}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-4 border-t border-gray-700">
                                    <button
                                        onClick={() => {/* TODO: Edit quote */ }}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                        {isArabic ? labels.edit.ar : labels.edit.en}
                                    </button>

                                    {quote.status === 'accepted' && (
                                        <button
                                            onClick={() => handleConvertToInvoice(quote.id)}
                                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                        >
                                            <ArrowRightIcon className="w-4 h-4" />
                                            {isArabic ? labels.convert.ar : labels.convert.en}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDeleteQuote(quote.id)}
                                        className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
