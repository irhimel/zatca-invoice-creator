import { useCallback, useEffect, useState } from 'react';
import { BaseEntity } from '../types';

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientName: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    amount: number;
    currency: string;
    date: string;
    dueDate: string;
    items: InvoiceItem[];
    taxes: Tax[];
    zatcaStatus?: 'pending' | 'approved' | 'rejected';
    qrCode?: string;
    xmlHash?: string;
}

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    taxRate: number;
}

export interface Tax {
    type: 'VAT' | 'withholding' | 'other';
    rate: number;
    amount: number;
}

export interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    vatNumber?: string;
}

export interface FirestoreHook<T> {
    data: T[] | null;
    loading: boolean;
    error: string | null;
    create: (item: Omit<T, 'id'>) => Promise<void>;
    update: (id: string, item: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

// Mock data for development
const mockInvoices: Invoice[] = [
    {
        id: '1',
        invoiceNumber: 'INV-2025-001',
        clientName: 'Al-Rashid Metal Trading',
        status: 'paid',
        amount: 15750.00,
        currency: 'SAR',
        date: '2025-01-15',
        dueDate: '2025-02-15',
        items: [
            {
                id: '1',
                description: 'Aluminum Scrap Grade A',
                quantity: 500,
                unitPrice: 25.50,
                total: 12750.00,
                taxRate: 0.15
            },
            {
                id: '2',
                description: 'Copper Wire Scrap',
                quantity: 100,
                unitPrice: 30.00,
                total: 3000.00,
                taxRate: 0.15
            }
        ],
        taxes: [
            {
                type: 'VAT',
                rate: 0.15,
                amount: 2362.50
            }
        ],
        zatcaStatus: 'approved',
        qrCode: 'QR_CODE_DATA_HERE',
        xmlHash: 'XML_HASH_HERE'
    },
    {
        id: '2',
        invoiceNumber: 'INV-2025-002',
        clientName: 'Saudi Steel Industries',
        status: 'sent',
        amount: 8500.00,
        currency: 'SAR',
        date: '2025-01-20',
        dueDate: '2025-02-20',
        items: [
            {
                id: '3',
                description: 'Steel Scrap Mixed',
                quantity: 1000,
                unitPrice: 8.50,
                total: 8500.00,
                taxRate: 0.15
            }
        ],
        taxes: [
            {
                type: 'VAT',
                rate: 0.15,
                amount: 1275.00
            }
        ],
        zatcaStatus: 'pending'
    }
];

const mockClients: Client[] = [
    {
        id: '1',
        name: 'Al-Rashid Metal Trading',
        email: 'info@alrashidmetal.com',
        phone: '+966 11 123 4567',
        address: 'Riyadh Industrial City, Riyadh',
        vatNumber: '300123456789003'
    },
    {
        id: '2',
        name: 'Saudi Steel Industries',
        email: 'procurement@saudisteel.com',
        phone: '+966 13 234 5678',
        address: 'Dammam Industrial Area, Dammam',
        vatNumber: '300234567890003'
    }
];

export function useFirestore<T extends BaseEntity>(collection: string): FirestoreHook<T> {
    const [data, setData] = useState<T[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock data based on collection
            if (collection === 'invoices') {
                setData(mockInvoices as unknown as T[]);
            } else if (collection === 'clients') {
                setData(mockClients as unknown as T[]);
            } else {
                setData([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [collection]);

    const create = async (item: Omit<T, 'id'>) => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            const newItem = { ...item, id: Date.now().toString() } as T;
            setData(prev => prev ? [...prev, newItem] : [newItem]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create item');
        }
    };

    const update = async (id: string, item: Partial<T>) => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            setData(prev => prev ? prev.map(existing =>
                existing.id === id ? { ...existing, ...item } : existing
            ) : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update item');
        }
    };

    const deleteItem = async (id: string) => {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            setData(prev => prev ? prev.filter(item => item.id !== id) : null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete item');
        }
    };

    useEffect(() => {
        refresh();
    }, [refresh]);

    return {
        data,
        loading,
        error,
        create,
        update,
        delete: deleteItem,
        refresh
    };
}

export function useInvoices() {
    return useFirestore<Invoice>('invoices');
}

export function useClients() {
    return useFirestore<Client>('clients');
}
