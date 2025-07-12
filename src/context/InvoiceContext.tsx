import { format } from 'date-fns';
import React, { useEffect, useReducer } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Company, Invoice } from '../types';
import { calculateInvoiceTotalsForInvoice } from '../utils/invoice';
import type { InvoiceAction, InvoiceState } from './utils/invoiceContextUtils';
import { InvoiceContext } from './utils/invoiceContextUtils';


const initialCompany: Company = {
  id: uuidv4(),
  name: 'Your Company Name',
  address: '123 Business St, City, State 12345',
  email: 'info@yourcompany.com',
  phone: '+1 (555) 123-4567',
  website: 'www.yourcompany.com',
  vatNumber: '',
  crNumber: '',
  city: '',
  postalCode: '',
  country: ''
};

const createNewInvoice = (): Invoice => ({
  id: uuidv4(),
  invoiceNumber: `INV-${Date.now()}`,
  date: format(new Date(), 'yyyy-MM-dd'),
  dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  client: {
    id: '',
    name: '',
    email: '',
    address: '',
    phone: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  company: initialCompany,
  items: [],
  subtotal: 0,
  taxRate: 0,
  taxAmount: 0,
  total: 0,
  notes: '',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const initialState: InvoiceState = {
  currentInvoice: createNewInvoice(),
  clients: [],
  company: initialCompany
};

function invoiceReducer(state: InvoiceState, action: InvoiceAction): InvoiceState {
  switch (action.type) {
    case 'SET_INVOICE':
      return {
        ...state,
        currentInvoice: action.payload
      };

    case 'UPDATE_INVOICE_FIELD': {
      const updatedInvoice = {
        ...state.currentInvoice,
        [action.payload.field]: action.payload.value
      };
      return {
        ...state,
        currentInvoice: calculateInvoiceTotalsForInvoice(updatedInvoice)
      };
    }

    case 'ADD_ITEM':
      return {
        ...state,
        currentInvoice: calculateInvoiceTotalsForInvoice({
          ...state.currentInvoice,
          items: [...state.currentInvoice.items, action.payload]
        })
      };

    case 'UPDATE_ITEM': {
      const newItems = [...state.currentInvoice.items];
      newItems[action.payload.index] = action.payload.item;
      return {
        ...state,
        currentInvoice: calculateInvoiceTotalsForInvoice({
          ...state.currentInvoice,
          items: newItems
        })
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        currentInvoice: calculateInvoiceTotalsForInvoice({
          ...state.currentInvoice,
          items: state.currentInvoice.items.filter((_, index) => index !== action.payload)
        })
      };

    case 'ADD_CLIENT':
      return {
        ...state,
        clients: [...state.clients, action.payload]
      };

    case 'UPDATE_COMPANY':
      return {
        ...state,
        company: action.payload,
        currentInvoice: {
          ...state.currentInvoice,
          company: action.payload
        }
      };

    case 'NEW_INVOICE':
      return {
        ...state,
        currentInvoice: {
          ...createNewInvoice(),
          company: state.company
        }
      };

    case 'CALCULATE_TOTALS':
      return {
        ...state,
        currentInvoice: calculateInvoiceTotalsForInvoice(state.currentInvoice)
      };

    default:
      return state;
  }
}


export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(invoiceReducer, initialState);

  // Set up Electron menu handlers
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onNewInvoice(() => {
        dispatch({ type: 'NEW_INVOICE' });
      });

      window.electronAPI.onSaveInvoice(async () => {
        const result = await window.electronAPI.saveInvoiceData(state.currentInvoice);
        if (result.success) {
          console.log('Invoice saved successfully');
        } else if (!result.canceled) {
          console.error('Failed to save invoice:', result.error);
        }
      });

      return () => {
        window.electronAPI.removeAllListeners('menu-new-invoice');
        window.electronAPI.removeAllListeners('menu-save-invoice');
      };
    }
  }, [state.currentInvoice]);

  return (
    <InvoiceContext.Provider value={{ state, dispatch }}>
      {children}
    </InvoiceContext.Provider>
  );
}

