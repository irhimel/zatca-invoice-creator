// src/services/quoteService.ts

import { Quote, QuoteFilters, QuoteFormData, QuoteSort, QuoteStats } from '../types/quote';
import { storageService } from './storageService';

interface QuoteStorageRecord {
    type: string;
    quoteData?: Quote;
    [key: string]: unknown;
}

export class QuoteService {
    private storage = storageService;

    constructor() {
        this.storage.initialize().catch(console.error);
    }

    async createQuote(quoteData: QuoteFormData): Promise<Quote> {
        try {
            const quote: Quote = {
                id: crypto.randomUUID(),
                quoteNumber: this.generateQuoteNumber(),
                issueDate: new Date(),
                validUntil: quoteData.validUntil,
                status: 'draft',
                clientId: quoteData.clientId,
                clientName: '', // Will be populated from client data
                clientEmail: '', // Will be populated from client data
                title: quoteData.title,
                description: quoteData.description,
                notes: quoteData.notes,
                termsAndConditions: quoteData.termsAndConditions,
                items: quoteData.items,
                subtotal: this.calculateSubtotal(quoteData.items),
                taxAmount: this.calculateTaxAmount(quoteData.items),
                discountAmount: this.calculateDiscountAmount(quoteData.items),
                totalAmount: this.calculateTotal(quoteData.items),
                currency: quoteData.currency,
                approvalRequired: quoteData.approvalRequired,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Calculate totals
            await this.saveQuote(quote);
            return quote;
        } catch (error) {
            console.error('Error creating quote:', error);
            throw new Error('Failed to create quote');
        }
    }

    async updateQuote(id: string, updates: Partial<QuoteFormData>): Promise<Quote> {
        try {
            const existing = await this.getQuote(id);
            if (!existing) {
                throw new Error('Quote not found');
            }

            const updatedQuote: Quote = {
                ...existing,
                ...updates,
                updatedAt: new Date()
            };

            // Recalculate totals if items changed
            if (updates.items) {
                updatedQuote.subtotal = this.calculateSubtotal(updates.items);
                updatedQuote.taxAmount = this.calculateTaxAmount(updates.items);
                updatedQuote.discountAmount = this.calculateDiscountAmount(updates.items);
                updatedQuote.totalAmount = this.calculateTotal(updates.items);
            }

            await this.saveQuote(updatedQuote);
            return updatedQuote;
        } catch (error) {
            console.error('Error updating quote:', error);
            throw new Error('Failed to update quote');
        }
    }

    async deleteQuote(id: string): Promise<void> {
        try {
            await this.storage.updateRecord(`quote_${id}`, {
                isDeleted: true,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error deleting quote:', error);
            throw new Error('Failed to delete quote');
        }
    }

    async getQuote(id: string): Promise<Quote | null> {
        try {
            const record = await this.storage.getRecord(`quote_${id}`) as QuoteStorageRecord | null;
            return record?.type === 'quote' ? record.quoteData || null : null;
        } catch (error) {
            console.error('Error getting quote:', error);
            return null;
        }
    }

    async getQuotes(
        filters?: QuoteFilters,
        sort?: QuoteSort,
        limit?: number,
        offset?: number
    ): Promise<{ quotes: Quote[]; total: number }> {
        try {
            const allQuotes = await this.getAllQuotesFromDB();

            let filteredQuotes = this.applyFilters(allQuotes, filters);

            if (sort) {
                filteredQuotes = this.applySort(filteredQuotes, sort);
            }

            const total = filteredQuotes.length;

            if (limit || offset) {
                const start = offset || 0;
                const end = limit ? start + limit : undefined;
                filteredQuotes = filteredQuotes.slice(start, end);
            }

            return { quotes: filteredQuotes, total };
        } catch (error) {
            console.error('Error getting quotes:', error);
            return { quotes: [], total: 0 };
        }
    }

    async updateQuoteStatus(
        id: string,
        status: Quote['status'],
        additionalData?: {
            approvedBy?: string;
            rejectionReason?: string;
            convertedToInvoiceId?: string;
        }
    ): Promise<Quote> {
        try {
            const quote = await this.getQuote(id);
            if (!quote) {
                throw new Error('Quote not found');
            }

            const updates: Partial<Quote> = {
                status,
                updatedAt: new Date()
            };

            if (status === 'accepted' && additionalData?.approvedBy) {
                updates.approvedBy = additionalData.approvedBy;
                updates.approvedAt = new Date();
            }

            if (status === 'rejected' && additionalData?.rejectionReason) {
                updates.rejectionReason = additionalData.rejectionReason;
            }

            if (status === 'converted' && additionalData?.convertedToInvoiceId) {
                updates.convertedToInvoiceId = additionalData.convertedToInvoiceId;
                updates.convertedAt = new Date();
            }

            const updatedQuote = { ...quote, ...updates };
            await this.saveQuote(updatedQuote);
            return updatedQuote;
        } catch (error) {
            console.error('Error updating quote status:', error);
            throw new Error('Failed to update quote status');
        }
    }

    async convertQuoteToInvoice(quoteId: string): Promise<{ invoiceId: string; quote: Quote }> {
        try {
            const quote = await this.getQuote(quoteId);
            if (!quote) {
                throw new Error('Quote not found');
            }

            if (quote.status !== 'accepted') {
                throw new Error('Quote must be accepted before conversion');
            }

            // Generate invoice data from quote
            const invoiceId = crypto.randomUUID();

            // Update quote status
            const updatedQuote = await this.updateQuoteStatus(quoteId, 'converted', {
                convertedToInvoiceId: invoiceId
            });

            return { invoiceId, quote: updatedQuote };
        } catch (error) {
            console.error('Error converting quote to invoice:', error);
            throw new Error('Failed to convert quote to invoice');
        }
    }

    async getQuoteStats(): Promise<QuoteStats> {
        try {
            const { quotes } = await this.getQuotes();

            const total = quotes.length;
            const totalAmount = quotes.reduce((sum, quote) => sum + quote.totalAmount, 0);
            const averageAmount = total > 0 ? totalAmount / total : 0;

            const statusBreakdown = quotes.reduce((acc, quote) => {
                acc[quote.status] = (acc[quote.status] || 0) + 1;
                return acc;
            }, {} as Record<Quote['status'], number>);

            const convertedCount = quotes.filter(q => q.status === 'converted').length;
            const conversionRate = total > 0 ? (convertedCount / total) * 100 : 0;

            // Mock monthly trend data
            const monthlyTrend = [
                { month: 'Jan', count: 12, amount: 45000, conversions: 8 },
                { month: 'Feb', count: 15, amount: 52000, conversions: 10 },
                { month: 'Mar', count: 18, amount: 61000, conversions: 12 }
            ];

            return {
                total,
                totalAmount,
                averageAmount,
                statusBreakdown,
                conversionRate,
                monthlyTrend
            };
        } catch (error) {
            console.error('Error getting quotes stats:', error);
            return {
                total: 0,
                totalAmount: 0,
                averageAmount: 0,
                conversionRate: 0,
                monthlyTrend: [],
                statusBreakdown: {} as Record<string, number>
            };
        }
    }

    private generateQuoteNumber(): string {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `QUO-${timestamp}-${random}`;
    }

    private calculateSubtotal(items: Quote['items']): number {
        return items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const discountAmount = itemSubtotal * (item.discount / 100);
            return sum + (itemSubtotal - discountAmount);
        }, 0);
    }

    private calculateTaxAmount(items: Quote['items']): number {
        return items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const discountAmount = itemSubtotal * (item.discount / 100);
            const taxableAmount = itemSubtotal - discountAmount;
            return sum + (taxableAmount * (item.taxRate / 100));
        }, 0);
    }

    private calculateDiscountAmount(items: Quote['items']): number {
        return items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            return sum + (itemSubtotal * (item.discount / 100));
        }, 0);
    }

    private calculateTotal(items: Quote['items']): number {
        const subtotal = this.calculateSubtotal(items);
        const taxAmount = this.calculateTaxAmount(items);
        return subtotal + taxAmount;
    }

    private async saveQuote(quote: Quote): Promise<void> {
        const record = {
            id: `quote_${quote.id}`,
            type: 'quote' as const,
            quoteData: quote,
            createdAt: quote.createdAt,
            updatedAt: quote.updatedAt,
            version: 1,
            isDeleted: false,
            syncStatus: 'pending' as const
        };

        await this.storage.saveRecord(record);
    }

    private async getAllQuotesFromDB(): Promise<Quote[]> {
        try {
            const records = await this.storage.getRecordsByType('quote');
            return records
                .filter(r => !r.isDeleted)
                .map(r => (r as unknown as QuoteStorageRecord).quoteData as Quote)
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        } catch (error) {
            console.error('Error getting all quotes:', error);
            return [];
        }
    }

    private applyFilters(quotes: Quote[], filters?: QuoteFilters): Quote[] {
        if (!filters) return quotes;

        return quotes.filter(quote => {
            // Search filter
            if (filters.search) {
                const search = filters.search.toLowerCase();
                const searchFields = [
                    quote.quoteNumber,
                    quote.title,
                    quote.clientName,
                    quote.clientEmail,
                    quote.description
                ].filter(Boolean);

                if (!searchFields.some(field =>
                    field?.toLowerCase().includes(search)
                )) {
                    return false;
                }
            }

            // Status filter
            if (filters.status && quote.status !== filters.status) {
                return false;
            }

            // Client filter
            if (filters.clientId && quote.clientId !== filters.clientId) {
                return false;
            }

            // Date filters
            if (filters.dateFrom && quote.issueDate < filters.dateFrom) {
                return false;
            }
            if (filters.dateTo && quote.issueDate > filters.dateTo) {
                return false;
            }

            // Valid until filters
            if (filters.validUntilFrom && quote.validUntil < filters.validUntilFrom) {
                return false;
            }
            if (filters.validUntilTo && quote.validUntil > filters.validUntilTo) {
                return false;
            }

            // Amount filters
            if (filters.amountMin !== undefined && quote.totalAmount < filters.amountMin) {
                return false;
            }
            if (filters.amountMax !== undefined && quote.totalAmount > filters.amountMax) {
                return false;
            }

            // Currency filter
            if (filters.currency && quote.currency !== filters.currency) {
                return false;
            }

            // Approval status filter
            if (filters.approvalStatus) {
                if (filters.approvalStatus === 'pending' && quote.approvalRequired && !quote.approvedBy) {
                    // Keep it
                } else if (filters.approvalStatus === 'approved' && quote.approvedBy) {
                    // Keep it
                } else if (filters.approvalStatus === 'rejected' && quote.rejectionReason) {
                    // Keep it
                } else {
                    return false;
                }
            }

            return true;
        });
    }

    private applySort(quotes: Quote[], sort: QuoteSort): Quote[] {
        return [...quotes].sort((a, b) => {
            let aValue: string | number | Date;
            let bValue: string | number | Date;

            switch (sort.field) {
                case 'quoteNumber':
                    aValue = a.quoteNumber;
                    bValue = b.quoteNumber;
                    break;
                case 'clientName':
                    aValue = a.clientName.toLowerCase();
                    bValue = b.clientName.toLowerCase();
                    break;
                case 'issueDate':
                    aValue = a.issueDate.getTime();
                    bValue = b.issueDate.getTime();
                    break;
                case 'validUntil':
                    aValue = a.validUntil.getTime();
                    bValue = b.validUntil.getTime();
                    break;
                case 'totalAmount':
                    aValue = a.totalAmount;
                    bValue = b.totalAmount;
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
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

export const quoteService = new QuoteService();

// Future use function for getting latest quote number
// const getLatestQuoteNumber = async (): Promise<number> => {
//     try {
//         const quotes = await getAllQuotes();
//         if (quotes.length === 0) return 0;

//         const numbers = quotes
//             .map((quote: Quote) => {
//                 const match = quote.quoteNumber.match(/\d+$/);
//                 return match ? parseInt(match[0], 10) : 0;
//             })
//             .filter((num: number) => !isNaN(num));

//         return Math.max(...numbers, 0);
//     } catch (error) {
//         console.error('Error getting latest quote number:', error);
//         return 0;
//     }
// };
