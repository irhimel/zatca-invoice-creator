import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  saveInvoiceData: (data) => ipcRenderer.invoke('save-invoice-data', data),
  loadInvoiceData: () => ipcRenderer.invoke('load-invoice-data'),
  
  // Menu event listeners
  onNewInvoice: (callback) => ipcRenderer.on('menu-new-invoice', callback),
  onSaveInvoice: (callback) => ipcRenderer.on('menu-save-invoice', callback),
  onExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
