import { createContext, useContext } from 'react';
import { Client, Company, Invoice, InvoiceItem, InvoiceStatus } from '../../types';

export const InvoiceContext = createContext<{
    state: InvoiceState;
    dispatch: React.Dispatch<InvoiceAction>;
} | null>(null);

export function useInvoice() {
    const context = useContext(InvoiceContext);
    if (!context) {
        throw new Error('useInvoice must be used within an InvoiceProvider');
    }
    return context;
}

export interface InvoiceState {
    currentInvoice: Invoice;
    clients: Client[];
    company: Company;
}

export type InvoiceFieldValue = string | number | Date | InvoiceStatus | Client | Company | InvoiceItem[];

export type InvoiceAction =
    | { type: 'SET_INVOICE'; payload: Invoice }
    | { type: 'UPDATE_INVOICE_FIELD'; payload: { field: keyof Invoice; value: InvoiceFieldValue } }
    | { type: 'ADD_ITEM'; payload: InvoiceItem }
    | { type: 'UPDATE_ITEM'; payload: { index: number; item: InvoiceItem } }
    | { type: 'REMOVE_ITEM'; payload: number }
    | { type: 'ADD_CLIENT'; payload: Client }
    | { type: 'UPDATE_COMPANY'; payload: Company }
    | { type: 'NEW_INVOICE' }
    | { type: 'CALCULATE_TOTALS' };
