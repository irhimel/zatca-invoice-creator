import { useLanguage } from '../context/utils/languageContextUtils';

export default function ReportDashboardPanel() {
    const { isArabic } = useLanguage();

    const reports = [
        { type: { en: 'Monthly Revenue', ar: 'الإيرادات الشهرية' }, amount: '245,678 SAR', trend: '+12%' },
        { type: { en: 'Metal Types', ar: 'أنواع المعادن' }, amount: '15 Types', trend: '+3' },
        { type: { en: 'Active Suppliers', ar: 'الموردون النشطون' }, amount: '42', trend: '+5' },
    ];

    return (
        <section className="bg-[#1a213a] p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-4">
                {isArabic ? 'تقارير المعادن' : 'Metal Scrap Reports'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reports.map((report, i) => (
                    <div key={i} className="bg-[#0e1726] p-4 rounded border border-white/10">
                        <h3 className="text-sm text-muted-foreground mb-2">
                            {isArabic ? report.type.ar : report.type.en}
                        </h3>
                        <div className="text-xl font-bold">{report.amount}</div>
                        <div className="text-green-400 text-sm mt-1">{report.trend}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
