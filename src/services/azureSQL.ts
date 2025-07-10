import sql from 'mssql';
import { envConfig } from '../config/env';
import {
    AuditLog,
    ConnectionHealth,
    DatabaseConfig,
    DatabaseConnection,
    DatabaseMetrics,
    FilterOptions,
    InvoiceRecord,
    InvoiceRow,
    SyncStatusRow
} from '../types/database';
import { ZATCAInvoice } from '../types/zatca';

export class AzureSQLService {
    private static instance: AzureSQLService;
    private connection: DatabaseConnection;
    private config: DatabaseConfig;
    private healthCheckInterval: NodeJS.Timeout | null = null;
    private metrics: DatabaseMetrics;

    private constructor() {
        this.connection = {
            isConnected: false,
            pool: null,
            retryAttempts: 0,
            maxRetryAttempts: envConfig.DB_RETRY_ATTEMPTS
        };
        this.config = this.loadConfig();
        this.metrics = this.initializeMetrics();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): AzureSQLService {
        if (!AzureSQLService.instance) {
            AzureSQLService.instance = new AzureSQLService();
        }
        return AzureSQLService.instance;
    }

    /**
     * Load database configuration from environment variables
     */
    private loadConfig(): DatabaseConfig {
        return {
            server: envConfig.AZURE_SQL_SERVER,
            database: envConfig.AZURE_SQL_DATABASE,
            user: envConfig.AZURE_SQL_USERNAME,
            password: envConfig.AZURE_SQL_PASSWORD,
            port: envConfig.AZURE_SQL_PORT,
            options: {
                encrypt: true,
                trustServerCertificate: false,
                enableArithAbort: true,
                connectionTimeout: envConfig.DB_CONNECTION_TIMEOUT,
                requestTimeout: envConfig.DB_REQUEST_TIMEOUT
            }
        };
    }

    /**
     * Initialize metrics object
     */
    private initializeMetrics(): DatabaseMetrics {
        return {
            totalInvoices: 0,
            pendingSyncCount: 0,
            syncedCount: 0,
            failedSyncCount: 0,
            averageResponseTime: 0,
            connectionUptime: 0
        };
    }

    /**
     * Initialize database connection with retry logic
     */
    public async initDbConnection(): Promise<boolean> {
        try {
            console.log('🔄 Initializing Azure SQL Database connection...');

            // Validate configuration
            if (!this.validateConfig()) {
                throw new Error('Invalid database configuration');
            }

            // Create connection pool
            this.connection.pool = new sql.ConnectionPool(this.config);

            // Connect with retry logic
            await this.connectWithRetry();

            // Initialize database schema
            await this.initializeSchema();

            // Start health monitoring
            this.startHealthMonitoring();

            console.log('✅ Azure SQL Database connection initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize database connection:', error);
            this.connection.lastError = error instanceof Error ? error.message : 'Unknown error';
            return false;
        }
    }

    /**
     * Validate database configuration
     */
    private validateConfig(): boolean {
        const required = ['server', 'database', 'user', 'password'];
        for (const field of required) {
            if (!this.config[field as keyof DatabaseConfig]) {
                console.error(`❌ Missing required database config: ${field}`);
                return false;
            }
        }
        return true;
    }

    /**
     * Connect with exponential backoff retry logic
     */
    private async connectWithRetry(): Promise<void> {
        const maxRetries = this.connection.maxRetryAttempts;
        let retryDelay = envConfig.DB_RETRY_DELAY;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Connection attempt ${attempt}/${maxRetries}`);

                if (!this.connection.pool) {
                    throw new Error('Connection pool is not initialized');
                }
                await this.connection.pool.connect();
                this.connection.isConnected = true;
                this.connection.retryAttempts = 0;

                console.log('✅ Database connection established');
                return;

            } catch (error) {
                console.error(`❌ Connection attempt ${attempt} failed:`, error);
                this.connection.retryAttempts = attempt;

                if (attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                retryDelay *= 2;
            }
        }
    }

    /**
     * Initialize database schema
     */
    private async initializeSchema(): Promise<void> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();

            // Create invoices table
            await request.query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='invoices' AND xtype='U')
                CREATE TABLE invoices (
                    id NVARCHAR(50) PRIMARY KEY,
                    uuid NVARCHAR(36) UNIQUE NOT NULL,
                    invoiceNumber NVARCHAR(100) NOT NULL,
                    issueDate DATE NOT NULL,
                    issueTime TIME NOT NULL,
                    invoiceTypeCode NVARCHAR(10) NOT NULL,
                    documentCurrencyCode NVARCHAR(3) NOT NULL,
                    taxCurrencyCode NVARCHAR(3) NOT NULL,
                    invoiceCounterValue INT NOT NULL,
                    previousInvoiceHash NVARCHAR(MAX),
                    supplierData NVARCHAR(MAX) NOT NULL,
                    customerData NVARCHAR(MAX),
                    invoiceLines NVARCHAR(MAX) NOT NULL,
                    taxTotal NVARCHAR(MAX) NOT NULL,
                    legalMonetaryTotal NVARCHAR(MAX) NOT NULL,
                    cryptographicStamp NVARCHAR(MAX),
                    qrCode NVARCHAR(MAX),
                    status NVARCHAR(20) NOT NULL,
                    reportedAt DATETIME2,
                    clearedAt DATETIME2,
                    createdAt DATETIME2 DEFAULT GETDATE(),
                    updatedAt DATETIME2 DEFAULT GETDATE(),
                    syncedAt DATETIME2,
                    localId NVARCHAR(50),
                    version INT DEFAULT 1,
                    isDeleted BIT DEFAULT 0,
                    syncStatus NVARCHAR(20) DEFAULT 'pending',
                    lastSyncAttempt DATETIME2,
                    syncError NVARCHAR(MAX),
                    createdBy NVARCHAR(100),
                    updatedBy NVARCHAR(100),
                    ipAddress NVARCHAR(45),
                    userAgent NVARCHAR(MAX),
                    INDEX IX_invoices_issueDate (issueDate),
                    INDEX IX_invoices_status (status),
                    INDEX IX_invoices_syncStatus (syncStatus),
                    INDEX IX_invoices_invoiceNumber (invoiceNumber)
                )
            `);

            // Create audit log table
            await request.query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_logs' AND xtype='U')
                CREATE TABLE audit_logs (
                    id NVARCHAR(50) PRIMARY KEY,
                    invoiceId NVARCHAR(50) NOT NULL,
                    action NVARCHAR(20) NOT NULL,
                    timestamp DATETIME2 DEFAULT GETDATE(),
                    userId NVARCHAR(100),
                    details NVARCHAR(MAX),
                    ipAddress NVARCHAR(45),
                    userAgent NVARCHAR(MAX),
                    INDEX IX_audit_logs_invoiceId (invoiceId),
                    INDEX IX_audit_logs_timestamp (timestamp),
                    FOREIGN KEY (invoiceId) REFERENCES invoices(id)
                )
            `);

            console.log('✅ Database schema initialized');

        } catch (error) {
            console.error('❌ Failed to initialize database schema:', error);
            throw error;
        }
    }

    /**
     * Start health monitoring
     */
    private startHealthMonitoring(): void {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }

        this.healthCheckInterval = setInterval(async () => {
            await this.checkConnectionHealth();
        }, 30000); // Check every 30 seconds
    }

    /**
     * Test database connection
     */
    public async testDbConnection(): Promise<ConnectionHealth> {
        const startTime = Date.now();

        try {
            if (!this.connection.isConnected) {
                throw new Error('Database not connected');
            }

            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();
            await request.query('SELECT 1 as test');

            const responseTime = Date.now() - startTime;

            return {
                isHealthy: true,
                lastCheck: new Date(),
                responseTime,
                errorCount: 0,
                uptime: this.metrics.connectionUptime
            };

        } catch (error) {
            console.error('❌ Database health check failed:', error);

            return {
                isHealthy: false,
                lastCheck: new Date(),
                responseTime: Date.now() - startTime,
                errorCount: this.connection.retryAttempts,
                uptime: this.metrics.connectionUptime
            };
        }
    }

    /**
     * Check connection health
     */
    private async checkConnectionHealth(): Promise<void> {
        const health = await this.testDbConnection();

        if (!health.isHealthy && this.connection.isConnected) {
            console.warn('🔄 Database connection unhealthy, attempting reconnection...');
            await this.reconnect();
        }

        this.metrics.averageResponseTime = health.responseTime;
        this.metrics.connectionUptime = health.uptime;
    }

    /**
     * Reconnect to database
     */
    private async reconnect(): Promise<void> {
        try {
            await this.closeDbConnection();
            await this.initDbConnection();
        } catch (error) {
            console.error('❌ Failed to reconnect to database:', error);
        }
    }

    /**
     * Close database connection
     */
    public async closeDbConnection(): Promise<void> {
        try {
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = null;
            }

            if (this.connection.pool) {
                await this.connection.pool.close();
                this.connection.isConnected = false;
                this.connection.pool = null;
            }

            console.log('✅ Database connection closed');

        } catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
    }

    /**
     * Create new invoice record
     */
    public async createInvoice(invoiceData: ZATCAInvoice): Promise<string> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();

            const invoiceRecord: InvoiceRecord = {
                ...invoiceData,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                isDeleted: false,
                syncStatus: 'synced' // Created directly in cloud
            };

            await request
                .input('id', sql.NVarChar(50), invoiceRecord.id)
                .input('uuid', sql.NVarChar(36), invoiceRecord.uuid)
                .input('invoiceNumber', sql.NVarChar(100), invoiceRecord.invoiceNumber)
                .input('issueDate', sql.Date, new Date(invoiceRecord.issueDate))
                .input('issueTime', sql.Time, invoiceRecord.issueTime)
                .input('invoiceTypeCode', sql.NVarChar(10), invoiceRecord.invoiceTypeCode)
                .input('documentCurrencyCode', sql.NVarChar(3), invoiceRecord.documentCurrencyCode)
                .input('taxCurrencyCode', sql.NVarChar(3), invoiceRecord.taxCurrencyCode)
                .input('invoiceCounterValue', sql.Int, invoiceRecord.invoiceCounterValue)
                .input('previousInvoiceHash', sql.NVarChar(sql.MAX), invoiceRecord.previousInvoiceHash)
                .input('supplierData', sql.NVarChar(sql.MAX), JSON.stringify(invoiceRecord.supplier))
                .input('customerData', sql.NVarChar(sql.MAX), invoiceRecord.customer ? JSON.stringify(invoiceRecord.customer) : null)
                .input('invoiceLines', sql.NVarChar(sql.MAX), JSON.stringify(invoiceRecord.invoiceLines))
                .input('taxTotal', sql.NVarChar(sql.MAX), JSON.stringify(invoiceRecord.taxTotal))
                .input('legalMonetaryTotal', sql.NVarChar(sql.MAX), JSON.stringify(invoiceRecord.legalMonetaryTotal))
                .input('cryptographicStamp', sql.NVarChar(sql.MAX), invoiceRecord.cryptographicStamp ? JSON.stringify(invoiceRecord.cryptographicStamp) : null)
                .input('qrCode', sql.NVarChar(sql.MAX), invoiceRecord.qrCode)
                .input('status', sql.NVarChar(20), invoiceRecord.status)
                .input('reportedAt', sql.DateTime2, invoiceRecord.reportedAt ? new Date(invoiceRecord.reportedAt) : null)
                .input('clearedAt', sql.DateTime2, invoiceRecord.clearedAt ? new Date(invoiceRecord.clearedAt) : null)
                .input('syncedAt', sql.DateTime2, new Date())
                .query(`
                    INSERT INTO invoices (
                        id, uuid, invoiceNumber, issueDate, issueTime, invoiceTypeCode,
                        documentCurrencyCode, taxCurrencyCode, invoiceCounterValue, previousInvoiceHash,
                        supplierData, customerData, invoiceLines, taxTotal, legalMonetaryTotal,
                        cryptographicStamp, qrCode, status, reportedAt, clearedAt, syncedAt, syncStatus
                    ) VALUES (
                        @id, @uuid, @invoiceNumber, @issueDate, @issueTime, @invoiceTypeCode,
                        @documentCurrencyCode, @taxCurrencyCode, @invoiceCounterValue, @previousInvoiceHash,
                        @supplierData, @customerData, @invoiceLines, @taxTotal, @legalMonetaryTotal,
                        @cryptographicStamp, @qrCode, @status, @reportedAt, @clearedAt, @syncedAt, 'synced'
                    )
                `);

            // Create audit log
            await this.createAuditLog(invoiceRecord.id, 'create', {
                action: 'Invoice created',
                timestamp: new Date().toISOString()
            });

            console.log('✅ Invoice created successfully:', invoiceRecord.id);
            return invoiceRecord.id;

        } catch (error) {
            console.error('❌ Error creating invoice:', error);
            throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get invoices with filtering options
     */
    public async getInvoices(filterOptions: FilterOptions = {}): Promise<InvoiceRecord[]> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();
            let query = `
                SELECT * FROM invoices 
                WHERE isDeleted = 0
            `;

            // Add filters
            if (filterOptions.startDate) {
                query += ` AND issueDate >= @startDate`;
                request.input('startDate', sql.Date, filterOptions.startDate);
            }

            if (filterOptions.endDate) {
                query += ` AND issueDate <= @endDate`;
                request.input('endDate', sql.Date, filterOptions.endDate);
            }

            if (filterOptions.status) {
                query += ` AND status = @status`;
                request.input('status', sql.NVarChar(20), filterOptions.status);
            }

            if (filterOptions.invoiceNumber) {
                query += ` AND invoiceNumber LIKE @invoiceNumber`;
                request.input('invoiceNumber', sql.NVarChar(100), `%${filterOptions.invoiceNumber}%`);
            }

            if (filterOptions.syncStatus) {
                query += ` AND syncStatus = @syncStatus`;
                request.input('syncStatus', sql.NVarChar(20), filterOptions.syncStatus);
            }

            // Add ordering
            const orderBy = filterOptions.orderBy || 'createdAt';
            const orderDirection = filterOptions.orderDirection || 'DESC';
            query += ` ORDER BY ${orderBy} ${orderDirection}`;

            // Add pagination
            if (filterOptions.limit) {
                query += ` OFFSET ${filterOptions.offset || 0} ROWS FETCH NEXT ${filterOptions.limit} ROWS ONLY`;
            }

            const result = await request.query(query);

            // Convert database records to InvoiceRecord objects
            const invoices: InvoiceRecord[] = result.recordset.map((row: InvoiceRow) => ({
                id: row.id,
                uuid: row.uuid,
                invoiceNumber: row.invoiceNumber,
                issueDate: row.issueDate.toISOString().split('T')[0],
                issueTime: row.issueTime,
                invoiceTypeCode: row.invoiceTypeCode,
                documentCurrencyCode: row.documentCurrencyCode,
                taxCurrencyCode: row.taxCurrencyCode,
                invoiceCounterValue: row.invoiceCounterValue,
                previousInvoiceHash: row.previousInvoiceHash,
                supplier: JSON.parse(row.supplierData),
                customer: row.customerData ? JSON.parse(row.customerData) : undefined,
                invoiceLines: JSON.parse(row.invoiceLines),
                taxTotal: JSON.parse(row.taxTotal),
                legalMonetaryTotal: JSON.parse(row.legalMonetaryTotal),
                cryptographicStamp: row.cryptographicStamp ? JSON.parse(row.cryptographicStamp) : undefined,
                qrCode: row.qrCode,
                status: (row.status as 'draft' | 'signed' | 'reported' | 'cleared') || 'draft',
                reportedAt: row.reportedAt?.toISOString(),
                clearedAt: row.clearedAt?.toISOString(),
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                syncedAt: row.syncedAt,
                localId: row.localId,
                version: row.version,
                isDeleted: row.isDeleted,
                syncStatus: row.syncStatus,
                lastSyncAttempt: row.lastSyncAttempt,
                syncError: row.syncError,
                createdBy: row.createdBy,
                updatedBy: row.updatedBy,
                ipAddress: row.ipAddress,
                userAgent: row.userAgent
            }));

            return invoices;

        } catch (error) {
            console.error('❌ Error getting invoices:', error);
            throw new Error(`Failed to get invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Update invoice record
     */
    public async updateInvoice(invoiceId: string, updatedData: Partial<ZATCAInvoice>): Promise<void> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();

            // Get current invoice
            const currentInvoice = await this.getInvoice(invoiceId);
            if (!currentInvoice) {
                throw new Error('Invoice not found');
            }

            // Merge updated data
            const updatedInvoice = { ...currentInvoice, ...updatedData };

            await request
                .input('id', sql.NVarChar(50), invoiceId)
                .input('status', sql.NVarChar(20), updatedInvoice.status)
                .input('reportedAt', sql.DateTime2, updatedInvoice.reportedAt ? new Date(updatedInvoice.reportedAt) : null)
                .input('clearedAt', sql.DateTime2, updatedInvoice.clearedAt ? new Date(updatedInvoice.clearedAt) : null)
                .input('updatedAt', sql.DateTime2, new Date())
                .input('version', sql.Int, currentInvoice.version + 1)
                .query(`
                    UPDATE invoices 
                    SET status = @status, 
                        reportedAt = @reportedAt, 
                        clearedAt = @clearedAt, 
                        updatedAt = @updatedAt,
                        version = @version
                    WHERE id = @id AND isDeleted = 0
                `);

            // Create audit log
            await this.createAuditLog(invoiceId, 'update', {
                action: 'Invoice updated',
                changes: updatedData,
                timestamp: new Date().toISOString()
            });

            console.log('✅ Invoice updated successfully:', invoiceId);

        } catch (error) {
            console.error('❌ Error updating invoice:', error);
            throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete invoice record (soft delete)
     */
    public async deleteInvoice(invoiceId: string): Promise<void> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();

            await request
                .input('id', sql.NVarChar(50), invoiceId)
                .input('updatedAt', sql.DateTime2, new Date())
                .query(`
                    UPDATE invoices 
                    SET isDeleted = 1, updatedAt = @updatedAt
                    WHERE id = @id
                `);

            // Create audit log
            await this.createAuditLog(invoiceId, 'delete', {
                action: 'Invoice deleted',
                timestamp: new Date().toISOString()
            });

            console.log('✅ Invoice deleted successfully:', invoiceId);

        } catch (error) {
            console.error('❌ Error deleting invoice:', error);
            throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get single invoice by ID
     */
    public async getInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
        try {
            const invoices = await this.getInvoices({ invoiceNumber: invoiceId });
            return invoices.length > 0 ? invoices[0] : null;

        } catch (error) {
            console.error('❌ Error getting invoice:', error);
            return null;
        }
    }

    /**
     * Create audit log entry
     */
    private async createAuditLog(invoiceId: string, action: AuditLog['action'], details: Record<string, unknown>): Promise<void> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();
            const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await request
                .input('id', sql.NVarChar(50), auditId)
                .input('invoiceId', sql.NVarChar(50), invoiceId)
                .input('action', sql.NVarChar(20), action)
                .input('details', sql.NVarChar(sql.MAX), JSON.stringify(details))
                .query(`
                    INSERT INTO audit_logs (id, invoiceId, action, details)
                    VALUES (@id, @invoiceId, @action, @details)
                `);

        } catch (error) {
            console.error('❌ Error creating audit log:', error);
            // Don't throw here as audit logging shouldn't break main operations
        }
    }

    /**
     * Get database metrics
     */
    public async getMetrics(): Promise<DatabaseMetrics> {
        try {
            if (!this.connection.pool) {
                throw new Error('Connection pool is not initialized');
            }
            const request = this.connection.pool.request();

            const totalResult = await request.query(`
                SELECT COUNT(*) as total FROM invoices WHERE isDeleted = 0
            `);

            const syncStatusResult = await request.query(`
                SELECT 
                    syncStatus,
                    COUNT(*) as count
                FROM invoices 
                WHERE isDeleted = 0 
                GROUP BY syncStatus
            `);

            const lastSyncResult = await request.query(`
                SELECT TOP 1 syncedAt FROM invoices 
                WHERE syncedAt IS NOT NULL 
                ORDER BY syncedAt DESC
            `);

            this.metrics.totalInvoices = totalResult.recordset[0].total;
            this.metrics.pendingSyncCount = 0;
            this.metrics.syncedCount = 0;
            this.metrics.failedSyncCount = 0;

            syncStatusResult.recordset.forEach((row: SyncStatusRow) => {
                switch (row.syncStatus) {
                    case 'pending':
                        this.metrics.pendingSyncCount = row.count;
                        break;
                    case 'synced':
                        this.metrics.syncedCount = row.count;
                        break;
                    case 'failed':
                        this.metrics.failedSyncCount = row.count;
                        break;
                }
            });

            if (lastSyncResult.recordset.length > 0) {
                this.metrics.lastSyncTime = lastSyncResult.recordset[0].syncedAt;
            }

            return this.metrics;

        } catch (error) {
            console.error('❌ Error getting database metrics:', error);
            return this.metrics;
        }
    }

    /**
     * Check if database is connected
     */
    public isConnected(): boolean {
        return this.connection.isConnected;
    }

    /**
     * Get connection status
     */
    public getConnectionStatus(): DatabaseConnection {
        return { ...this.connection };
    }
}

export default AzureSQLService;
