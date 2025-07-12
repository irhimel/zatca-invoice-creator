import { UserIcon } from 'lucide-react';
import { useLanguage } from '../../context/utils/languageContextUtils';

interface CustomerInfo {
    name: string;
    email: string;
    phone: string;
    address: string;
    vatNumber: string;
}

interface CustomerFormProps {
    customerInfo: CustomerInfo;
    onUpdateCustomer: (field: keyof CustomerInfo, value: string) => void;
}

export default function CustomerForm({
    customerInfo,
    onUpdateCustomer
}: CustomerFormProps) {
    const { isArabic } = useLanguage();

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-400" />
                {isArabic ? 'معلومات العميل' : 'Customer Information'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'اسم العميل' : 'Customer Name'}
                    </label>
                    <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => onUpdateCustomer('name', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isArabic ? 'أدخل اسم العميل' : 'Enter customer name'}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => onUpdateCustomer('email', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isArabic ? 'customer@example.com' : 'customer@example.com'}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => onUpdateCustomer('phone', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isArabic ? '+966501234567' : '+966501234567'}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'الرقم الضريبي' : 'VAT Number'}
                        <span className="text-gray-400 text-xs ml-1">
                            ({isArabic ? 'اختياري' : 'Optional'})
                        </span>
                    </label>
                    <input
                        type="text"
                        value={customerInfo.vatNumber}
                        onChange={(e) => onUpdateCustomer('vatNumber', e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isArabic ? '300012345600003' : '300012345600003'}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">
                        {isArabic ? 'العنوان' : 'Address'}
                    </label>
                    <textarea
                        value={customerInfo.address}
                        onChange={(e) => onUpdateCustomer('address', e.target.value)}
                        rows={3}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder={isArabic ? 'أدخل عنوان العميل' : 'Enter customer address'}
                    />
                </div>
            </div>
        </div>
    );
}
