// src/components/Invoice/ClientSelector.tsx

import { ChevronDownIcon, PlusIcon, SearchIcon, UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import { clientService } from '../../services/clientService';
import { Client } from '../../types/client';

interface ClientSelectorProps {
    selectedClient: Client | null;
    onSelectClient: (client: Client | null) => void;
    onCreateNew?: () => void;
}

export default function ClientSelector({ selectedClient, onSelectClient, onCreateNew }: ClientSelectorProps) {
    const { isArabic } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const labels = {
        selectClient: { en: 'Select Client', ar: 'اختر العميل' },
        searchClients: { en: 'Search clients...', ar: 'البحث عن العملاء...' },
        noClients: { en: 'No clients found', ar: 'لم يتم العثور على عملاء' },
        addNew: { en: 'Add New Client', ar: 'إضافة عميل جديد' },
        loading: { en: 'Loading...', ar: 'جاري التحميل...' }
    };

    useEffect(() => {
        if (isOpen) {
            loadClients();
        }
    }, [isOpen]);

    const loadClients = async () => {
        try {
            setLoading(true);
            const result = await clientService.getClients();
            setClients(result.clients.filter(c => c.isActive));
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.vatNumber && client.vatNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleSelectClient = (client: Client) => {
        onSelectClient(client);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative">
            {/* Selected Client Display / Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-600 border border-gray-500 rounded-lg text-white hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <div className="text-left">
                        {selectedClient ? (
                            <div>
                                <div className="font-medium">{selectedClient.name}</div>
                                <div className="text-sm text-gray-300">{selectedClient.email}</div>
                            </div>
                        ) : (
                            <div className="text-gray-300">
                                {isArabic ? labels.selectClient.ar : labels.selectClient.en}
                            </div>
                        )}
                    </div>
                </div>
                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 max-h-80 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-600">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder={isArabic ? labels.searchClients.ar : labels.searchClients.en}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-600 border border-gray-500 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Add New Client Option */}
                    {onCreateNew && (
                        <button
                            onClick={() => {
                                onCreateNew();
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 text-blue-400 hover:bg-gray-600 transition-colors border-b border-gray-600"
                        >
                            <PlusIcon className="w-4 h-4" />
                            {isArabic ? labels.addNew.ar : labels.addNew.en}
                        </button>
                    )}

                    {/* Clients List */}
                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-400">
                                {isArabic ? labels.loading.ar : labels.loading.en}
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">
                                {isArabic ? labels.noClients.ar : labels.noClients.en}
                            </div>
                        ) : (
                            filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                                >
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                        <UserIcon className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">{client.name}</div>
                                        <div className="text-sm text-gray-300 truncate">{client.email}</div>
                                        {client.vatNumber && (
                                            <div className="text-xs text-gray-400">VAT: {client.vatNumber}</div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Overlay to close dropdown */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
