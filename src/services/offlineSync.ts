import { envConfig } from '../config/env';
import { BatchSyncOptions, InvoiceRecord, SyncResult } from '../types/database';
import { ZATCAInvoice } from '../types/zatca';
import { AzureSQLService } from './azureSQL';

export class OfflineSyncService {
    private static instance: OfflineSyncService;
    private dbService: AzureSQLService;
    private syncInterval: NodeJS.Timeout | null = null;
    private isOnline: boolean = navigator.onLine;

    private constructor() {
        this.dbService = AzureSQLService.getInstance();
        this.initializeOnlineStatusMonitoring();
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): OfflineSyncService {
        if (!OfflineSyncService.instance) {
            OfflineSyncService.instance = new OfflineSyncService();
        }
        return OfflineSyncService.instance;
    }

    /**
     * Initialize online status monitoring
     */
    private initializeOnlineStatusMonitoring(): void {
        window.addEventListener('online', () => {
            console.log('📶 Connection restored, initiating sync...');
            this.isOnline = true;
            this.startAutoSync();
        });

        window.addEventListener('offline', () => {
            console.log('📵 Connection lost, switching to offline mode...');
            this.isOnline = false;
            this.stopAutoSync();
        });
    }

    /**
     * Start automatic sync process
     */
    public startAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        const syncIntervalMs = envConfig.SYNC_INTERVAL; // 5 minutes default

        this.syncInterval = setInterval(async () => {
            if (this.isOnline && this.dbService.isConnected()) {
                try {
                    await this.syncOfflineDataToAzure();
                } catch (error) {
                    console.error('❌ Auto-sync failed:', error);
                }
            }
        }, syncIntervalMs);

        console.log('🔄 Auto-sync started');
    }

    /**
     * Stop automatic sync process
     */
    public stopAutoSync(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        console.log('⏹️ Auto-sync stopped');
    }

    /**
     * Sync offline data to Azure SQL Database
     */
    public async syncOfflineDataToAzure(options?: BatchSyncOptions): Promise<SyncResult> {
        const batchOptions: BatchSyncOptions = {
            batchSize: envConfig.SYNC_BATCH_SIZE,
            maxRetries: 3,
            retryDelay: 1000,
            ...options
        };

        const result: SyncResult = {
            success: false,
            syncedCount: 0,
            failedCount: 0,
            errors: [],
            conflicts: [],
            timestamp: new Date()
        };

        try {
            console.log('🔄 Starting offline data sync to Azure...');

            // Check if online and database is connected
            if (!this.isOnline) {
                throw new Error('Device is offline');
            }

            if (!this.dbService.isConnected()) {
                await this.dbService.initDbConnection();
            }

            // Get offline invoices from IndexedDB
            const offlineInvoices = await this.getOfflineInvoices();

            if (offlineInvoices.length === 0) {
                console.log('✅ No offline invoices to sync');
                result.success = true;
                return result;
            }

            console.log(`📊 Found ${offlineInvoices.length} offline invoices to sync`);

            // Process in batches
            const batches = this.createBatches(offlineInvoices, batchOptions.batchSize);

            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`🔄 Processing batch ${i + 1}/${batches.length} (${batch.length} items)`);

                const batchResult = await this.processBatch(batch /* , batchOptions */);

                result.syncedCount += batchResult.syncedCount;
                result.failedCount += batchResult.failedCount;
                result.errors.push(...batchResult.errors);
                result.conflicts.push(...batchResult.conflicts);

                // Call progress callback
                if (batchOptions.onProgress) {
                    batchOptions.onProgress({
                        processed: (i + 1) * batchOptions.batchSize,
                        total: offlineInvoices.length,
                        errors: result.failedCount
                    });
                }

                // Call batch complete callback
                if (batchOptions.onBatchComplete) {
                    batchOptions.onBatchComplete(batch as InvoiceRecord[], batchResult);
                }

                // Small delay between batches to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            result.success = result.failedCount === 0;

            console.log(`✅ Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);

            return result;

        } catch (error) {
            console.error('❌ Sync failed:', error);
            result.errors.push(error instanceof Error ? error.message : 'Unknown error');
            return result;
        }
    }

    /**
     * Process a batch of invoices
     */
    private async processBatch(batch: ZATCAInvoice[] /* _: BatchSyncOptions */): Promise<SyncResult> {
        const result: SyncResult = {
            success: false,
            syncedCount: 0,
            failedCount: 0,
            errors: [],
            conflicts: [],
            timestamp: new Date()
        };

        for (const invoice of batch) {
            try {
                // Check if invoice already exists in cloud
                const existingInvoice = await this.dbService.getInvoice(invoice.id);

                if (existingInvoice) {
                    // Handle conflict
                    const conflict = await this.handleConflict(invoice, existingInvoice);
                    if (conflict) {
                        result.conflicts.push(conflict);
                        continue;
                    }
                }

                // Sync invoice to cloud
                await this.syncInvoiceToCloud(invoice);

                // Mark as synced in local storage
                await this.markInvoiceAsSynced(invoice.id);

                result.syncedCount++;

            } catch (error) {
                console.error(`❌ Failed to sync invoice ${invoice.id}:`, error);
                result.failedCount++;
                result.errors.push(`Invoice ${invoice.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);

                // Update local invoice with sync error
                await this.updateLocalInvoiceSyncError(invoice.id, error instanceof Error ? error.message : 'Unknown error');
            }
        }

        return result;
    }

    /**
     * Sync individual invoice to cloud
     */
    private async syncInvoiceToCloud(invoice: ZATCAInvoice): Promise<void> {
        try {
            // Check if invoice already exists
            const existingInvoice = await this.dbService.getInvoice(invoice.id);

            if (existingInvoice) {
                // Update existing invoice
                await this.dbService.updateInvoice(invoice.id, invoice);
            } else {
                // Create new invoice
                await this.dbService.createInvoice(invoice);
            }

            console.log(`✅ Invoice ${invoice.id} synced to cloud`);

        } catch (error) {
            console.error(`❌ Failed to sync invoice ${invoice.id} to cloud:`, error);
            throw error;
        }
    }

    /**
     * Handle conflicts between local and cloud invoices
     */
    private async handleConflict(localInvoice: ZATCAInvoice, cloudInvoice: InvoiceRecord): Promise<InvoiceRecord | null> {
        console.warn(`⚠️ Conflict detected for invoice ${localInvoice.id}`);

        // Simple conflict resolution: use latest timestamp
        const localTimestamp = new Date(localInvoice.issueDate + 'T' + localInvoice.issueTime);
        const cloudTimestamp = cloudInvoice.updatedAt;

        if (localTimestamp > cloudTimestamp) {
            // Local is newer, update cloud
            await this.dbService.updateInvoice(localInvoice.id, localInvoice);
            return null;
        } else {
            // Cloud is newer, return conflict for manual resolution
            return cloudInvoice;
        }
    }

    /**
     * Get offline invoices from IndexedDB
     */
    private async getOfflineInvoices(): Promise<ZATCAInvoice[]> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readonly');
                const store = transaction.objectStore('invoices');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = () => {
                    interface RawInvoiceData {
                        synced?: boolean;
                        syncError?: string;
                        [key: string]: unknown;
                    }

                    const allInvoices = getAllRequest.result;
                    // Filter for non-synced invoices
                    const offlineInvoices = allInvoices.filter((invoice: RawInvoiceData) =>
                        !invoice.synced && !invoice.syncError
                    );
                    resolve(offlineInvoices);
                };

                getAllRequest.onerror = () => reject(getAllRequest.error);
            };

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains('invoices')) {
                    const store = db.createObjectStore('invoices', { keyPath: 'id' });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('issueDate', 'issueDate', { unique: false });
                }
            };
        });
    }

    /**
     * Mark invoice as synced in local storage
     */
    private async markInvoiceAsSynced(invoiceId: string): Promise<void> {
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
                        invoice.synced = true;
                        invoice.syncedAt = new Date().toISOString();
                        delete invoice.syncError;

                        const updateRequest = store.put(invoice);
                        updateRequest.onsuccess = () => resolve();
                        updateRequest.onerror = () => reject(updateRequest.error);
                    } else {
                        resolve();
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update local invoice with sync error
     */
    private async updateLocalInvoiceSyncError(invoiceId: string, error: string): Promise<void> {
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
                        invoice.syncError = error;
                        invoice.lastSyncAttempt = new Date().toISOString();

                        const updateRequest = store.put(invoice);
                        updateRequest.onsuccess = () => resolve();
                        updateRequest.onerror = () => reject(updateRequest.error);
                    } else {
                        resolve();
                    }
                };

                getRequest.onerror = () => reject(getRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Store invoice offline in IndexedDB
     */
    public async storeInvoiceOffline(invoice: ZATCAInvoice): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readwrite');
                const store = transaction.objectStore('invoices');

                const invoiceWithMeta = {
                    ...invoice,
                    synced: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                const addRequest = store.put(invoiceWithMeta);
                addRequest.onsuccess = () => {
                    console.log(`💾 Invoice ${invoice.id} stored offline`);
                    resolve();
                };
                addRequest.onerror = () => reject(addRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get offline invoice count
     */
    public async getOfflineInvoiceCount(): Promise<number> {
        try {
            const offlineInvoices = await this.getOfflineInvoices();
            return offlineInvoices.length;
        } catch (error) {
            console.error('❌ Error getting offline invoice count:', error);
            return 0;
        }
    }

    /**
     * Clear synced invoices from local storage
     */
    public async clearSyncedInvoices(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('ZATCAInvoices', 1);

            request.onsuccess = () => {
                const db = request.result;
                const transaction = db.transaction(['invoices'], 'readwrite');
                const store = transaction.objectStore('invoices');

                const getAllRequest = store.getAll();
                getAllRequest.onsuccess = () => {
                    interface RawInvoiceData {
                        synced?: boolean;
                        id: string;
                        [key: string]: unknown;
                    }

                    const allInvoices = getAllRequest.result;
                    const syncedInvoices = allInvoices.filter((invoice: RawInvoiceData) => invoice.synced);

                    const deletePromises = syncedInvoices.map((invoice: RawInvoiceData) =>
                        new Promise<void>((resolveDelete, rejectDelete) => {
                            const deleteRequest = store.delete(invoice.id);
                            deleteRequest.onsuccess = () => resolveDelete();
                            deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
                        })
                    );

                    Promise.all(deletePromises)
                        .then(() => {
                            console.log(`🗑️ Cleared ${syncedInvoices.length} synced invoices`);
                            resolve();
                        })
                        .catch(reject);
                };

                getAllRequest.onerror = () => reject(getAllRequest.error);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Create batches from array
     */
    private createBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Get sync status
     */
    public getSyncStatus(): {
        isOnline: boolean;
        isConnected: boolean;
        autoSyncActive: boolean;
    } {
        return {
            isOnline: this.isOnline,
            isConnected: this.dbService.isConnected(),
            autoSyncActive: this.syncInterval !== null
        };
    }

    /**
     * Force sync now
     */
    public async forceSyncNow(): Promise<SyncResult> {
        console.log('🔄 Force sync initiated...');
        return await this.syncOfflineDataToAzure();
    }
}

export default OfflineSyncService;
