// src/components/Export/ExportDialog.tsx

import {
    CalendarIcon,
    CheckIcon,
    DownloadIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    TableIcon,
    UsersIcon,
    XIcon
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import { ExportOptions, ExportProgress, exportService } from '../../services/exportService';

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
    const { isArabic } = useLanguage();
    const [exportOptions, setExportOptions] = useState<ExportOptions>({
        format: 'excel',
        includeInvoices: true,
        includeClients: true,
        includeReports: false
    });
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0] // today
    });
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

    const labels = {
        title: { en: 'Export Data', ar: 'تصدير البيانات' },
        format: { en: 'Export Format', ar: 'صيغة التصدير' },
        excel: { en: 'Excel Spreadsheet', ar: 'جدول إكسل' },
        csv: { en: 'CSV File', ar: 'ملف CSV' },
        pdf: { en: 'PDF Report', ar: 'تقرير PDF' },
        dataToInclude: { en: 'Data to Include', ar: 'البيانات المطلوب تضمينها' },
        invoices: { en: 'Invoices', ar: 'الفواتير' },
        clients: { en: 'Clients', ar: 'العملاء' },
        reports: { en: 'Financial Reports', ar: 'التقارير المالية' },
        dateRange: { en: 'Date Range', ar: 'النطاق الزمني' },
        startDate: { en: 'Start Date', ar: 'تاريخ البداية' },
        endDate: { en: 'End Date', ar: 'تاريخ النهاية' },
        export: { en: 'Export', ar: 'تصدير' },
        cancel: { en: 'Cancel', ar: 'إلغاء' },
        exporting: { en: 'Exporting...', ar: 'جاري التصدير...' },
        completed: { en: 'Export Completed!', ar: 'اكتمل التصدير!' },
        error: { en: 'Export Failed', ar: 'فشل التصدير' }
    };

    const formatOptions = [
        { value: 'excel', label: labels.excel, icon: FileSpreadsheetIcon },
        { value: 'csv', label: labels.csv, icon: TableIcon },
        { value: 'pdf', label: labels.pdf, icon: FileTextIcon }
    ];

    const handleExport = async () => {
        try {
            setIsExporting(true);
            setExportProgress(null);

            const options: ExportOptions = {
                ...exportOptions,
                dateRange: exportOptions.includeInvoices ? {
                    startDate: new Date(dateRange.startDate),
                    endDate: new Date(dateRange.endDate)
                } : undefined
            };

            const blob = await exportService.exportData(options, (progress) => {
                setExportProgress(progress);
            });

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const extension = options.format === 'excel' ? 'xlsx' : options.format;
            const filename = `zatca-export-${timestamp}.${extension}`;

            // Download the file
            exportService.downloadBlob(blob, filename);

            // Close dialog after a short delay
            setTimeout(() => {
                onClose();
                setIsExporting(false);
                setExportProgress(null);
            }, 2000);

        } catch (error) {
            console.error('Export failed:', error);
            setExportProgress({
                total: 100,
                completed: 0,
                status: 'error',
                currentStep: 'Export failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a213a] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-600">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <DownloadIcon className="w-5 h-5 text-blue-400" />
                        {isArabic ? labels.title.ar : labels.title.en}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                        disabled={isExporting}
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Export Format */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            {isArabic ? labels.format.ar : labels.format.en}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {formatOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setExportOptions(prev => ({ ...prev, format: option.value as 'excel' | 'csv' | 'pdf' }))}
                                    disabled={isExporting}
                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${exportOptions.format === option.value
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                                        }`}
                                >
                                    <option.icon className="w-5 h-5" />
                                    <span>{isArabic ? option.label.ar : option.label.en}</span>
                                    {exportOptions.format === option.value && (
                                        <CheckIcon className="w-4 h-4 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data to Include */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            {isArabic ? labels.dataToInclude.ar : labels.dataToInclude.en}
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeInvoices}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeInvoices: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <FileTextIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">
                                    {isArabic ? labels.invoices.ar : labels.invoices.en}
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeClients}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeClients: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <UsersIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">
                                    {isArabic ? labels.clients.ar : labels.clients.en}
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={exportOptions.includeReports}
                                    onChange={(e) => setExportOptions(prev => ({
                                        ...prev,
                                        includeReports: e.target.checked
                                    }))}
                                    disabled={isExporting}
                                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                                />
                                <CalendarIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300">
                                    {isArabic ? labels.reports.ar : labels.reports.en}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Date Range (only if invoices are included) */}
                    {exportOptions.includeInvoices && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-3">
                                {isArabic ? labels.dateRange.ar : labels.dateRange.en}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">
                                        {isArabic ? labels.startDate.ar : labels.startDate.en}
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.startDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        disabled={isExporting}
                                        className="w-full bg-gray-700 border border-gray-600 rounded text-white p-2 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">
                                        {isArabic ? labels.endDate.ar : labels.endDate.en}
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.endDate}
                                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        disabled={isExporting}
                                        className="w-full bg-gray-700 border border-gray-600 rounded text-white p-2 focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Export Progress */}
                    {exportProgress && (
                        <div className="bg-gray-700/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-300">{exportProgress.currentStep}</span>
                                <span className="text-sm text-gray-400">
                                    {exportProgress.completed}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${exportProgress.status === 'error'
                                        ? 'bg-red-500'
                                        : exportProgress.status === 'completed'
                                            ? 'bg-green-500'
                                            : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${exportProgress.completed}%` }}
                                />
                            </div>
                            {exportProgress.status === 'error' && exportProgress.error && (
                                <p className="text-red-400 text-sm mt-2">{exportProgress.error}</p>
                            )}
                            {exportProgress.status === 'completed' && (
                                <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                                    <CheckIcon className="w-4 h-4" />
                                    {isArabic ? labels.completed.ar : labels.completed.en}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-600">
                    <button
                        onClick={onClose}
                        disabled={isExporting && exportProgress?.status !== 'completed'}
                        className="px-4 py-2 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isArabic ? labels.cancel.ar : labels.cancel.en}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting || (!exportOptions.includeInvoices && !exportOptions.includeClients && !exportOptions.includeReports)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        {isExporting
                            ? (isArabic ? labels.exporting.ar : labels.exporting.en)
                            : (isArabic ? labels.export.ar : labels.export.en)
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
