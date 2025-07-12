// ZATCA (Saudi Arabian Tax Authority) integration service
// Handles XML generation, QR code creation, and digital signing

import * as crypto from 'crypto';
import { InvoiceItem } from '../types';
import { ProcessedInvoiceItem } from '../types/zatca';

export interface ZATCAConfig {
    environment: 'sandbox' | 'production';
    apiBaseUrl: string;
    certificatePath: string;
    privateKeyPath: string;
    csrId?: string;
    otp?: string;
}

export interface InvoiceData {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    supplier: SupplierInfo;
    customer: CustomerInfo;
    items: LineItem[];
    totals: InvoiceTotals;
    payment?: PaymentInfo;
}

export interface SupplierInfo {
    vatNumber: string;
    name: string;
    address: AddressInfo;
    crNumber?: string;
}

export interface CustomerInfo {
    vatNumber?: string;
    name: string;
    address: AddressInfo;
    buyerIdType?: 'VAT' | 'CRN' | 'MOMRAH' | 'MHRSD' | 'PASSPORT' | 'IQAMA' | 'OTHER';
    buyerId?: string;
}

export interface AddressInfo {
    street: string;
    district: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface LineItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    totalAmount: number;
    discountAmount?: number;
}

export interface InvoiceTotals {
    subtotal: number;
    totalTaxAmount: number;
    totalAmount: number;
    totalDiscountAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
}

export interface PaymentInfo {
    method: 'CASH' | 'CREDIT' | 'BANK_TRANSFER' | 'OTHER';
    terms?: string;
}

export interface ZATCAResponse {
    success: boolean;
    invoiceHash?: string;
    qrCode?: string;
    clearanceStatus?: 'CLEARED' | 'NOT_CLEARED' | 'REPORTED';
    validationResults?: ValidationResult[];
    warningMessages?: string[];
    errorMessages?: string[];
}

export interface ValidationResult {
    type: 'ERROR' | 'WARNING' | 'INFO';
    code: string;
    message: string;
    field?: string;
}

export class ZATCAService {
    private config: ZATCAConfig;
    private _certificate: string = '';
    private _privateKey: string = '';

    constructor(config: ZATCAConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        try {
            // Load certificate and private key
            // In a real implementation, these would be loaded from files
            console.log('Loading ZATCA certificate from:', this.config.certificatePath);
            console.log('Loading ZATCA private key from:', this.config.privateKeyPath);

            // Mock certificate and key for development
            this._certificate = 'MOCK_CERTIFICATE_DATA';
            this._privateKey = 'MOCK_PRIVATE_KEY_DATA';
        } catch (error) {
            throw new Error(`Failed to initialize ZATCA service: ${error}`);
        }
    }

    async generateInvoiceXML(invoiceData: InvoiceData): Promise<string> {
        // Generate UBL 2.1 XML format required by ZATCA
        const xmlTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    
    <cbc:ID>${invoiceData.invoiceNumber}</cbc:ID>
    <cbc:IssueDate>${invoiceData.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${new Date().toISOString().split('T')[1].split('.')[0]}</cbc:IssueTime>
    <cbc:InvoiceTypeCode>388</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    
    <!-- Supplier Information -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:Name>${invoiceData.supplier.name}</cbc:Name>
            <cac:PostalAddress>
                <cbc:StreetName>${invoiceData.supplier.address.street}</cbc:StreetName>
                <cbc:CityName>${invoiceData.supplier.address.city}</cbc:CityName>
                <cbc:PostalZone>${invoiceData.supplier.address.postalCode}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>${invoiceData.supplier.address.country}</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoiceData.supplier.vatNumber}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <!-- Customer Information -->
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:Name>${invoiceData.customer.name}</cbc:Name>
            <cac:PostalAddress>
                <cbc:StreetName>${invoiceData.customer.address.street}</cbc:StreetName>
                <cbc:CityName>${invoiceData.customer.address.city}</cbc:CityName>
                <cbc:PostalZone>${invoiceData.customer.address.postalCode}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>${invoiceData.customer.address.country}</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            ${invoiceData.customer.vatNumber ? `
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoiceData.customer.vatNumber}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>` : ''}
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <!-- Invoice Lines -->
    ${invoiceData.items.map((item, index) => `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${item.totalAmount}</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Name>${item.name}</cbc:Name>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${item.unitPrice}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>`).join('')}
    
    <!-- Tax Total -->
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${invoiceData.totals.totalTaxAmount}</cbc:TaxAmount>
    </cac:TaxTotal>
    
    <!-- Legal Monetary Total -->
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${invoiceData.totals.subtotal}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${invoiceData.totals.subtotal}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${invoiceData.totals.totalAmount}</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="SAR">${invoiceData.totals.totalAmount}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
</Invoice>`;

        return xmlTemplate;
    }

    async signInvoiceXML(xmlContent: string): Promise<string> {
        // Create digital signature using private key
        const hash = crypto.createHash('sha256');
        hash.update(xmlContent);
        const xmlHash = hash.digest('hex');

        // In a real implementation, this would use the actual private key
        // to create a digital signature
        console.log('Signing invoice XML with hash:', xmlHash);

        // Mock signature for development
        const mockSignature = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
            <ds:SignedInfo>
                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"/>
                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
                <ds:Reference URI="">
                    <ds:Transforms>
                        <ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
                    </ds:Transforms>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue>${xmlHash}</ds:DigestValue>
                </ds:Reference>
            </ds:SignedInfo>
            <ds:SignatureValue>MOCK_SIGNATURE_VALUE</ds:SignatureValue>
        </ds:Signature>`;

        // Insert signature into XML
        const signedXml = xmlContent.replace('</Invoice>', `${mockSignature}</Invoice>`);
        return signedXml;
    }

    async generateQRCode(invoiceData: InvoiceData): Promise<string> {
        // Generate QR code according to ZATCA specifications
        const qrData = {
            seller: invoiceData.supplier.name,
            vatNumber: invoiceData.supplier.vatNumber,
            timestamp: invoiceData.issueDate,
            invoiceTotal: invoiceData.totals.totalAmount,
            vatTotal: invoiceData.totals.totalTaxAmount
        };

        // Convert to TLV (Tag-Length-Value) format as required by ZATCA
        const tlvData = this.encodeToTLV(qrData);

        // Base64 encode the TLV data
        const base64QR = Buffer.from(tlvData).toString('base64');

        console.log('Generated QR code data:', base64QR);
        return base64QR;
    }

    private encodeToTLV(data: Record<string, string | number>): string {
        // Mock TLV encoding - in production, this would follow ZATCA specifications
        const tlvString = Object.entries(data)
            .map(([key, value]) => `${key}:${value}`)
            .join('|');

        return tlvString;
    }

    async submitInvoice(xmlContent: string): Promise<ZATCAResponse> {
        try {
            // Submit to ZATCA API
            const endpoint = `${this.config.apiBaseUrl}/invoices/clearance/single`;

            console.log('Submitting invoice to ZATCA:', endpoint);
            console.log('XML content length:', xmlContent.length);

            // Mock API response for development
            const mockResponse: ZATCAResponse = {
                success: true,
                invoiceHash: crypto.createHash('sha256').update(xmlContent).digest('hex'),
                qrCode: await this.generateQRCode(JSON.parse('{"supplier":{"name":"Test","vatNumber":"123"},"totals":{"totalAmount":100,"totalTaxAmount":15},"issueDate":"2025-01-01"}')),
                clearanceStatus: 'CLEARED',
                validationResults: [],
                warningMessages: [],
                errorMessages: []
            };

            return mockResponse;
        } catch (error) {
            console.error('Error submitting invoice to ZATCA:', error);

            return {
                success: false,
                errorMessages: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    async reportInvoice(xmlContent: string): Promise<ZATCAResponse> {
        try {
            // Report to ZATCA API (for simplified invoices)
            const endpoint = `${this.config.apiBaseUrl}/invoices/reporting/single`;

            console.log('Reporting invoice to ZATCA:', endpoint);

            // Mock API response
            const mockResponse: ZATCAResponse = {
                success: true,
                invoiceHash: crypto.createHash('sha256').update(xmlContent).digest('hex'),
                qrCode: await this.generateQRCode(JSON.parse('{"supplier":{"name":"Test","vatNumber":"123"},"totals":{"totalAmount":100,"totalTaxAmount":15},"issueDate":"2025-01-01"}')),
                clearanceStatus: 'REPORTED',
                validationResults: [],
                warningMessages: [],
                errorMessages: []
            };

            return mockResponse;
        } catch (error) {
            console.error('Error reporting invoice to ZATCA:', error);

            return {
                success: false,
                errorMessages: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    async validateInvoice(invoiceData: InvoiceData): Promise<ValidationResult[]> {
        const results: ValidationResult[] = [];

        // Basic validation rules
        if (!invoiceData.supplier.vatNumber) {
            results.push({
                type: 'ERROR',
                code: 'MISSING_VAT_NUMBER',
                message: 'Supplier VAT number is required',
                field: 'supplier.vatNumber'
            });
        }

        if (!invoiceData.invoiceNumber) {
            results.push({
                type: 'ERROR',
                code: 'MISSING_INVOICE_NUMBER',
                message: 'Invoice number is required',
                field: 'invoiceNumber'
            });
        }

        if (invoiceData.items.length === 0) {
            results.push({
                type: 'ERROR',
                code: 'NO_ITEMS',
                message: 'At least one invoice item is required',
                field: 'items'
            });
        }

        // Validate totals
        const calculatedSubtotal = invoiceData.items.reduce((sum, item) => sum + item.totalAmount, 0);
        if (Math.abs(calculatedSubtotal - invoiceData.totals.subtotal) > 0.01) {
            results.push({
                type: 'WARNING',
                code: 'TOTALS_MISMATCH',
                message: 'Calculated subtotal does not match provided subtotal',
                field: 'totals.subtotal'
            });
        }

        return results;
    }

    private async processInvoiceItems(items: InvoiceItem[]): Promise<ProcessedInvoiceItem[]> {
        return items.map((item: InvoiceItem) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            total: item.total
        }));
    }
}

// Factory function to create ZATCA service instance
export function createZATCAService(config: ZATCAConfig): ZATCAService {
    return new ZATCAService(config);
}

// Default service instance
let defaultZATCAService: ZATCAService | null = null;

export function initializeZATCA(config: ZATCAConfig): Promise<ZATCAService> {
    defaultZATCAService = createZATCAService(config);
    return defaultZATCAService.initialize().then(() => defaultZATCAService!);
}

export function getZATCAService(): ZATCAService {
    if (!defaultZATCAService) {
        throw new Error('ZATCA service not initialized. Call initializeZATCA() first.');
    }
    return defaultZATCAService;
}
