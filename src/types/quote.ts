// src/types/quote.ts

export interface Quote {
    id: string;
    quoteNumber: string;
    issueDate: Date;
    validUntil: Date;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

    // Client information
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    clientAddress?: string;
    clientVatNumber?: string;

    // Quote details
    title: string;
    description?: string;
    notes?: string;
    termsAndConditions?: string;

    // Items
    items: QuoteItem[];

    // Amounts
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;

    // Currency
    currency: string;

    // Conversion
    convertedToInvoiceId?: string;
    convertedAt?: Date;

    // Workflow
    approvalRequired: boolean;
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;

    // Audit fields
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}

export interface QuoteItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number; // percentage
    taxRate: number; // percentage
    subtotal: number;
    total: number;
}

export interface QuoteFormData {
    title: string;
    description?: string;
    clientId: string;
    validUntil: Date;
    notes?: string;
    termsAndConditions?: string;
    currency: string;
    items: QuoteItem[];
    approvalRequired: boolean;
}

export interface QuoteFilters {
    search?: string;
    status?: Quote['status'];
    clientId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    validUntilFrom?: Date;
    validUntilTo?: Date;
    amountMin?: number;
    amountMax?: number;
    currency?: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export type QuoteSortField =
    | 'quoteNumber'
    | 'clientName'
    | 'issueDate'
    | 'validUntil'
    | 'totalAmount'
    | 'status';

export interface QuoteSort {
    field: QuoteSortField;
    direction: 'asc' | 'desc';
}

export interface QuoteStats {
    total: number;
    totalAmount: number;
    averageAmount: number;
    statusBreakdown: Record<Quote['status'], number>;
    conversionRate: number; // percentage of quotes converted to invoices
    monthlyTrend: { month: string; count: number; amount: number; conversions: number }[];
}
