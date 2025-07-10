// src/types/client.ts

export interface Client {
    id: string;
    name: string;
    nameAr?: string;
    email: string;
    phone: string;
    address: string;
    addressAr?: string;
    vatNumber?: string;
    commercialRegistration?: string;
    contactPerson?: string;
    contactPersonAr?: string;
    paymentTerms: number; // days
    creditLimit?: number;
    currency: string;
    notes?: string;
    notesAr?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    // Statistics
    totalInvoices?: number;
    totalAmount?: number;
    lastInvoiceDate?: Date;
    averagePaymentDays?: number;
}

export interface ClientFilters {
    search?: string;
    isActive?: boolean;
    currency?: string;
    hasVatNumber?: boolean;
    paymentTermsMin?: number;
    paymentTermsMax?: number;
    totalAmountMin?: number;
    totalAmountMax?: number;
    createdAfter?: Date;
    createdBefore?: Date;
}

export interface ClientFormData {
    name: string;
    nameAr?: string;
    email: string;
    phone: string;
    address: string;
    addressAr?: string;
    vatNumber?: string;
    commercialRegistration?: string;
    contactPerson?: string;
    contactPersonAr?: string;
    paymentTerms: number;
    creditLimit?: number;
    currency: string;
    notes?: string;
    notesAr?: string;
    isActive: boolean;
}

export type ClientSortField = 'name' | 'email' | 'totalAmount' | 'totalInvoices' | 'createdAt' | 'lastInvoiceDate';
export type SortDirection = 'asc' | 'desc';

export interface ClientSort {
    field: ClientSortField;
    direction: SortDirection;
}
