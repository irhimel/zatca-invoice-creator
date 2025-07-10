import { AlertCircleIcon, CheckCircleIcon, DownloadIcon } from 'lucide-react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import { useZATCA } from '../../context/utils/zatcaContextUtils';
import { ZATCAInvoice } from '../../types/zatca';

interface InvoiceActionsProps {
    generatedInvoice: ZATCAInvoice | null;
    validationResult: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    } | null;
    onValidate: () => void;
    onDownloadPDF: () => void;
    onReportToZATCA: () => void;
}

export default function InvoiceActions({
    generatedInvoice,
    validationResult,
    onValidate,
    onDownloadPDF,
    onReportToZATCA
}: InvoiceActionsProps) {
    const { isArabic } = useLanguage();
    const { isProcessing, lastError } = useZATCA();

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                {isArabic ? 'إجراءات الفاتورة' : 'Invoice Actions'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Validation */}
                <div className="space-y-3">
                    <button
                        onClick={onValidate}
                        disabled={!generatedInvoice || isProcessing}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                        {isArabic ? 'التحقق من الفاتورة' : 'Validate Invoice'}
                    </button>

                    {validationResult && (
                        <div className={`p-3 rounded text-sm ${validationResult.isValid
                            ? 'bg-green-900/50 text-green-200 border border-green-600'
                            : 'bg-red-900/50 text-red-200 border border-red-600'
                            }`}>
                            <div className="font-medium mb-2">
                                {validationResult.isValid
                                    ? (isArabic ? '✅ الفاتورة صالحة' : '✅ Invoice Valid')
                                    : (isArabic ? '❌ الفاتورة غير صالحة' : '❌ Invoice Invalid')
                                }
                            </div>

                            {validationResult.errors.length > 0 && (
                                <div className="mb-2">
                                    <div className="font-medium text-red-300 mb-1">
                                        {isArabic ? 'الأخطاء:' : 'Errors:'}
                                    </div>
                                    <ul className="list-disc list-inside space-y-1">
                                        {validationResult.errors.map((error, index) => (
                                            <li key={index} className="text-xs">{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {validationResult.warnings.length > 0 && (
                                <div>
                                    <div className="font-medium text-yellow-300 mb-1">
                                        {isArabic ? 'التحذيرات:' : 'Warnings:'}
                                    </div>
                                    <ul className="list-disc list-inside space-y-1">
                                        {validationResult.warnings.map((warning, index) => (
                                            <li key={index} className="text-xs">{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* PDF Download */}
                <div className="space-y-3">
                    <button
                        onClick={onDownloadPDF}
                        disabled={!generatedInvoice || isProcessing}
                        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        {isArabic ? 'تحميل PDF' : 'Download PDF'}
                    </button>
                </div>

                {/* ZATCA Reporting */}
                <div className="space-y-3">
                    <button
                        onClick={onReportToZATCA}
                        disabled={!generatedInvoice || isProcessing || !validationResult?.isValid}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        <AlertCircleIcon className="w-4 h-4" />
                        {isArabic ? 'إرسال إلى زاتكا' : 'Report to ZATCA'}
                    </button>

                    <p className="text-xs text-gray-400">
                        {isArabic
                            ? 'يتطلب فاتورة صالحة للإرسال'
                            : 'Requires valid invoice to report'
                        }
                    </p>
                </div>
            </div>

            {/* Error Display */}
            {lastError && (
                <div className="mt-4 p-3 bg-red-900/50 text-red-200 border border-red-600 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertCircleIcon className="w-4 h-4" />
                        <span className="font-medium">
                            {isArabic ? 'خطأ:' : 'Error:'}
                        </span>
                    </div>
                    <p className="text-sm">{lastError}</p>
                </div>
            )}
        </div>
    );
}
