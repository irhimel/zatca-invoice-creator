// src/services/exportService.ts

import { Client } from '../types/client';
import { SimpleInvoice } from '../types/simpleInvoice';

export interface ExportHistoryEntry {
    id: string;
    date: Date;
    format: 'excel' | 'csv' | 'pdf';
    filename: string;
    recordCount: number;
    status: 'completed' | 'failed';
}

export type ExportData = SimpleInvoice | Client;

export interface ExportOptions {
    format: 'excel' | 'csv' | 'pdf';
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    includeClients?: boolean;
    includeInvoices?: boolean;
    includeReports?: boolean;
}

export interface ExportProgress {
    total: number;
    completed: number;
    status: 'preparing' | 'exporting' | 'completed' | 'error';
    currentStep: string;
    error?: string;
}

export class ExportService {
    private static instance: ExportService;

    public static getInstance(): ExportService {
        if (!ExportService.instance) {
            ExportService.instance = new ExportService();
        }
        return ExportService.instance;
    }

    async exportData(
        options: ExportOptions,
        onProgress?: (progress: ExportProgress) => void
    ): Promise<Blob> {
        const progress: ExportProgress = {
            total: 100,
            completed: 0,
            status: 'preparing',
            currentStep: 'Initializing export...'
        };

        try {
            if (onProgress) onProgress(progress);

            // Simulate progress updates
            await this.updateProgress(progress, 10, 'Collecting data...', onProgress);

            let data: ExportData[] = [];

            if (options.includeInvoices) {
                const invoices = await this.getInvoicesForExport(options.dateRange);
                data = [...data, ...invoices];
            }

            if (options.includeClients) {
                const clients = await this.getClientsForExport();
                data = [...data, ...clients];
            }

            await this.updateProgress(progress, 50, 'Processing data...', onProgress);

            // Generate the export based on format
            let blob: Blob;
            switch (options.format) {
                case 'csv':
                    blob = await this.generateCSV(data, options);
                    break;
                case 'excel':
                    blob = await this.generateExcel(data, options);
                    break;
                case 'pdf':
                    blob = await this.generatePDF(data, options);
                    break;
                default:
                    throw new Error('Unsupported export format');
            }

            await this.updateProgress(progress, 100, 'Export completed', onProgress);
            progress.status = 'completed';
            if (onProgress) onProgress(progress);

            // Log export history
            await this.logExportHistory(options);

            return blob;
        } catch (error) {
            progress.status = 'error';
            progress.error = error instanceof Error ? error.message : 'Unknown error';
            if (onProgress) onProgress(progress);
            throw error;
        }
    }

    private async updateProgress(
        progress: ExportProgress,
        completed: number,
        step: string,
        onProgress?: (progress: ExportProgress) => void
    ): Promise<void> {
        progress.completed = completed;
        progress.currentStep = step;
        if (onProgress) onProgress(progress);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    private async getInvoicesForExport(dateRange?: { startDate: Date; endDate: Date }): Promise<SimpleInvoice[]> {
        // This would typically fetch from your database
        // For now, returning mock data
        const mockInvoices: SimpleInvoice[] = [
            {
                id: '1',
                invoiceNumber: 'INV-001',
                clientId: 'client-1',
                clientName: 'ABC Corporation',
                clientEmail: 'contact@abc.com',
                clientVatNumber: '300123456789012',
                issueDate: new Date('2025-01-15'),
                dueDate: new Date('2025-02-15'),
                subtotal: 1300.00,
                taxAmount: 200.00,
                totalAmount: 1500.00,
                paidAmount: 1500.00,
                currency: 'SAR',
                status: 'paid',
                paymentStatus: 'paid',
                hasQRCode: true,
                isZATCACompliant: true,
                qrCodeData: 'mock-qr-code',
                description: 'Consulting Services',
                notes: 'Monthly consulting services',
                tags: ['consulting', 'monthly'],
                createdAt: new Date('2025-01-15'),
                updatedAt: new Date('2025-01-15')
            },
            {
                id: '2',
                invoiceNumber: 'INV-002',
                clientId: 'client-2',
                clientName: 'XYZ Trading',
                clientEmail: 'info@xyz.com',
                clientVatNumber: '300987654321098',
                issueDate: new Date('2025-01-20'),
                dueDate: new Date('2025-02-20'),
                subtotal: 2391.30,
                taxAmount: 358.70,
                totalAmount: 2750.00,
                paidAmount: 0,
                currency: 'SAR',
                status: 'sent',
                paymentStatus: 'pending',
                hasQRCode: true,
                isZATCACompliant: true,
                qrCodeData: 'mock-qr-code-2',
                description: 'Software License',
                notes: 'Annual software license',
                tags: ['software', 'license'],
                createdAt: new Date('2025-01-20'),
                updatedAt: new Date('2025-01-20')
            }
        ];

        // Apply date range filter if provided
        if (dateRange) {
            return mockInvoices.filter(invoice =>
                invoice.issueDate >= dateRange.startDate &&
                invoice.issueDate <= dateRange.endDate
            );
        }

        return mockInvoices;
    }

    private async getClientsForExport(): Promise<Client[]> {
        // This would typically fetch from your database
        // For now, returning mock data
        return [
            {
                id: '1',
                name: 'ABC Corporation',
                nameAr: 'شركة إيه بي سي',
                email: 'contact@abc.com',
                phone: '+966501234567',
                address: '123 Business District, Riyadh',
                addressAr: '123 الحي التجاري، الرياض',
                vatNumber: '300123456789012',
                commercialRegistration: '1010123456',
                contactPerson: 'Ahmed Al-Mansouri',
                contactPersonAr: 'أحمد المنصوري',
                paymentTerms: 30,
                creditLimit: 50000,
                currency: 'SAR',
                notes: 'Preferred client',
                notesAr: 'عميل مفضل',
                isActive: true,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2025-01-15'),
                totalInvoices: 15,
                totalAmount: 75000,
                lastInvoiceDate: new Date('2025-01-15'),
                averagePaymentDays: 25
            }
        ];
    }

    private async generateCSV(data: ExportData[], options: ExportOptions): Promise<Blob> {
        let csvContent = '';

        if (options.includeInvoices) {
            csvContent += 'INVOICES\n';
            csvContent += 'Invoice Number,Client Name,Issue Date,Due Date,Amount,Currency,Status\n';

            const invoices = data.filter(item => 'invoiceNumber' in item) as SimpleInvoice[];
            invoices.forEach(invoice => {
                const dueDate = invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : 'N/A';
                csvContent += `${invoice.invoiceNumber},${invoice.clientName},${invoice.issueDate.toISOString().split('T')[0]},${dueDate},${invoice.totalAmount},${invoice.currency},${invoice.status}\n`;
            });
            csvContent += '\n';
        }

        if (options.includeClients) {
            csvContent += 'CLIENTS\n';
            csvContent += 'Name,Email,Phone,VAT Number,Payment Terms,Total Amount,Status\n';

            const clients = data.filter(item => 'paymentTerms' in item) as Client[];
            clients.forEach(client => {
                csvContent += `${client.name},${client.email},${client.phone},${client.vatNumber || ''},${client.paymentTerms},${client.totalAmount || 0},${client.isActive ? 'Active' : 'Inactive'}\n`;
            });
        }

        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    }

    private async generateExcel(data: ExportData[], options: ExportOptions): Promise<Blob> {
        // For a real implementation, you would use a library like SheetJS (xlsx)
        // For now, we'll generate a CSV with .xlsx extension as a placeholder
        const csvBlob = await this.generateCSV(data, options);
        return new Blob([await csvBlob.arrayBuffer()], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    private async generatePDF(data: ExportData[], options: ExportOptions): Promise<Blob> {
        // For a real implementation, you would use jsPDF or similar
        // For now, creating a simple text-based PDF placeholder
        let pdfContent = 'ZATCA Invoice Export Report\n\n';

        if (options.includeInvoices) {
            pdfContent += 'INVOICES:\n';
            const invoices = data.filter(item => 'invoiceNumber' in item) as SimpleInvoice[];
            invoices.forEach(invoice => {
                pdfContent += `${invoice.invoiceNumber} - ${invoice.clientName} - ${invoice.totalAmount} ${invoice.currency}\n`;
            });
            pdfContent += '\n';
        }

        if (options.includeClients) {
            pdfContent += 'CLIENTS:\n';
            const clients = data.filter(item => 'paymentTerms' in item) as Client[];
            clients.forEach(client => {
                pdfContent += `${client.name} - ${client.email} - ${client.totalAmount || 0} ${client.currency}\n`;
            });
        }

        return new Blob([pdfContent], { type: 'application/pdf' });
    }

    private async logExportHistory(options: ExportOptions): Promise<void> {
        const historyEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            format: options.format,
            options: options,
            success: true
        };

        // Store in localStorage for now (would be database in real implementation)
        const history = JSON.parse(localStorage.getItem('exportHistory') || '[]');
        history.unshift(historyEntry);

        // Keep only last 50 entries
        if (history.length > 50) {
            history.splice(50);
        }

        localStorage.setItem('exportHistory', JSON.stringify(history));
    }

    async getExportHistory(): Promise<ExportHistoryEntry[]> {
        return JSON.parse(localStorage.getItem('exportHistory') || '[]');
    }

    downloadBlob(blob: Blob, filename: string): void {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

export const exportService = ExportService.getInstance();
