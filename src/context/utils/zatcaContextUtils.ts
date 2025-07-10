import React, { createContext, useContext } from 'react';
import { ZATCAService } from '../../services/zatca/zatcaService';
import { OfflineInvoiceQueue, ZATCAInvoice } from '../../types/zatca';

export interface ZATCAContextType {
    zatcaService: ZATCAService | null;
    isInitialized: boolean;
    offlineQueueStats: {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    };
    overdueInvoices: OfflineInvoiceQueue[];
    generateSimplifiedInvoice: (invoiceData: import('../../types/zatca').ZATCASimplifiedInvoiceInput) => Promise<ZATCAInvoice>;
    generatePDFInvoice: (invoice: ZATCAInvoice) => Promise<Blob>;
    reportInvoice: (invoice: ZATCAInvoice) => Promise<void>;
    validateInvoice: (invoice: ZATCAInvoice) => Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    processOfflineQueue: () => Promise<void>;
    refreshQueueStats: () => void;
    isProcessing: boolean;
    lastError: string | null;
}

export interface ZATCAProviderProps {
    children: React.ReactNode;
}

// Context object
export const ZATCAContext = createContext<ZATCAContextType | undefined>(undefined);

// Hook
export function useZATCA() {
    const context = useContext(ZATCAContext);
    if (context === undefined) {
        throw new Error('useZATCA must be used within a ZATCAProvider');
    }
    return context;
}
