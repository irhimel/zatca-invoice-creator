import { PlusIcon } from 'lucide-react';
import { useLanguage } from '../../context/utils/languageContextUtils';

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
}

interface InvoiceItemsProps {
    items: InvoiceItem[];
    onUpdateItem: (id: string, field: keyof InvoiceItem, value: string | number) => void;
    onAddItem: () => void;
    onRemoveItem: (id: string) => void;
}

export default function InvoiceItems({
    items,
    onUpdateItem,
    onAddItem,
    onRemoveItem
}: InvoiceItemsProps) {
    const { isArabic } = useLanguage();

    const calculateTotal = (quantity: number, unitPrice: number, taxRate: number) => {
        const subtotal = quantity * unitPrice;
        const tax = subtotal * (taxRate / 100);
        return subtotal + tax;
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                    {isArabic ? 'عناصر الفاتورة' : 'Invoice Items'}
                </h3>
                <button
                    onClick={onAddItem}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    {isArabic ? 'إضافة عنصر' : 'Add Item'}
                </button>
            </div>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 bg-gray-700 rounded-lg">
                        {/* Item Number */}
                        <div className="lg:col-span-1 flex items-center">
                            <span className="text-sm text-gray-400">#{index + 1}</span>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-4">
                            <label className="block text-sm font-medium mb-1">
                                {isArabic ? 'الوصف' : 'Description'}
                            </label>
                            <input
                                type="text"
                                value={item.description}
                                onChange={(e) => onUpdateItem(item.id, 'description', e.target.value)}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={isArabic ? 'وصف العنصر' : 'Item description'}
                            />
                        </div>

                        {/* Quantity */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                {isArabic ? 'الكمية' : 'Quantity'}
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => onUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Unit Price */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                {isArabic ? 'سعر الوحدة (ريال)' : 'Unit Price (SAR)'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => onUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tax Rate */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium mb-1">
                                {isArabic ? 'معدل الضريبة (%)' : 'Tax Rate (%)'}
                            </label>
                            <select
                                value={item.taxRate}
                                onChange={(e) => onUpdateItem(item.id, 'taxRate', parseFloat(e.target.value))}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={0}>0%</option>
                                <option value={5}>5%</option>
                                <option value={15}>15%</option>
                            </select>
                        </div>

                        {/* Total & Remove */}
                        <div className="lg:col-span-1 flex flex-col items-end justify-between">
                            <div className="text-sm text-gray-400 mb-1">
                                {isArabic ? 'المجموع' : 'Total'}
                            </div>
                            <div className="text-lg font-semibold text-green-400 mb-2">
                                {calculateTotal(item.quantity, item.unitPrice, item.taxRate).toFixed(2)}
                            </div>
                            {items.length > 1 && (
                                <button
                                    onClick={() => onRemoveItem(item.id)}
                                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                                >
                                    {isArabic ? 'حذف' : 'Remove'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span>{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                        <span>
                            {items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)} SAR
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>{isArabic ? 'إجمالي الضريبة:' : 'Total Tax:'}</span>
                        <span>
                            {items.reduce((sum, item) => {
                                const subtotal = item.quantity * item.unitPrice;
                                return sum + (subtotal * (item.taxRate / 100));
                            }, 0).toFixed(2)} SAR
                        </span>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{isArabic ? 'المجموع الإجمالي:' : 'Grand Total:'}</span>
                        <span className="text-green-400">
                            {items.reduce((sum, item) => {
                                const subtotal = item.quantity * item.unitPrice;
                                const tax = subtotal * (item.taxRate / 100);
                                return sum + subtotal + tax;
                            }, 0).toFixed(2)} SAR
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
