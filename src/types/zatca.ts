// Input types for ZATCA invoice creation
export interface ZATCASupplierInput {
    id?: string;
    name: string;
    nameAr?: string;
    vatNumber: string;
    crNumber: string;
    address: {
        street: string;
        additionalStreet?: string;
        buildingNumber: string;
        plotIdentification?: string;
        citySubdivision?: string;
        cityName: string;
        postalZone: string;
        countrySubentity: string;
        countryCode?: string;
    };
}

export interface ZATCACustomerInput {
    name: string;
    vatNumber?: string;
    address?: {
        street?: string;
        cityName?: string;
        countryCode?: string;
    };
}

export interface ZATCAInvoiceItemInput {
    description: string;
    descriptionAr?: string;
    quantity: number;
    unitPrice: number;
    taxRate: number; // e.g. 0.15 for 15%
}

export interface ZATCASimplifiedInvoiceInput {
    supplier: ZATCASupplierInput;
    customer?: ZATCACustomerInput;
    items: ZATCAInvoiceItemInput[];
}
export interface ZATCAInvoice {
    id: string;
    uuid: string;
    issueDate: string;
    issueTime: string;
    invoiceTypeCode: string;
    documentCurrencyCode: string;
    taxCurrencyCode: string;

    // Invoice Counter & Hash
    invoiceCounterValue: number;
    previousInvoiceHash: string;

    // Supplier (Seller) Information
    supplier: {
        id: string;
        scheme: string;
        name: string;
        nameAr: string;
        vatNumber: string;
        crNumber: string;
        address: {
            street: string;
            additionalStreet?: string;
            buildingNumber: string;
            plotIdentification?: string;
            citySubdivision?: string;
            cityName: string;
            postalZone: string;
            countrySubentity: string;
            countryCode: string;
        };
    };

    // Customer Information (for B2C, minimal)
    customer?: {
        name?: string;
        vatNumber?: string;
        address?: {
            street?: string;
            cityName?: string;
            countryCode: string;
        };
    };

    // Invoice Lines
    invoiceLines: Array<{
        id: string;
        invoicedQuantity: number;
        lineExtensionAmount: number;
        item: {
            name: string;
            nameAr?: string;
            classifiedTaxCategory: {
                id: string;
                percent: number;
                taxScheme: string;
            };
        };
        price: {
            priceAmount: number;
            baseQuantity: number;
        };
        taxTotal: {
            taxAmount: number;
            taxSubtotal: {
                taxableAmount: number;
                taxAmount: number;
                taxCategory: {
                    id: string;
                    percent: number;
                    taxScheme: string;
                };
            };
        };
    }>;

    // Tax Totals
    taxTotal: {
        taxAmount: number;
        taxSubtotals: Array<{
            taxableAmount: number;
            taxAmount: number;
            taxCategory: {
                id: string;
                percent: number;
                taxScheme: string;
            };
        }>;
    };

    // Legal Monetary Total
    legalMonetaryTotal: {
        lineExtensionAmount: number;
        taxExclusiveAmount: number;
        taxInclusiveAmount: number;
        allowanceTotalAmount?: number;
        prepaidAmount?: number;
        payableAmount: number;
    };

    // Cryptographic Stamp
    cryptographicStamp?: {
        digitalSignature: string;
        publicKey: string;
        signatureTimestamp: string;
    };

    // QR Code
    qrCode?: string;

    // Status
    status: 'draft' | 'signed' | 'reported' | 'cleared';
    reportedAt?: string;
    clearedAt?: string;
}

export interface TLVData {
    tag: number;
    length: number;
    value: string | Uint8Array;
}

export interface QRCodeBasicData {
    sellerName: string;
    vatNumber: string;
    timestamp: string;
    invoiceTotal: string;
    vatTotal: string;
}

export interface QRCodeData {
    sellerName: string;
    vatNumber: string;
    timestamp: string;
    invoiceTotal: number;
    vatTotal: number;
}

export interface ZATCASettings {
    environment: 'sandbox' | 'production';
    certificatePath: string;
    privateKeyPath: string;
    csrConfig: {
        commonName: string;
        serialNumber: string;
        organizationIdentifier: string;
        organizationUnitName: string;
        organizationName: string;
        countryName: string;
        invoiceType: string;
        location: string;
        industry: string;
    };
    apiEndpoints: {
        compliance: string;
        reporting: string;
        clearance: string;
    };
}

export interface OfflineInvoiceQueue {
    id: string;
    invoice: ZATCAInvoice;
    operation: 'report' | 'clear';
    createdAt: string;
    attempts: number;
    lastAttemptAt?: string;
    error?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface ProcessedInvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    total: number;
}
