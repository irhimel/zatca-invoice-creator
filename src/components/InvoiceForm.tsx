import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FileDown, Plus, Save, Trash2 } from 'lucide-react';
import React, { type JSX } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useInvoice } from '../context/utils/invoiceContextUtils';
import { InvoiceItem } from '../types';

// Add interfaces for event handlers
interface UpdateItemHandler {
  (index: number, field: keyof InvoiceItem, value: string | number): void;
}

interface RemoveItemHandler {
  (index: number): void;
}

export function InvoiceForm(): JSX.Element {
  const { state, dispatch } = useInvoice();
  const { currentInvoice } = state;

  const addItem = (): void => {
    const newItem: InvoiceItem = {
      id: uuidv4(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      unitPrice: 0,
      total: 0
    };
    dispatch({ type: 'ADD_ITEM', payload: newItem });
  };

  const updateItem: UpdateItemHandler = (index, field, value) => {
    const item = { ...currentInvoice.items[index] };

    if (field === 'description') {
      item.description = value as string;
    } else if (field === 'quantity' || field === 'rate') {
      const numValue = parseFloat(value as string) || 0;
      item[field] = numValue;
      item.amount = item.quantity * item.rate;
    }

    dispatch({ type: 'UPDATE_ITEM', payload: { index, item } });
  };

  const removeItem: RemoveItemHandler = (index) => {
    dispatch({ type: 'REMOVE_ITEM', payload: index });
  };

  const exportToPDF = async (): Promise<void> => {
    const element = document.getElementById('invoice-preview');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice-${currentInvoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const saveInvoice = async (): Promise<void> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveInvoiceData(currentInvoice);
      if (result.success) {
        alert('Invoice saved successfully!');
      } else if (!result.canceled) {
        alert(`Error saving invoice: ${result.error}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Invoice Creator</h1>
            <div className="flex gap-4">
              <button
                onClick={saveInvoice}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={20} />
                Save
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <FileDown size={20} />
                Export PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              {/* Invoice Details */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={currentInvoice.invoiceNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_INVOICE_FIELD', payload: { field: 'invoiceNumber', value: e.target.value } })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={currentInvoice.date}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_INVOICE_FIELD', payload: { field: 'date', value: e.target.value } })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={currentInvoice.dueDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_INVOICE_FIELD', payload: { field: 'dueDate', value: e.target.value } })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentInvoice.taxRate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({ type: 'UPDATE_INVOICE_FIELD', payload: { field: 'taxRate', value: parseFloat(e.target.value) || 0 } })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Client Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={currentInvoice.client.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({
                        type: 'UPDATE_INVOICE_FIELD',
                        payload: {
                          field: 'client',
                          value: { ...currentInvoice.client, name: e.target.value }
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={currentInvoice.client.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => dispatch({
                        type: 'UPDATE_INVOICE_FIELD',
                        payload: {
                          field: 'client',
                          value: { ...currentInvoice.client, email: e.target.value }
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      value={currentInvoice.client.address}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({
                        type: 'UPDATE_INVOICE_FIELD',
                        payload: {
                          field: 'client',
                          value: { ...currentInvoice.client, address: e.target.value }
                        }
                      })}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Items</h2>
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {currentInvoice.items.map((item: InvoiceItem, index: number) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <input
                          type="text"
                          placeholder="Description"
                          value={item.description}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'quantity', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateItem(index, 'rate', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="p-2 bg-gray-100 rounded-md text-sm text-right">
                          ${item.amount.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={(): void => removeItem(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Notes</h2>
                <textarea
                  value={currentInvoice.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => dispatch({ type: 'UPDATE_INVOICE_FIELD', payload: { field: 'notes', value: e.target.value } })}
                  rows={4}
                  placeholder="Additional notes or payment terms..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className="lg:sticky lg:top-6">
              <InvoicePreview />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoicePreview(): JSX.Element {
  const { state } = useInvoice();
  const { currentInvoice } = state;

  return (
    <div id="invoice-preview" className="bg-white border rounded-lg p-8 shadow-sm">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">INVOICE</h1>
        <div className="text-sm text-gray-600">
          <p>Invoice #: {currentInvoice.invoiceNumber}</p>
          <p>Date: {currentInvoice.date}</p>
          <p>Due Date: {currentInvoice.dueDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{currentInvoice.company.name}</p>
            <p>{currentInvoice.company.address}</p>
            <p>{currentInvoice.company.email}</p>
            {currentInvoice.company.phone && <p>{currentInvoice.company.phone}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">To:</h3>
          <div className="text-sm text-gray-600">
            <p className="font-medium">{currentInvoice.client.name}</p>
            <p>{currentInvoice.client.email}</p>
            <p className="whitespace-pre-wrap">{currentInvoice.client.address}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Rate</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoice.items.map((item: InvoiceItem) => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">${item.rate.toFixed(2)}</td>
                <td className="text-right py-2">${item.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-2">
            <span>Subtotal:</span>
            <span>${currentInvoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span>Tax ({currentInvoice.taxRate}%):</span>
            <span>${currentInvoice.taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t font-bold">
            <span>Total:</span>
            <span>${currentInvoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {currentInvoice.notes && (
        <div className="mt-8 pt-8 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{currentInvoice.notes}</p>
        </div>
      )}
    </div>
  );
}
