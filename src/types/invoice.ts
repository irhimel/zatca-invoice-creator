// src/types/invoice.ts

export interface InvoiceFilters {
    search?: string; // Search in invoice number, client name, or description
    status?: 'draft' | 'signed' | 'sent' | 'paid' | 'cancelled';
    clientId?: string;
    amountMin?: number;
    amountMax?: number;
    dateFrom?: Date;
    dateTo?: Date;
    currency?: string;
    hasQR?: boolean;
    isZATCACompliant?: boolean;
    paymentStatus?: 'pending' | 'partial' | 'paid' | 'overdue';
    tags?: string[];
}

export interface InvoiceStats {
    total: number;
    totalAmount: number;
    averageAmount: number;
    statusBreakdown: Record<string, number>;
    currencyBreakdown: Record<string, number>;
    monthlyTrend: { month: string; count: number; amount: number }[];
}

export type InvoiceSortField =
    | 'invoiceNumber'
    | 'clientName'
    | 'totalAmount'
    | 'createdAt'
    | 'dueDate'
    | 'status';

export interface InvoiceSort {
    field: InvoiceSortField;
    direction: 'asc' | 'desc';
}

export type BulkAction = 'delete' | 'updateStatus' | 'export' | 'sendEmail' | 'duplicate';

export interface BulkOperationParams {
    status?: string;
    emailTemplate?: string;
    exportFormat?: 'pdf' | 'excel' | 'csv';
    [key: string]: unknown;
}

export interface BulkOperation {
    action: BulkAction;
    invoiceIds: string[];
    params?: BulkOperationParams;
}

export interface InvoiceTemplate {
    id: string;
    name: string;
    nameAr?: string;
    description?: string;
    descriptionAr?: string;
    isDefault: boolean;

    // Template settings
    showLogo: boolean;
    showQR: boolean;
    showNotes: boolean;
    showPaymentTerms: boolean;
    showTaxSummary: boolean;

    // Styling
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    fontSize: number;

    // Default values
    defaultCurrency: string;
    defaultPaymentTerms: number;
    defaultNotes?: string;
    defaultNotesAr?: string;

    // Layout
    layout: 'standard' | 'compact' | 'detailed';
    itemColumns: string[];

    createdAt: Date;
    updatedAt: Date;
}
