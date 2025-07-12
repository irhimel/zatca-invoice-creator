import { OfflineInvoiceQueue, ZATCAInvoice } from '../../types/zatca';

export class ZATCAOfflineQueue {
    private static readonly STORAGE_KEY = 'zatca_offline_queue';
    private static readonly MAX_RETRY_ATTEMPTS = 3;
    private static readonly RETRY_DELAY = 5000; // 5 seconds

    /**
     * Add invoice to offline queue
     */
    static addToQueue(invoice: ZATCAInvoice, operation: 'report' | 'clear'): void {
        try {
            const queue = this.getQueue();
            const queueItem: OfflineInvoiceQueue = {
                id: `${invoice.uuid}_${operation}_${Date.now()}`,
                invoice,
                operation,
                createdAt: new Date().toISOString(),
                attempts: 0,
                status: 'pending'
            };

            queue.push(queueItem);
            this.saveQueue(queue);

            console.log(`Invoice ${invoice.uuid} added to offline queue for ${operation}`);
        } catch (error) {
            console.error('Error adding invoice to queue:', error);
        }
    }

    /**
     * Get offline queue
     */
    static getQueue(): OfflineInvoiceQueue[] {
        try {
            const queueData = localStorage.getItem(this.STORAGE_KEY);
            return queueData ? JSON.parse(queueData) : [];
        } catch (error) {
            console.error('Error loading offline queue:', error);
            return [];
        }
    }

    /**
     * Save queue to localStorage
     */
    private static saveQueue(queue: OfflineInvoiceQueue[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('Error saving offline queue:', error);
        }
    }

    /**
     * Get pending items from queue
     */
    static getPendingItems(): OfflineInvoiceQueue[] {
        const queue = this.getQueue();
        return queue.filter(item => item.status === 'pending' || item.status === 'failed');
    }

    /**
     * Mark item as processing
     */
    static markAsProcessing(itemId: string): void {
        const queue = this.getQueue();
        const item = queue.find(q => q.id === itemId);
        if (item) {
            item.status = 'processing';
            item.attempts += 1;
            item.lastAttemptAt = new Date().toISOString();
            this.saveQueue(queue);
        }
    }

    /**
     * Mark item as completed
     */
    static markAsCompleted(itemId: string): void {
        const queue = this.getQueue();
        const item = queue.find(q => q.id === itemId);
        if (item) {
            item.status = 'completed';
            this.saveQueue(queue);
        }
    }

    /**
     * Mark item as failed
     */
    static markAsFailed(itemId: string, error: string): void {
        const queue = this.getQueue();
        const item = queue.find(q => q.id === itemId);
        if (item) {
            item.status = 'failed';
            item.error = error;
            this.saveQueue(queue);
        }
    }

    /**
     * Remove completed items older than specified days
     */
    static cleanupCompletedItems(daysOld: number = 30): void {
        try {
            const queue = this.getQueue();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const filteredQueue = queue.filter(item => {
                if (item.status === 'completed') {
                    const createdDate = new Date(item.createdAt);
                    return createdDate > cutoffDate;
                }
                return true;
            });

            this.saveQueue(filteredQueue);
            console.log(`Cleaned up ${queue.length - filteredQueue.length} completed items`);
        } catch (error) {
            console.error('Error cleaning up queue:', error);
        }
    }

    /**
     * Get queue statistics
     */
    static getQueueStats(): {
        total: number;
        pending: number;
        processing: number;
        completed: number;
        failed: number;
    } {
        const queue = this.getQueue();
        return {
            total: queue.length,
            pending: queue.filter(item => item.status === 'pending').length,
            processing: queue.filter(item => item.status === 'processing').length,
            completed: queue.filter(item => item.status === 'completed').length,
            failed: queue.filter(item => item.status === 'failed').length
        };
    }

    /**
     * Process offline queue
     */
    static async processQueue(): Promise<void> {
        const pendingInvoices = await this.getPendingItems();

        for (const _queueItem of pendingInvoices) {
            try {
                // Future: Process individual invoice
                console.log(`Processing queued invoice: ${_queueItem.id}`);
            } catch (error) {
                console.error(`Failed to process invoice ${_queueItem.id}:`, error);
            }
        }
    }

    async retryFailedInvoices(): Promise<void> {
        const queue = ZATCAOfflineQueue.getQueue();
        const failedInvoices = queue.filter(item => item.status === 'failed');

        for (const _queueItem of failedInvoices) {
            try {
                // Future: Retry failed invoice
                console.log(`Retrying failed invoice: ${_queueItem.id}`);
            } catch (error) {
                console.error(`Failed to retry invoice ${_queueItem.id}:`, error);
            }
        }
    }

    /**
     * Report invoice to ZATCA
     */
    private static async reportInvoice(/* _invoice: ZATCAInvoice */): Promise<void> {
        // In a real implementation, this would make an API call to ZATCA
        // For now, simulate the API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.2) { // 80% success rate
                    resolve();
                } else {
                    reject(new Error('ZATCA API error'));
                }
            }, 1000);
        });
    }

    /**
     * Clear invoice with ZATCA
     */
    private static async clearInvoice(/* _invoice: ZATCAInvoice */): Promise<void> {
        // In a real implementation, this would make an API call to ZATCA
        // For now, simulate the API call
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (Math.random() > 0.3) { // 70% success rate
                    resolve();
                } else {
                    reject(new Error('ZATCA clearance error'));
                }
            }, 1500);
        });
    }

    /**
     * Start automatic queue processing
     */
    static startQueueProcessor(intervalMs: number = 30000): void {
        setInterval(async () => {
            try {
                await this.processQueue();
            } catch (error) {
                console.error('Queue processing error:', error);
            }
        }, intervalMs);

        console.log('Queue processor started');
    }

    /**
     * Check if invoices are overdue for reporting
     */
    static getOverdueInvoices(): OfflineInvoiceQueue[] {
        const queue = this.getQueue();
        const now = new Date();
        const overdueThreshold = 24 * 60 * 60 * 1000; // 24 hours

        return queue.filter(item => {
            if (item.status === 'completed') return false;

            const createdDate = new Date(item.createdAt);
            return now.getTime() - createdDate.getTime() > overdueThreshold;
        });
    }

    /**
     * Export queue for audit purposes
     */
    static exportQueue(): string {
        const queue = this.getQueue();
        return JSON.stringify(queue, null, 2);
    }

    /**
     * Import queue from backup
     */
    static importQueue(queueData: string): void {
        try {
            const queue = JSON.parse(queueData);
            this.saveQueue(queue);
            console.log('Queue imported successfully');
        } catch (error) {
            console.error('Error importing queue:', error);
        }
    }
}
