import { useLanguage } from '../context/utils/languageContextUtils';

export default function AuditTrailPanel() {
    const { isArabic } = useLanguage();

    const auditLogs = [
        { timestamp: '2025-07-08 14:30', action: 'Invoice Generated', user: 'admin', details: 'INV-1012 created' },
        { timestamp: '2025-07-08 14:25', action: 'Certificate Updated', user: 'system', details: 'ZATCA cert renewed' },
        { timestamp: '2025-07-08 14:20', action: 'QR Code Generated', user: 'admin', details: 'QR for INV-1011' },
        { timestamp: '2025-07-08 14:15', action: 'XML Signed', user: 'system', details: 'Digital signature applied' },
    ];

    return (
        <section className="bg-[#1a213a] p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-4">
                {isArabic ? 'سجل التدقيق' : 'Audit Trail'}
            </h2>
            <div className="space-y-2">
                {auditLogs.map((log, i) => (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-white/5 rounded transition">
                        <div>
                            <div className="text-sm font-medium">{log.action}</div>
                            <div className="text-xs text-muted-foreground">{log.details}</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                            <div>{log.timestamp}</div>
                            <div>{log.user}</div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
