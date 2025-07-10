import { ConnectionPool } from 'mssql';
import { ZATCAInvoice } from './zatca';

export interface DatabaseConfig {
    server: string;
    database: string;
    user: string;
    password: string;
    port: number;
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        enableArithAbort: boolean;
        connectionTimeout: number;
        requestTimeout: number;
    };
}

export interface DatabaseConnection {
    isConnected: boolean;
    pool: ConnectionPool | null;
    lastError?: string;
    retryAttempts: number;
    maxRetryAttempts: number;
}

export interface InvoiceRow {
    id: string;
    uuid: string;
    invoiceNumber: string;
    issueDate: Date;
    issueTime: string;
    invoiceTypeCode: string;
    documentCurrencyCode: string;
    taxCurrencyCode: string;
    invoiceCounterValue: number;
    previousInvoiceHash: string;
    supplierData: string; // JSON string
    customerData?: string; // JSON string
    invoiceLines: string; // JSON string
    taxTotal: string; // JSON string
    legalMonetaryTotal: string; // JSON string
    payableAmount: number;
    allowanceTotal?: number;
    chargeTotal?: number;
    prepaidAmount?: number;
    payableRoundingAmount?: number;
    qrCode?: string;
    cryptographicStamp?: string;
    invoiceHash?: string;
    xmlContent?: string;
    uuidVersion: string;
    certificateIssuer?: string;
    certificateSerialNumber?: string;
    validationResults?: string; // JSON string
    submissionUUID?: string;
    submissionDate?: Date;
    clearanceStatus?: string;
    reportingStatus?: string;
    zatcaInvoiceHash?: string;
    cryptoStamp?: string;
    status?: string;
    reportedAt?: Date;
    clearedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
    localId?: string;
    version: number;
    isDeleted: boolean;
    syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
    lastSyncAttempt?: Date;
    syncError?: string;
    createdBy?: string;
    updatedBy?: string;
    ipAddress?: string;
    userAgent?: string;
}

export interface InvoiceRecord extends ZATCAInvoice {
    // Database-specific fields
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
    localId?: string;
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

    // Invoice specific fields (from ZATCAInvoice)
    invoiceNumber?: string;
}

export interface SyncResult {
    success: boolean;
    syncedCount: number;
    failedCount: number;
    errors: string[];
    conflicts: InvoiceRecord[];
    timestamp: Date;
}

export interface FilterOptions {
    startDate?: Date;
    endDate?: Date;
    status?: string;
    customerId?: string;
    supplierVatNumber?: string;
    invoiceNumber?: string;
    minAmount?: number;
    maxAmount?: number;
    syncStatus?: 'pending' | 'synced' | 'failed' | 'conflict';
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt' | 'issueDate' | 'payableAmount';
    orderDirection?: 'ASC' | 'DESC';
}

export interface BatchSyncOptions {
    batchSize: number;
    maxRetries: number;
    retryDelay: number;
    onProgress?: (progress: { processed: number; total: number; errors: number }) => void;
    onBatchComplete?: (batch: InvoiceRecord[], result: SyncResult) => void;
}

export interface ConnectionHealth {
    isHealthy: boolean;
    lastCheck: Date;
    responseTime: number;
    errorCount: number;
    uptime: number;
}

export interface DatabaseMetrics {
    totalInvoices: number;
    pendingSyncCount: number;
    syncedCount: number;
    failedSyncCount: number;
    lastSyncTime?: Date;
    averageResponseTime: number;
    connectionUptime: number;
}

export interface ConflictResolution {
    strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
    resolvedBy?: string;
    resolvedAt?: Date;
    notes?: string;
}

export type AuditAction = 'create' | 'update' | 'delete' | 'sync' | 'conflict';

export interface AuditLogDetails {
    previousValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    conflictResolution?: string;
    syncDirection?: 'upload' | 'download';
    errorMessage?: string;
    [key: string]: unknown;
}

export interface AuditLog {
    id: string;
    invoiceId: string;
    action: AuditAction;
    timestamp: Date;
    userId?: string;
    details: AuditLogDetails;
    ipAddress?: string;
    userAgent?: string;
}

export interface SyncStatusRow {
    syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
    count: number;
}
