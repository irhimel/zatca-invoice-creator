const invoices = [
  { id: '#INV1012', client: 'Ali Co.', status: 'Signed', date: '2025-07-07' },
  { id: '#INV1013', client: 'Sahara Group', status: 'Draft', date: '2025-07-07' },
];

interface InvoicesPanelProps {
  isArabic: boolean;
}

export default function InvoicesPanel({ isArabic }: InvoicesPanelProps) {
  const headers = {
    id: { en: 'Invoice ID', ar: 'رقم الفاتورة' },
    client: { en: 'Client', ar: 'العميل' },
    status: { en: 'Status', ar: 'الحالة' },
    date: { en: 'Date', ar: 'التاريخ' },
  };

  return (
    <section className="bg-[#1a213a] p-4 rounded-md shadow">
      <h2 className="text-lg font-semibold mb-4">
        {isArabic ? 'لوحة الفواتير' : 'Invoices Panel'}
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-white/10">
            <th className="py-2">{isArabic ? headers.id.ar : headers.id.en}</th>
            <th className="py-2">{isArabic ? headers.client.ar : headers.client.en}</th>
            <th className="py-2">{isArabic ? headers.status.ar : headers.status.en}</th>
            <th className="py-2">{isArabic ? headers.date.ar : headers.date.en}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(row => (
            <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-2">{row.id}</td>
              <td className="py-2">{row.client}</td>
              <td className="py-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'Signed'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {isArabic
                    ? row.status === 'Signed'
                      ? 'موقعة'
                      : 'مسودة'
                    : row.status}
                </span>
              </td>
              <td className="py-2">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}