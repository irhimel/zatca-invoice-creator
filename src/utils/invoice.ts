/**
 * Invoice utilities and constants
 */

import { Invoice } from '../types';


export interface InvoiceData {
    customer: {
        name: string;
        email: string;
        phone: string;
        address: string;
        vatNumber: string;
    };
    items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        total: number;
    }>;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    notes: string;
    subtotal: number;
    totalTax: number;
    total: number;
}

export interface InvoiceFormData {
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
        vatNumber: string;
    };
    items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        total: number;
    }>;
    invoiceDetails: {
        invoiceNumber: string;
        issueDate: string;
        dueDate: string;
        notes: string;
    };
}

export interface InvoiceValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export const INVOICE_STATUSES = [
    { value: 'draft', label: 'Draft', color: 'gray' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'sent', label: 'Sent', color: 'blue' },
    { value: 'paid', label: 'Paid', color: 'green' },
    { value: 'overdue', label: 'Overdue', color: 'red' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' }
] as const;

export type InvoiceStatus = typeof INVOICE_STATUSES[number]['value'];

export const PAYMENT_METHODS = [
    { code: '10', name: 'Cash' },
    { code: '30', name: 'Credit Card' },
    { code: '42', name: 'Bank Transfer' },
    { code: '48', name: 'Debit Card' },
    { code: '1', name: 'Check' }
] as const;

export const TAX_CATEGORIES = [
    { code: 'S', name: 'Standard Rate', rate: 15 },
    { code: 'Z', name: 'Zero Rated', rate: 0 },
    { code: 'E', name: 'Exempt', rate: 0 },
    { code: 'O', name: 'Out of Scope', rate: 0 }
] as const;

/**
 * Generate next invoice number
 */
export function generateInvoiceNumber(lastNumber: string, prefix: string = 'INV'): string {
    const match = lastNumber.match(/(\d+)$/);
    const currentNumber = match ? parseInt(match[1], 10) : 0;
    const nextNumber = currentNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(items: InvoiceFormData['items']): {
    subtotal: number;
    totalTax: number;
    total: number;
} {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = items.reduce((sum, item) => {
        const itemSubtotal = item.quantity * item.unitPrice;
        return sum + (itemSubtotal * (item.taxRate / 100));
    }, 0);
    const total = subtotal + totalTax;

    return { subtotal, totalTax, total };
}

/**
 * Calculate invoice totals for Invoice type
 */
export function calculateInvoiceTotalsForInvoice(invoice: Invoice): Invoice {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (invoice.taxRate / 100);
    const total = subtotal + taxAmount;

    return {
        ...invoice,
        subtotal,
        taxAmount,
        total
    };
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(data: InvoiceFormData): InvoiceValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Customer validation
    if (!data.customerInfo.name.trim()) {
        errors.push('Customer name is required');
    }

    if (data.customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerInfo.email)) {
        warnings.push('Invalid email format');
    }

    if (data.customerInfo.vatNumber && !/^\d{15}$/.test(data.customerInfo.vatNumber)) {
        warnings.push('Invalid VAT number format (should be 15 digits)');
    }

    // Invoice details validation
    if (!data.invoiceDetails.invoiceNumber.trim()) {
        errors.push('Invoice number is required');
    }

    if (!data.invoiceDetails.issueDate) {
        errors.push('Issue date is required');
    }

    if (!data.invoiceDetails.dueDate) {
        errors.push('Due date is required');
    } else if (new Date(data.invoiceDetails.dueDate) < new Date(data.invoiceDetails.issueDate)) {
        warnings.push('Due date should be after issue date');
    }

    // Items validation
    const validItems = data.items.filter(item => item.description.trim() && item.quantity > 0);
    if (validItems.length === 0) {
        errors.push('At least one item is required');
    }

    validItems.forEach((item, index) => {
        if (item.unitPrice <= 0) {
            errors.push(`Item ${index + 1} unit price must be greater than 0`);
        }
        if (item.quantity <= 0) {
            errors.push(`Item ${index + 1} quantity must be greater than 0`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Convert form data to invoice data
 */
export function convertFormDataToInvoiceData(formData: InvoiceFormData): InvoiceData {
    const totals = calculateInvoiceTotals(formData.items);

    return {
        customer: formData.customerInfo,
        items: formData.items,
        invoiceNumber: formData.invoiceDetails.invoiceNumber,
        issueDate: formData.invoiceDetails.issueDate,
        dueDate: formData.invoiceDetails.dueDate,
        notes: formData.invoiceDetails.notes,
        ...totals
    };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
    return new Intl.NumberFormat('en-SA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: string = 'DD/MM/YYYY'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
        return '';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    switch (format) {
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return dateObj.toLocaleDateString();
    }
}
