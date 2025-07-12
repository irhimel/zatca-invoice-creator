// src/services/storageService.ts

import { Client } from '../types/client';
import { ClientRecord, StorageRecord } from '../types/storage';

/**
 * Generic storage service for handling different types of records
 */
export class StorageService {
    private static instance: StorageService;
    private dbName = 'InvoiceAppDB';
    private version = 1;
    private db: IDBDatabase | null = null;

    private constructor() { }

    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    async initialize(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(false);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(true);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create records store
                if (!db.objectStoreNames.contains('records')) {
                    const store = db.createObjectStore('records', { keyPath: 'id' });
                    store.createIndex('type', 'type', { unique: false });
                    store.createIndex('syncStatus', 'syncStatus', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                }
            };
        });
    }

    async saveRecord<T extends StorageRecord>(record: T): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.put(record);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getRecord<T extends StorageRecord>(id: string): Promise<T | null> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getRecordsByType<T extends StorageRecord>(type: T['type']): Promise<T[]> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const index = store.index('type');
            const request = index.getAll(type);

            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateRecord<T extends StorageRecord>(id: string, updates: Partial<T>): Promise<void> {
        const existing = await this.getRecord<T>(id);
        if (!existing) {
            throw new Error('Record not found');
        }

        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
            version: existing.version + 1,
            syncStatus: 'pending' as const
        };

        await this.saveRecord(updated);
    }

    async deleteRecord(id: string): Promise<void> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async searchRecords<T extends StorageRecord>(
        type: T['type'],
        searchFn: (record: T) => boolean
    ): Promise<T[]> {
        const records = await this.getRecordsByType<T>(type);
        return records.filter(searchFn);
    }

    async getRecordsCount(type?: StorageRecord['type']): Promise<number> {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');

            let request: IDBRequest;
            if (type) {
                const index = store.index('type');
                request = index.count(type);
            } else {
                request = store.count();
            }

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Client-specific methods
    async saveClient(client: Client): Promise<void> {
        const record: ClientRecord = {
            id: `client_${client.id}`,
            type: 'client',
            clientData: client,
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            version: 1,
            isDeleted: false,
            syncStatus: 'pending'
        };

        await this.saveRecord(record);
    }

    async getClient(id: string): Promise<Client | null> {
        const record = await this.getRecord<ClientRecord>(`client_${id}`);
        return record?.clientData || null;
    }

    async getAllClients(): Promise<Client[]> {
        const records = await this.getRecordsByType<ClientRecord>('client');
        return records
            .filter(r => !r.isDeleted)
            .map(r => r.clientData)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    async updateClient(id: string, updates: Partial<Client>): Promise<void> {
        const record = await this.getRecord<ClientRecord>(`client_${id}`);
        if (!record) {
            throw new Error('Client not found');
        }

        const updatedClient = {
            ...record.clientData,
            ...updates,
            updatedAt: new Date()
        };

        await this.updateRecord(`client_${id}`, {
            clientData: updatedClient
        });
    }

    async deleteClient(id: string): Promise<void> {
        await this.updateRecord(`client_${id}`, {
            isDeleted: true,
            updatedAt: new Date()
        });
    }
}

export const storageService = StorageService.getInstance();
