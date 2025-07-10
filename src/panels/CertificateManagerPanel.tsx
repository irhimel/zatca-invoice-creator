import { useLanguage } from '../context/utils/languageContextUtils';

export default function CertificateManagerPanel() {
    const { isArabic } = useLanguage();

    const certificates = [
        { id: 'CERT-001', type: 'ZATCA E-Invoice', status: 'Active', expiry: '2025-12-31' },
        { id: 'CERT-002', type: 'Digital Signature', status: 'Active', expiry: '2025-10-15' },
        { id: 'CERT-003', type: 'QR Code Auth', status: 'Pending', expiry: '2025-09-20' },
    ];

    return (
        <section className="bg-[#1a213a] p-4 rounded-md shadow">
            <h2 className="text-lg font-semibold mb-4">
                {isArabic ? 'إدارة الشهادات' : 'Certificate Manager'}
            </h2>
            <div className="space-y-3">
                {certificates.map((cert) => (
                    <div key={cert.id} className="flex justify-between items-center p-3 bg-[#0e1726] rounded border border-white/10">
                        <div>
                            <div className="font-medium">{cert.type}</div>
                            <div className="text-sm text-muted-foreground">{cert.id}</div>
                        </div>
                        <div className="text-right">
                            <div className={`text-sm px-2 py-1 rounded ${cert.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                {cert.status}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {isArabic ? 'ينتهي في' : 'Expires'}: {cert.expiry}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
