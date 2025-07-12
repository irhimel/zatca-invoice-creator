import { AlertCircleIcon, CheckCircleIcon, DownloadIcon, PlusCircleIcon, TrendingUpIcon } from 'lucide-react';
import { useState } from 'react';
import ExportDialog from '../components/Export/ExportDialog';
import { useLanguage } from '../context/utils/languageContextUtils';

interface DashboardPanelProps {
  onNavigate?: (panel: 'dashboard' | 'invoices' | 'create-invoice' | 'reports' | 'certificates' | 'audit' | 'settings') => void;
}

export default function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  const { isArabic } = useLanguage();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const metrics = [
    {
      label: { en: 'Total Invoices', ar: 'إجمالي الفواتير' },
      value: 128,
      icon: TrendingUpIcon,
      color: 'text-blue-400'
    },
    {
      label: { en: 'Signed Today', ar: 'تم التوقيع اليوم' },
      value: 17,
      icon: CheckCircleIcon,
      color: 'text-green-400'
    },
    {
      label: { en: 'SAR Collected', ar: 'ريال تم تحصيله' },
      value: '94,200',
      icon: TrendingUpIcon,
      color: 'text-yellow-400'
    },
    {
      label: { en: 'QR Success Rate', ar: 'معدل نجاح QR' },
      value: '98.7%',
      icon: AlertCircleIcon,
      color: 'text-purple-400'
    },
  ];

  const handleCreateInvoice = () => {
    if (onNavigate) {
      onNavigate('create-invoice');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-[#1a213a] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleCreateInvoice}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5" />
            {isArabic ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
          </button>
          <button
            onClick={() => onNavigate && onNavigate('invoices')}
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isArabic ? 'عرض الفواتير' : 'View Invoices'}
          </button>
          <button
            onClick={() => onNavigate && onNavigate('reports')}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            {isArabic ? 'التقارير' : 'Reports'}
          </button>
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            <DownloadIcon className="w-5 h-5" />
            {isArabic ? 'تصدير البيانات' : 'Export Data'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-[#1a213a] p-4 rounded-md shadow hover:shadow-lg transition">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${m.color}`} />
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {isArabic ? m.label.ar : m.label.en}
              </div>
              <div className="text-2xl font-bold">{m.value}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-[#1a213a] rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-[#0e1726] rounded-lg">
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
            <div>
              <div className="font-medium">
                {isArabic ? 'تم إنشاء فاتورة جديدة' : 'New invoice created'}
              </div>
              <div className="text-sm text-gray-400">
                {isArabic ? 'منذ 5 دقائق' : '5 minutes ago'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0e1726] rounded-lg">
            <TrendingUpIcon className="w-5 h-5 text-blue-400" />
            <div>
              <div className="font-medium">
                {isArabic ? 'تم توقيع فاتورة إلكترونياً' : 'Invoice digitally signed'}
              </div>
              <div className="text-sm text-gray-400">
                {isArabic ? 'منذ 15 دقيقة' : '15 minutes ago'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[#0e1726] rounded-lg">
            <AlertCircleIcon className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="font-medium">
                {isArabic ? 'تم إرسال فاتورة للعميل' : 'Invoice sent to client'}
              </div>
              <div className="text-sm text-gray-400">
                {isArabic ? 'منذ 30 دقيقة' : '30 minutes ago'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
}