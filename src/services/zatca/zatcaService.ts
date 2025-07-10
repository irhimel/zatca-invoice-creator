import { ZATCAInvoice, ZATCASettings } from '../../types/zatca';
import { ZATCACryptographicStamp } from './cryptoStamp';
import { ZATCAOfflineQueue } from './offlineQueue';
import { ZATCAPDFGenerator } from './pdfGenerator';
import { ZATCAQRCodeGenerator } from './qrGenerator';
import { ZATCAUBLGenerator } from './ublGenerator';

export class ZATCAService {
    private settings: ZATCASettings;
    private invoiceCounter: number = 0;
    private previousInvoiceHash: string = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ=='; // Genesis hash

    constructor(settings: ZATCASettings) {
        this.settings = settings;
        this.initializeService();
    }

    /**
     * Initialize ZATCA service
     */
    private initializeService(): void {
        // Load invoice counter from storage
        const savedCounter = localStorage.getItem('zatca_invoice_counter');
        this.invoiceCounter = savedCounter ? parseInt(savedCounter) : 0;

        // Load previous invoice hash
        const savedHash = localStorage.getItem('zatca_previous_hash');
        if (savedHash) {
            this.previousInvoiceHash = savedHash;
        }

        // Start offline queue processor
        ZATCAOfflineQueue.startQueueProcessor();

        console.log('ZATCA service initialized');
    }

    /**
     * Generate simplified tax invoice
     */
    async generateSimplifiedInvoice(invoiceData: import('../../types/zatca').ZATCASimplifiedInvoiceInput): Promise<ZATCAInvoice> {
        try {
            // Increment counter
            this.invoiceCounter++;

            // Create base invoice structure
            const invoice: ZATCAInvoice = {
                id: `INV-${this.invoiceCounter.toString().padStart(6, '0')}`,
                uuid: this.generateUUID(),
                issueDate: new Date().toISOString().split('T')[0],
                issueTime: new Date().toISOString().split('T')[1].split('.')[0],
                invoiceTypeCode: '388', // Simplified tax invoice
                documentCurrencyCode: 'SAR',
                taxCurrencyCode: 'SAR',
                invoiceCounterValue: this.invoiceCounter,
                previousInvoiceHash: this.previousInvoiceHash,
                supplier: this.buildSupplierInfo(invoiceData.supplier),
                customer: invoiceData.customer ? this.buildCustomerInfo(invoiceData.customer) : undefined,
                invoiceLines: this.buildInvoiceLines(invoiceData.items),
                taxTotal: this.calculateTaxTotal(invoiceData.items),
                legalMonetaryTotal: this.calculateLegalMonetaryTotal(invoiceData.items),
                status: 'draft'
            };

            // Generate cryptographic stamp
            const cryptoStamp = await ZATCACryptographicStamp.generateCryptographicStamp(
                invoice,
                this.settings.certificatePath, // Private key path
                this.settings.certificatePath  // Public key path
            );
            invoice.cryptographicStamp = cryptoStamp;

            // Generate QR code
            invoice.qrCode = await ZATCAQRCodeGenerator.generateInvoiceQRCode(invoice);

            // Update hash for next invoice
            this.previousInvoiceHash = await ZATCACryptographicStamp.generateInvoiceHash(invoice);

            // Save state
            this.saveState();

            // Mark as signed
            invoice.status = 'signed';

            console.log('Simplified invoice generated:', invoice.id);
            return invoice;
        } catch (error) {
            console.error('Error generating simplified invoice:', error);
            throw new Error('Failed to generate simplified invoice');
        }
    }

    /**
     * Generate PDF invoice
     */
    async generatePDFInvoice(invoice: ZATCAInvoice): Promise<Blob> {
        try {
            const pdfBlob = await ZATCAPDFGenerator.generatePDFInvoice(invoice);
            console.log('PDF invoice generated for:', invoice.id);
            return pdfBlob;
        } catch (error) {
            console.error('Error generating PDF invoice:', error);
            throw new Error('Failed to generate PDF invoice');
        }
    }

    /**
     * Report invoice to ZATCA (offline queue)
     */
    async reportInvoice(invoice: ZATCAInvoice): Promise<void> {
        try {
            // Add to offline queue for reporting
            ZATCAOfflineQueue.addToQueue(invoice, 'report');

            // Update invoice status
            invoice.status = 'reported';
            invoice.reportedAt = new Date().toISOString();

            console.log('Invoice queued for reporting:', invoice.id);
        } catch (error) {
            console.error('Error reporting invoice:', error);
            throw new Error('Failed to report invoice');
        }
    }

    /**
     * Clear invoice with ZATCA (for B2B invoices)
     */
    async clearInvoice(invoice: ZATCAInvoice): Promise<void> {
        try {
            // Add to offline queue for clearance
            ZATCAOfflineQueue.addToQueue(invoice, 'clear');

            // Update invoice status
            invoice.status = 'cleared';
            invoice.clearedAt = new Date().toISOString();

            console.log('Invoice queued for clearance:', invoice.id);
        } catch (error) {
            console.error('Error clearing invoice:', error);
            throw new Error('Failed to clear invoice');
        }
    }

    /**
     * Validate invoice compliance
     */
    async validateInvoice(invoice: ZATCAInvoice): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Validate basic structure
            if (!invoice.id || !invoice.uuid) {
                errors.push('Missing invoice ID or UUID');
            }

            if (!invoice.supplier.vatNumber || invoice.supplier.vatNumber.length !== 15) {
                errors.push('Invalid VAT number');
            }

            if (!invoice.invoiceLines || invoice.invoiceLines.length === 0) {
                errors.push('No invoice lines found');
            }

            // Validate QR code
            if (!invoice.qrCode) {
                errors.push('Missing QR code');
            }

            // Validate cryptographic stamp
            const isValidStamp = await ZATCACryptographicStamp.validateCryptographicStamp(invoice);
            if (!isValidStamp) {
                errors.push('Invalid cryptographic stamp');
            }

            // Validate UBL XML
            const ublXML = ZATCAUBLGenerator.generateUBLXML(invoice);
            const isValidUBL = ZATCAUBLGenerator.validateUBLXML(ublXML);
            if (!isValidUBL) {
                errors.push('Invalid UBL XML structure');
            }

            // Check for warnings
            if (invoice.legalMonetaryTotal.taxInclusiveAmount > 1000) {
                warnings.push('High value invoice - consider additional verification');
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('Error validating invoice:', error);
            return {
                isValid: false,
                errors: ['Validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')],
                warnings
            };
        }
    }

    /**
     * Get offline queue statistics
     */
    getOfflineQueueStats() {
        return ZATCAOfflineQueue.getQueueStats();
    }

    /**
     * Get overdue invoices
     */
    getOverdueInvoices() {
        return ZATCAOfflineQueue.getOverdueInvoices();
    }

    /**
     * Process offline queue manually
     */
    async processOfflineQueue() {
        await ZATCAOfflineQueue.processQueue();
    }

    /**
     * Generate UUID
     */
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Build supplier information
     */
    private buildSupplierInfo(supplierData: import('../../types/zatca').ZATCASupplierInput) {
        return {
            id: supplierData.id || '1',
            scheme: 'CRN',
            name: supplierData.name,
            nameAr: supplierData.nameAr || supplierData.name,
            vatNumber: supplierData.vatNumber,
            crNumber: supplierData.crNumber,
            address: {
                street: supplierData.address.street,
                additionalStreet: supplierData.address.additionalStreet,
                buildingNumber: supplierData.address.buildingNumber,
                plotIdentification: supplierData.address.plotIdentification,
                citySubdivision: supplierData.address.citySubdivision,
                cityName: supplierData.address.cityName,
                postalZone: supplierData.address.postalZone,
                countrySubentity: supplierData.address.countrySubentity,
                countryCode: supplierData.address.countryCode || 'SA'
            }
        };
    }

    /**
     * Build customer information
     */
    private buildCustomerInfo(customerData: import('../../types/zatca').ZATCACustomerInput) {
        return {
            name: customerData.name,
            vatNumber: customerData.vatNumber,
            address: customerData.address ? {
                street: customerData.address.street,
                cityName: customerData.address.cityName,
                countryCode: customerData.address.countryCode || 'SA'
            } : undefined
        };
    }

    /**
     * Build invoice lines
     */
    private buildInvoiceLines(items: import('../../types/zatca').ZATCAInvoiceItemInput[]) {
        return items.map((item, index) => ({
            id: (index + 1).toString(),
            invoicedQuantity: item.quantity,
            lineExtensionAmount: item.quantity * item.unitPrice,
            item: {
                name: item.description,
                nameAr: item.descriptionAr || item.description,
                classifiedTaxCategory: {
                    id: 'S',
                    percent: item.taxRate * 100,
                    taxScheme: 'VAT'
                }
            },
            price: {
                priceAmount: item.unitPrice,
                baseQuantity: 1
            },
            taxTotal: {
                taxAmount: item.quantity * item.unitPrice * item.taxRate,
                taxSubtotal: {
                    taxableAmount: item.quantity * item.unitPrice,
                    taxAmount: item.quantity * item.unitPrice * item.taxRate,
                    taxCategory: {
                        id: 'S',
                        percent: item.taxRate * 100,
                        taxScheme: 'VAT'
                    }
                }
            }
        }));
    }

    /**
     * Calculate tax total
     */
    private calculateTaxTotal(items: import('../../types/zatca').ZATCAInvoiceItemInput[]) {
        const taxAmount = items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice * item.taxRate), 0);

        return {
            taxAmount,
            taxSubtotals: [{
                taxableAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                taxAmount,
                taxCategory: {
                    id: 'S',
                    percent: 15, // Standard VAT rate
                    taxScheme: 'VAT'
                }
            }]
        };
    }

    /**
     * Calculate legal monetary total
     */
    private calculateLegalMonetaryTotal(items: import('../../types/zatca').ZATCAInvoiceItemInput[]) {
        const lineExtensionAmount = items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = items.reduce((sum, item) =>
            sum + (item.quantity * item.unitPrice * item.taxRate), 0);

        return {
            lineExtensionAmount,
            taxExclusiveAmount: lineExtensionAmount,
            taxInclusiveAmount: lineExtensionAmount + taxAmount,
            payableAmount: lineExtensionAmount + taxAmount
        };
    }

    /**
     * Save service state
     */
    private saveState(): void {
        localStorage.setItem('zatca_invoice_counter', this.invoiceCounter.toString());
        localStorage.setItem('zatca_previous_hash', this.previousInvoiceHash);
    }

    /**
     * Reset service state (for testing)
     */
    resetState(): void {
        this.invoiceCounter = 0;
        this.previousInvoiceHash = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
        localStorage.removeItem('zatca_invoice_counter');
        localStorage.removeItem('zatca_previous_hash');
        console.log('ZATCA service state reset');
    }
}
