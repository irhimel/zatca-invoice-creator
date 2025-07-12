import { FilterOptions, InvoiceRecord, SyncResult } from '../types/database';
import { ZATCAInvoice } from '../types/zatca';
import { AzureSQLService } from './azureSQL';
import { OfflineSyncService } from './offlineSync';

/**
 * Main database service that handles both online and offline operations
 */
export class DatabaseService {
    private static instance: DatabaseService;
    private azureSQL: AzureSQLService;
    private offlineSync: OfflineSyncService;
    private initialized: boolean = false;

    private constructor() {
        this.azureSQL = AzureSQLService.getInstance();
        this.offlineSync = OfflineSyncService.getInstance();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Initialize database service
     */
    public async initialize(): Promise<boolean> {
        try {
            console.log('🔄 Initializing Database Service...');

            // Initialize Azure SQL connection
            const azureInitialized = await this.azureSQL.initDbConnection();

            if (azureInitialized) {
                // Start auto-sync if online
                this.offlineSync.startAutoSync();
                console.log('✅ Database Service initialized with Azure SQL');
            } else {
                console.warn('⚠️ Database Service initialized in offline mode only');
            }

            this.initialized = true;
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Database Service:', error);
            return false;
        }
    }

    /**
     * Create invoice - handles both online and offline scenarios
     */
    public async createInvoice(invoiceData: ZATCAInvoice): Promise<string> {
        try {
            if (this.azureSQL.isConnected()) {
                // Online: Save directly to Azure SQL
                const invoiceId = await this.azureSQL.createInvoice(invoiceData);
                console.log('✅ Invoice created online:', invoiceId);
                return invoiceId;
            } else {
                // Offline: Store in IndexedDB for later sync
                await this.offlineSync.storeInvoiceOffline(invoiceData);
                console.log('💾 Invoice stored offline:', invoiceData.id);
                return invoiceData.id;
            }
        } catch (error) {
            console.error('❌ Error creating invoice:', error);
            throw new Error(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get invoices with filtering
     */
    public async getInvoices(filterOptions: FilterOptions = {}): Promise<InvoiceRecord[]> {
        try {
            if (this.azureSQL.isConnected()) {
                return await this.azureSQL.getInvoices(filterOptions);
            } else {
                // Offline: Get from IndexedDB
                const offlineInvoices = await this.getOfflineInvoices();
                return this.applyFilters(offlineInvoices, filterOptions);
            }
        } catch (error) {
            console.error('❌ Error getting invoices:', error);
            throw new Error(`Failed to get invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get single invoice by ID
     */
    public async getInvoice(invoiceId: string): Promise<InvoiceRecord | null> {
        try {
            if (this.azureSQL.isConnected()) {
                return await this.azureSQL.getInvoice(invoiceId);
            } else {
                // Offline: Get from IndexedDB
                const offlineInvoices = await this.getOfflineInvoices();
                return offlineInvoices.find(invoice => invoice.id === invoiceId) || null;
            }
        } catch (error) {
            console.error('❌ Error getting invoice:', error);
            return null;
        }
    }

    /**
     * Update invoice
     */
    public async updateInvoice(invoiceId: string, updatedData: Partial<ZATCAInvoice>): Promise<void> {
        try {
            if (this.azureSQL.isConnected()) {
                await this.azureSQL.updateInvoice(invoiceId, updatedData);
                console.log('✅ Invoice updated online:', invoiceId);
            } else {
                // Offline: Update in IndexedDB
                await this.updateOfflineInvoice(invoiceId, updatedData);
                console.log('💾 Invoice updated offline:', invoiceId);
            }
        } catch (error) {
            console.error('❌ Error updating invoice:', error);
            throw new Error(`Failed to update invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Delete invoice
     */
    public async deleteInvoice(invoiceId: string): Promise<void> {
        try {
            if (this.azureSQL.isConnected()) {
                await this.azureSQL.deleteInvoice(invoiceId);
                console.log('✅ Invoice deleted online:', invoiceId);
            } else {
                // Offline: Mark as deleted in IndexedDB
                await this.deleteOfflineInvoice(invoiceId);
                console.log('💾 Invoice marked for deletion offline:', invoiceId);
            }
        } catch (error) {
            console.error('❌ Error deleting invoice:', error);
            throw new Error(`Failed to delete invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Sync offline data to Azure
     */
    public async syncOfflineDataToAzure(): Promise<SyncResult> {
        try {
            if (!this.azureSQL.isConnected()) {
                throw new Error('Azure SQL not connected');
            }

            return await this.offlineSync.syncOfflineDataToAzure();
        } catch (error) {
            console.error('❌ Error syncing offline data:', error);
            throw new Error(`Failed to sync offline data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Get connection status
     */
    public getConnectionStatus(): {
        azure: boolean;
        online: boolean;
        autoSyncActive: boolean;
        offlineCount: number;
    } {
        return {
            azure: this.azureSQL.isConnected(),
            online: navigator.onLine,
            autoSyncActive: this.offlineSync.getSyncStatus().autoSyncActive,
            offlineCount: 0 // Will be populated by async call
        };
    }

    /**
     * Test database connection
     */
    public async testConnection(): Promise<boolean> {
        try {
            const health = await this.azureSQL.testDbConnection();
            return health.isHealthy;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    /**
     * Close database connections
     */
    public async close(): Promise<void> {
        try {
            this.offlineSync.stopAutoSync();
            await this.azureSQL.closeDbConnection();
            this.initialized = false;
            console.log('✅ Database Service closed');
        } catch (error) {
            console.error('❌ Error closing database service:', error);
        }
    }

    /**
     * Get offline invoices from IndexedDB
     */
    private async getOfflineInvoices(): Promise<InvoiceRecord[]> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readonly');
                const store = transaction.objectStore('invoices');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    interface RawInvoiceData {
                        createdAt: string | Date;
                        updatedAt: string | Date;
                        syncedAt?: string | Date;
                        version?: number;
                        isDeleted?: boolean;
                        synced?: boolean;
                        [key: string]: unknown;
                    }

                    const invoices = getAllRequest.result.map((invoice: RawInvoiceData) => ({
                        ...invoice,
                        createdAt: new Date(invoice.createdAt),
                        updatedAt: new Date(invoice.updatedAt),
                        syncedAt: invoice.syncedAt ? new Date(invoice.syncedAt) : undefined,
                        version: invoice.version || 1,
                        isDeleted: invoice.isDeleted || false,
                        syncStatus: (invoice.synced ? 'synced' : 'pending') as 'pending' | 'synced' | 'failed' | 'conflict'
                    })) as InvoiceRecord[];
                    resolve(invoices);
                };

                getAllRequest.onerror = () => reject(getAllRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Apply filters to offline invoices
     */
    private applyFilters(invoices: InvoiceRecord[], filterOptions: FilterOptions): InvoiceRecord[] {
        let filtered = invoices.filter(invoice => !invoice.isDeleted);

        if (filterOptions.startDate) {
            filtered = filtered.filter(invoice =>
                new Date(invoice.issueDate) >= filterOptions.startDate!
            );
        }

        if (filterOptions.endDate) {
            filtered = filtered.filter(invoice =>
                new Date(invoice.issueDate) <= filterOptions.endDate!
            );
        }

        if (filterOptions.status) {
            filtered = filtered.filter(invoice => invoice.status === filterOptions.status);
        }

        if (filterOptions.syncStatus) {
            filtered = filtered.filter(invoice => invoice.syncStatus === filterOptions.syncStatus);
        }

        // Apply ordering
        const orderBy = filterOptions.orderBy || 'createdAt';
        const orderDirection = filterOptions.orderDirection || 'DESC';

        filtered.sort((a, b) => {
            const aValue = a[orderBy as keyof InvoiceRecord];
            const bValue = b[orderBy as keyof InvoiceRecord];

            if (!aValue || !bValue) return 0;

            if (aValue < bValue) return orderDirection === 'ASC' ? -1 : 1;
            if (aValue > bValue) return orderDirection === 'ASC' ? 1 : -1;
            return 0;
        });

        // Apply pagination
        if (filterOptions.limit) {
            const offset = filterOptions.offset || 0;
            filtered = filtered.slice(offset, offset + filterOptions.limit);
        }

        return filtered;
    }

    /**
     * Update offline invoice in IndexedDB
     */
    private async updateOfflineInvoice(invoiceId: string, updatedData: Partial<ZATCAInvoice>): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readwrite');
                const store = transaction.objectStore('invoices');

                const getRequest = store.get(invoiceId);
                getRequest.onsuccess = () => {
                    const invoice = getRequest.result;
                    if (invoice) {
                        const updatedInvoice = {
                            ...invoice,
                            ...updatedData,
                            updatedAt: new Date().toISOString(),
                            synced: false // Mark as needing sync
                        };

                        const putRequest = store.put(updatedInvoice);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        reject(new Error('Invoice not found'));
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete offline invoice from IndexedDB
     */
    private async deleteOfflineInvoice(invoiceId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readwrite');
                const store = transaction.objectStore('invoices');

                const getRequest = store.get(invoiceId);
                getRequest.onsuccess = () => {
                    const invoice = getRequest.result;
                    if (invoice) {
                        const deletedInvoice = {
                            ...invoice,
                            isDeleted: true,
                            updatedAt: new Date().toISOString(),
                            synced: false // Mark as needing sync
                        };

                        const putRequest = store.put(deletedInvoice);
                        putRequest.onsuccess = () => resolve();
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        resolve(); // Invoice not found, consider it deleted
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get database metrics
     */
    public async getMetrics() {
        try {
            if (this.azureSQL.isConnected()) {
                return await this.azureSQL.getMetrics();
            } else {
                // Return offline metrics
                const offlineInvoices = await this.getOfflineInvoices();
                return {
                    totalInvoices: offlineInvoices.length,
                    pendingSyncCount: offlineInvoices.filter(i => i.syncStatus === 'pending').length,
                    syncedCount: offlineInvoices.filter(i => i.syncStatus === 'synced').length,
                    failedSyncCount: offlineInvoices.filter(i => i.syncStatus === 'failed').length,
                    averageResponseTime: 0,
                    connectionUptime: 0
                };
            }
        } catch (error) {
            console.error('❌ Error getting metrics:', error);
            return {
                totalInvoices: 0,
                pendingSyncCount: 0,
                syncedCount: 0,
                failedSyncCount: 0,
                averageResponseTime: 0,
                connectionUptime: 0
            };
        }
    }

    /**
     * Check if service is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }
}

export default DatabaseService;

// Export convenience functions for easier integration
export const dbService = DatabaseService.getInstance();

export const {
    createInvoice,
    getInvoices,
    getInvoice,
    updateInvoice,
    deleteInvoice,
    syncOfflineDataToAzure,
    testConnection,
    getConnectionStatus,
    getMetrics
} = dbService;
