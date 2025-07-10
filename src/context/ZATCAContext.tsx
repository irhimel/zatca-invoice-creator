import { useCallback, useEffect, useState } from 'react';
import { ZATCAService } from '../services/zatca/zatcaService';
import { OfflineInvoiceQueue, ZATCAInvoice, ZATCASettings } from '../types/zatca';
import { useAppSettings } from './utils/appSettingsContextUtils';
import { ZATCAContext, type ZATCAProviderProps } from './utils/zatcaContextUtils';

export function ZATCAProvider({ children }: ZATCAProviderProps) {
    const { settings } = useAppSettings();
    const [zatcaService, setZatcaService] = useState<ZATCAService | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [offlineQueueStats, setOfflineQueueStats] = useState({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
    });
    const [overdueInvoices, setOverdueInvoices] = useState<OfflineInvoiceQueue[]>([]);

    // Refresh queue statistics
    const refreshQueueStats = useCallback(() => {
        if (zatcaService) {
            const stats = zatcaService.getOfflineQueueStats();
            setOfflineQueueStats(stats);

            const overdue = zatcaService.getOverdueInvoices();
            setOverdueInvoices(overdue);
        }
    }, [zatcaService]);

    // Initialize ZATCA service
    useEffect(() => {
        const initializeZATCA = async () => {
            try {
                const zatcaSettings: ZATCASettings = {
                    environment: settings.zatcaEnvironment,
                    certificatePath: settings.zatcaCertificatePath,
                    privateKeyPath: settings.zatcaPrivateKeyPath,
                    csrConfig: {
                        commonName: settings.companyName,
                        serialNumber: settings.companyRegistrationNumber,
                        organizationIdentifier: settings.companyVatNumber,
                        organizationUnitName: 'E-Invoicing',
                        organizationName: settings.companyName,
                        countryName: 'SA',
                        invoiceType: '1100',
                        location: settings.companyAddress,
                        industry: 'Technology'
                    },
                    apiEndpoints: {
                        compliance: settings.zatcaEnvironment === 'production'
                            ? 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance'
                            : 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/compliance',
                        reporting: settings.zatcaEnvironment === 'production'
                            ? 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single'
                            : 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/reporting/single',
                        clearance: settings.zatcaEnvironment === 'production'
                            ? 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single'
                            : 'https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal/invoices/clearance/single'
                    }
                };

                const service = new ZATCAService(zatcaSettings);
                setZatcaService(service);
                setIsInitialized(true);

                // Initialize queue stats
                refreshQueueStats();

                console.log('ZATCA service initialized successfully');
            } catch (error) {
                console.error('Failed to initialize ZATCA service:', error);
                setLastError(error instanceof Error ? error.message : 'Failed to initialize ZATCA service');
            }
        };

        initializeZATCA();
    }, [settings, refreshQueueStats]);

    // Refresh stats periodically
    useEffect(() => {
        const interval = setInterval(refreshQueueStats, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, [refreshQueueStats]);

    // Generate simplified invoice
    const generateSimplifiedInvoice = async (invoiceData: import('../types/zatca').ZATCASimplifiedInvoiceInput): Promise<ZATCAInvoice> => {
        if (!zatcaService) {
            throw new Error('ZATCA service not initialized');
        }

        setIsProcessing(true);
        setLastError(null);

        try {
            const invoice = await zatcaService.generateSimplifiedInvoice(invoiceData);

            // Auto-report if enabled
            if (settings.zatcaAutoSubmit) {
                await zatcaService.reportInvoice(invoice);
            }

            refreshQueueStats();
            return invoice;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate invoice';
            setLastError(errorMessage);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // Generate PDF invoice
    const generatePDFInvoice = async (invoice: ZATCAInvoice): Promise<Blob> => {
        if (!zatcaService) {
            throw new Error('ZATCA service not initialized');
        }

        setIsProcessing(true);
        setLastError(null);

        try {
            const pdfBlob = await zatcaService.generatePDFInvoice(invoice);
            return pdfBlob;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
            setLastError(errorMessage);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // Report invoice
    const reportInvoice = async (invoice: ZATCAInvoice): Promise<void> => {
        if (!zatcaService) {
            throw new Error('ZATCA service not initialized');
        }

        setIsProcessing(true);
        setLastError(null);

        try {
            await zatcaService.reportInvoice(invoice);
            refreshQueueStats();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to report invoice';
            setLastError(errorMessage);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // Validate invoice
    const validateInvoice = async (invoice: ZATCAInvoice) => {
        if (!zatcaService) {
            throw new Error('ZATCA service not initialized');
        }

        setIsProcessing(true);
        setLastError(null);

        try {
            const result = await zatcaService.validateInvoice(invoice);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to validate invoice';
            setLastError(errorMessage);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    // Process offline queue
    const processOfflineQueue = async (): Promise<void> => {
        if (!zatcaService) {
            throw new Error('ZATCA service not initialized');
        }

        setIsProcessing(true);
        setLastError(null);

        try {
            await zatcaService.processOfflineQueue();
            refreshQueueStats();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process offline queue';
            setLastError(errorMessage);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };

    const value = {
        zatcaService,
        isInitialized,
        offlineQueueStats,
        overdueInvoices,
        generateSimplifiedInvoice,
        generatePDFInvoice,
        reportInvoice,
        validateInvoice,
        processOfflineQueue,
        refreshQueueStats,
        isProcessing,
        lastError
    };

    return (
        <ZATCAContext.Provider value={value}>
            {children}
        </ZATCAContext.Provider>
    );
}
