// Base interface for entities with an ID
export interface BaseEntity {
  id: string;
}

export interface InvoiceItem extends BaseEntity {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  unitPrice: number;
  total: number;
}

export interface Client extends BaseEntity {
  name: string;
  email: string;
  address: string;
  phone?: string;
  vatNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company extends BaseEntity {
  name: string;
  address: string;
  email: string;
  phone?: string;
  website?: string;
  logo?: string;
  vatNumber: string;
  crNumber: string;
  city: string;
  postalCode: string;
  country: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice extends BaseEntity {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: Client;
  company: Company;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ElectronAPI {
  saveInvoiceData: (data: Invoice) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  loadInvoiceData: () => Promise<{ success: boolean; data?: Invoice; error?: string; canceled?: boolean }>;
  onNewInvoice: (callback: () => void) => void;
  onSaveInvoice: (callback: () => void) => void;
  onExportPDF: (callback: () => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
