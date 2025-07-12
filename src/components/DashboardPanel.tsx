interface DashboardPanelProps {
  isArabic: boolean;
}

export default function DashboardPanel({ isArabic }: DashboardPanelProps) {
  const metrics = [
    { label: { en: 'Total Invoices', ar: 'إجمالي الفواتير' }, value: 128 },
    { label: { en: 'Signed Today', ar: 'تم التوقيع اليوم' }, value: 17 },
    { label: { en: 'SAR Collected', ar: 'ريال تم تحصيله' }, value: '94,200' },
    { label: { en: 'QR Success Rate', ar: 'معدل نجاح QR' }, value: '98.7%' },
  ];

  return (
    <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((m, i) => (
        <div key={i} className="bg-[#1a213a] p-4 rounded-md shadow hover:shadow-lg transition">
          <div className="text-sm text-muted-foreground mb-1">
            {isArabic ? m.label.ar : m.label.en}
          </div>
          <div className="text-2xl font-bold">{m.value}</div>
        </div>
      ))}
    </section>
  );
}