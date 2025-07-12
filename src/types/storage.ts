// src/types/storage.ts

export interface BaseRecord {
    id: string;
    type: 'invoice' | 'client' | 'template' | 'quote';
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
    version: number;
    isDeleted: boolean;
    syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
    lastSyncAttempt?: Date;
    syncError?: string;

    // Audit fields
    createdBy?: string;
    updatedBy?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface ClientRecord extends BaseRecord {
    type: 'client';
    clientData: import('./client').Client;
}

export interface InvoiceRecordExtended extends BaseRecord {
    type: 'invoice';
    invoiceData: import('./zatca').ZATCAInvoice;
}

export interface TemplateRecord extends BaseRecord {
    type: 'template';
    templateData: import('./invoice').InvoiceTemplate;
}

export interface QuoteRecord extends BaseRecord {
    type: 'quote';
    quoteData: import('./quote').Quote;
}

export type StorageRecord = ClientRecord | InvoiceRecordExtended | TemplateRecord | QuoteRecord;
