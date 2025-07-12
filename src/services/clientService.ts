// src/services/clientService.ts

import { Client, ClientFilters, ClientFormData, ClientSort } from '../types/client';
import { storageService } from './storageService';

export class ClientService {
    private storage = storageService;

    constructor() {
        // Initialize storage
        this.storage.initialize().catch(console.error);
    }

    async createClient(clientData: ClientFormData): Promise<Client> {
        try {
            const client: Client = {
                id: crypto.randomUUID(),
                ...clientData,
                createdAt: new Date(),
                updatedAt: new Date(),
                totalInvoices: 0,
                totalAmount: 0
            };

            await this.storage.saveClient(client);
            return client;
        } catch (error) {
            console.error('Error creating client:', error);
            throw new Error('Failed to create client');
        }
    }

    async updateClient(id: string, updates: Partial<ClientFormData>): Promise<Client> {
        try {
            // Get existing client
            const existing = await this.getClient(id);
            if (!existing) {
                throw new Error('Client not found');
            }

            const updatedClient: Client = {
                ...existing,
                ...updates,
                updatedAt: new Date()
            };

            await this.storage.updateClient(id, updates);
            return updatedClient;
        } catch (error) {
            console.error('Error updating client:', error);
            throw new Error('Failed to update client');
        }
    }

    async deleteClient(id: string): Promise<void> {
        try {
            // Check if client has invoices
            const hasInvoices = await this.hasInvoices(/* id */);
            if (hasInvoices) {
                throw new Error('Cannot delete client with existing invoices');
            }

            await this.storage.deleteClient(id);
        } catch (error) {
            console.error('Error deleting client:', error);
            throw new Error('Failed to delete client');
        }
    }

    async getClient(id: string): Promise<Client | null> {
        try {
            return await this.storage.getClient(id);
        } catch (error) {
            console.error('Error getting client:', error);
            return null;
        }
    }

    async getClients(
        filters?: ClientFilters,
        sort?: ClientSort,
        limit?: number,
        offset?: number
    ): Promise<{ clients: Client[]; total: number }> {
        try {
            // This is a simplified implementation
            // In a real scenario, you'd query the database with proper filtering
            const allClients = await this.getAllClientsFromDB();

            let filteredClients = this.applyFilters(allClients, filters);

            if (sort) {
                filteredClients = this.applySort(filteredClients, sort);
            }

            const total = filteredClients.length;

            if (limit || offset) {
                const start = offset || 0;
                const end = limit ? start + limit : undefined;
                filteredClients = filteredClients.slice(start, end);
            }

            return { clients: filteredClients, total };
        } catch (error) {
            console.error('Error getting clients:', error);
            return { clients: [], total: 0 };
        }
    }

    async searchClients(query: string): Promise<Client[]> {
        try {
            const { clients } = await this.getClients({
                search: query
            });
            return clients;
        } catch (error) {
            console.error('Error searching clients:', error);
            return [];
        }
    }

    async getClientStats(/* _: string */): Promise<{
        totalInvoices: number;
        totalAmount: number;
        averageAmount: number;
        lastInvoiceDate?: Date;
        averagePaymentDays: number;
    }> {
        try {
            // This would typically query the invoices table with the client id
            // For now, returning mock data
            // TODO: Implement actual stats calculation using id parameter
            return {
                totalInvoices: 12,
                totalAmount: 45600.00,
                averageAmount: 3800.00,
                lastInvoiceDate: new Date(),
                averagePaymentDays: 15
            };
        } catch (error) {
            console.error('Error getting client stats:', error);
            return {
                totalInvoices: 0,
                totalAmount: 0,
                averageAmount: 0,
                averagePaymentDays: 0
            };
        }
    }

    private async getAllClientsFromDB(): Promise<Client[]> {
        try {
            return await this.storage.getAllClients();
        } catch (error) {
            console.error('Error getting all clients:', error);
            return [];
        }
    }

    private async hasInvoices(/* _: string */): Promise<boolean> {
        // Check if client has any invoices using clientId
        // This would query your invoices table
        // TODO: Implement actual invoice checking using clientId parameter
        return false;
    }

    private applyFilters(clients: Client[], filters?: ClientFilters): Client[] {
        if (!filters) return clients;

        return clients.filter(client => {
            // Search filter
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const searchFields = [
                    client.name,
                    client.nameAr,
                    client.email,
                    client.phone,
                    client.vatNumber,
                    client.commercialRegistration
                ].filter(Boolean);

                if (!searchFields.some(field =>
                    field?.toLowerCase().includes(search)
                )) {
                    return false;
                }
            }

            // Active status filter
            if (filters.isActive !== undefined && client.isActive !== filters.isActive) {
                return false;
            }

            // Currency filter
            if (filters.currency && client.currency !== filters.currency) {
                return false;
            }

            // VAT number filter
            if (filters.hasVatNumber !== undefined) {
                const hasVat = !!client.vatNumber;
                if (hasVat !== filters.hasVatNumber) {
                    return false;
                }
            }

            // Payment terms filter
            if (filters.paymentTermsMin !== undefined && client.paymentTerms < filters.paymentTermsMin) {
                return false;
            }
            if (filters.paymentTermsMax !== undefined && client.paymentTerms > filters.paymentTermsMax) {
                return false;
            }

            // Total amount filter
            if (filters.totalAmountMin !== undefined && (client.totalAmount || 0) < filters.totalAmountMin) {
                return false;
            }
            if (filters.totalAmountMax !== undefined && (client.totalAmount || 0) > filters.totalAmountMax) {
                return false;
            }

            // Date filters
            if (filters.createdAfter && client.createdAt < filters.createdAfter) {
                return false;
            }
            if (filters.createdBefore && client.createdAt > filters.createdBefore) {
                return false;
            }

            return true;
        });
    }

    private applySort(clients: Client[], sort: ClientSort): Client[] {
        return [...clients].sort((a, b) => {
            let aValue: string | number | Date;
            let bValue: string | number | Date;

            switch (sort.field) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'email':
                    aValue = a.email.toLowerCase();
                    bValue = b.email.toLowerCase();
                    break;
                case 'totalAmount':
                    aValue = a.totalAmount || 0;
                    bValue = b.totalAmount || 0;
                    break;
                case 'totalInvoices':
                    aValue = a.totalInvoices || 0;
                    bValue = b.totalInvoices || 0;
                    break;
                case 'createdAt':
                    aValue = a.createdAt.getTime();
                    bValue = b.createdAt.getTime();
                    break;
                case 'lastInvoiceDate':
                    aValue = a.lastInvoiceDate?.getTime() || 0;
                    bValue = b.lastInvoiceDate?.getTime() || 0;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) {
                return sort.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sort.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }
}

export const clientService = new ClientService();
