// src/types/simpleInvoice.ts

export interface SimpleInvoice {
    id: string;
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date;
    status: 'draft' | 'signed' | 'sent' | 'paid' | 'cancelled';
    paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';

    // Client information
    clientId: string;
    clientName: string;
    clientVatNumber?: string;
    clientEmail?: string;

    // Amounts
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;

    // Currency
    currency: string;

    // ZATCA specific
    hasQRCode: boolean;
    isZATCACompliant: boolean;
    qrCodeData?: string;

    // Additional fields
    description?: string;
    notes?: string;
    tags: string[];

    // Audit fields
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
}
