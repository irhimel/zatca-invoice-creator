// src/panels/ClientsPanel.tsx

import {
    BuildingIcon,
    CalendarIcon,
    CreditCardIcon,
    EditIcon,
    FilterIcon,
    MailIcon,
    PhoneIcon,
    PlusIcon,
    SearchIcon,
    TrashIcon,
    UserIcon
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ClientFormModal from '../components/Client/ClientFormModal';
import { useLanguage } from '../context/utils/languageContextUtils';
import { clientService } from '../services/clientService';
import { Client, ClientFilters } from '../types/client';

export default function ClientsPanel() {
    const { isArabic } = useLanguage();
    const [clients, setClients] = useState<Client[]>([]);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    // Future: Add sorting functionality
    // const [sortConfig, setSortConfig] = useState<ClientSort>({
    //     field: 'name',
    //     direction: 'asc'
    // });

    // Filters
    const [filters, setFilters] = useState<ClientFilters>({});

    const labels = {
        title: { en: 'Client Management', ar: 'إدارة العملاء' },
        addClient: { en: 'Add Client', ar: 'إضافة عميل' },
        search: { en: 'Search clients...', ar: 'البحث عن العملاء...' },
        filters: { en: 'Filters', ar: 'الفلاتر' },
        name: { en: 'Name', ar: 'الاسم' },
        email: { en: 'Email', ar: 'البريد الإلكتروني' },
        phone: { en: 'Phone', ar: 'الهاتف' },
        address: { en: 'Address', ar: 'العنوان' },
        vatNumber: { en: 'VAT Number', ar: 'الرقم الضريبي' },
        totalInvoices: { en: 'Total Invoices', ar: 'إجمالي الفواتير' },
        totalAmount: { en: 'Total Amount', ar: 'المبلغ الإجمالي' },
        paymentTerms: { en: 'Payment Terms', ar: 'شروط الدفع' },
        currency: { en: 'Currency', ar: 'العملة' },
        status: { en: 'Status', ar: 'الحالة' },
        active: { en: 'Active', ar: 'نشط' },
        inactive: { en: 'Inactive', ar: 'غير نشط' },
        actions: { en: 'Actions', ar: 'الإجراءات' },
        edit: { en: 'Edit', ar: 'تعديل' },
        delete: { en: 'Delete', ar: 'حذف' },
        noClients: { en: 'No clients found', ar: 'لم يتم العثور على عملاء' },
        loading: { en: 'Loading clients...', ar: 'تحميل العملاء...' },
        days: { en: 'days', ar: 'أيام' }
    };

    const filterAndSortClients = useCallback(() => {
        let filtered = [...clients];

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(client =>
                client.name.toLowerCase().includes(query) ||
                client.email.toLowerCase().includes(query) ||
                (client.phone && client.phone.includes(query))
            );
        }

        // Apply filters
        if (filters.hasVatNumber !== undefined) {
            filtered = filtered.filter(client =>
                filters.hasVatNumber ? !!client.vatNumber : !client.vatNumber
            );
        }

        // Apply basic alphabetical sorting for now
        filtered.sort((a, b) => a.name.localeCompare(b.name));

        setFilteredClients(filtered);
    }, [clients, searchQuery, filters]);

    useEffect(() => {
        loadClients();
    }, []);

    useEffect(() => {
        filterAndSortClients();
    }, [filterAndSortClients]);

    const loadClients = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await clientService.getClients();
            setClients(result.clients);
        } catch (error) {
            console.error('Error loading clients:', error);
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    // Future: Add sorting functionality
    // const handleSort = (field: ClientSort['field']) => {
    //     setSortConfig(prev => ({
    //         field,
    //         direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    //     }));
    // };

    const handleEditClient = (client: Client) => {
        setSelectedClient(client);
        setShowEditModal(true);
    };

    const handleDeleteClient = async (clientId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا العميل؟' : 'Are you sure you want to delete this client?')) {
            return;
        }

        try {
            await clientService.deleteClient(clientId);
            await loadClients();
        } catch (error) {
            console.error('Error deleting client:', error);
            alert(isArabic ? 'فشل في حذف العميل' : 'Failed to delete client');
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat(isArabic ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: currency || 'SAR'
        }).format(amount);
    };

    // Future: Add date formatting when needed
    // const formatDate = (date: Date) => {
    //     return new Intl.DateTimeFormat(isArabic ? 'ar-SA' : 'en-US', {
    //         year: 'numeric',
    //         month: 'short',
    //         day: 'numeric'
    //     }).format(date);
    // };

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
                    onClick={loadClients}
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
                <h1 className="text-2xl font-bold text-white">
                    {isArabic ? labels.title.ar : labels.title.en}
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    {isArabic ? labels.addClient.ar : labels.addClient.en}
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
                                    value={filters.isActive?.toString() || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        isActive: e.target.value === '' ? undefined : e.target.value === 'true'
                                    }))}
                                    className="w-full bg-[#0e1726] border border-gray-600 rounded text-white p-2"
                                >
                                    <option value="">{isArabic ? 'الكل' : 'All'}</option>
                                    <option value="true">{isArabic ? labels.active.ar : labels.active.en}</option>
                                    <option value="false">{isArabic ? labels.inactive.ar : labels.inactive.en}</option>
                                </select>
                            </div>

                            {/* Currency Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {isArabic ? labels.currency.ar : labels.currency.en}
                                </label>
                                <select
                                    value={filters.currency || ''}
                                    onChange={(e) => setFilters(prev => ({ ...prev, currency: e.target.value || undefined }))}
                                    className="w-full bg-[#0e1726] border border-gray-600 rounded text-white p-2"
                                >
                                    <option value="">{isArabic ? 'الكل' : 'All'}</option>
                                    <option value="SAR">SAR</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>

                            {/* VAT Number Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    {isArabic ? labels.vatNumber.ar : labels.vatNumber.en}
                                </label>
                                <select
                                    value={filters.hasVatNumber?.toString() || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        hasVatNumber: e.target.value === '' ? undefined : e.target.value === 'true'
                                    }))}
                                    className="w-full bg-[#0e1726] border border-gray-600 rounded text-white p-2"
                                >
                                    <option value="">{isArabic ? 'الكل' : 'All'}</option>
                                    <option value="true">{isArabic ? 'لديه رقم ضريبي' : 'Has VAT Number'}</option>
                                    <option value="false">{isArabic ? 'بدون رقم ضريبي' : 'No VAT Number'}</option>
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
                    ? `عرض ${filteredClients.length} من ${clients.length} عميل`
                    : `Showing ${filteredClients.length} of ${clients.length} clients`
                }
            </div>

            {/* Clients Grid */}
            {filteredClients.length === 0 ? (
                <div className="bg-[#1a213a] rounded-lg p-8 text-center">
                    <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                        {isArabic ? labels.noClients.ar : labels.noClients.en}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div key={client.id} className="bg-[#1a213a] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
                            {/* Client Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white">{client.name}</h3>
                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${client.isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {client.isActive
                                                ? (isArabic ? labels.active.ar : labels.active.en)
                                                : (isArabic ? labels.inactive.ar : labels.inactive.en)
                                            }
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEditClient(client)}
                                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                                    >
                                        <EditIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClient(client.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <MailIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{client.email}</span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-300">
                                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">{client.phone}</span>
                                </div>

                                {client.vatNumber && (
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <CreditCardIcon className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{client.vatNumber}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-gray-300">
                                    <BuildingIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm truncate">{client.address}</span>
                                </div>

                                <div className="flex items-center gap-2 text-gray-300">
                                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                        {client.paymentTerms} {isArabic ? labels.days.ar : labels.days.en}
                                    </span>
                                </div>
                            </div>

                            {/* Statistics */}
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-white">
                                            {client.totalInvoices || 0}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {isArabic ? labels.totalInvoices.ar : labels.totalInvoices.en}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-semibold text-white">
                                            {formatCurrency(client.totalAmount || 0, client.currency)}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {isArabic ? labels.totalAmount.ar : labels.totalAmount.en}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Client Form Modal */}
            <ClientFormModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSave={loadClients}
                mode="create"
            />

            <ClientFormModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedClient(null);
                }}
                onSave={loadClients}
                client={selectedClient}
                mode="edit"
            />
        </div>
    );
}
