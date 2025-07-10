// src/components/Client/ClientFormModal.tsx

import { SaveIcon, UserIcon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/utils/languageContextUtils';
import { clientService } from '../../services/clientService';
import { Client, ClientFormData } from '../../types/client';

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    client?: Client | null;
    mode: 'create' | 'edit';
}

export default function ClientFormModal({ isOpen, onClose, onSave, client, mode }: ClientFormModalProps) {
    const { isArabic } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClientFormData>({
        name: '',
        nameAr: '',
        email: '',
        phone: '',
        address: '',
        addressAr: '',
        vatNumber: '',
        commercialRegistration: '',
        contactPerson: '',
        contactPersonAr: '',
        paymentTerms: 30,
        creditLimit: 0,
        currency: 'SAR',
        notes: '',
        notesAr: '',
        isActive: true
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const labels = {
        createTitle: { en: 'Add New Client', ar: 'إضافة عميل جديد' },
        editTitle: { en: 'Edit Client', ar: 'تعديل العميل' },
        name: { en: 'Client Name', ar: 'اسم العميل' },
        nameAr: { en: 'Client Name (Arabic)', ar: 'اسم العميل (عربي)' },
        email: { en: 'Email Address', ar: 'البريد الإلكتروني' },
        phone: { en: 'Phone Number', ar: 'رقم الهاتف' },
        address: { en: 'Address', ar: 'العنوان' },
        addressAr: { en: 'Address (Arabic)', ar: 'العنوان (عربي)' },
        vatNumber: { en: 'VAT Number', ar: 'الرقم الضريبي' },
        commercialRegistration: { en: 'Commercial Registration', ar: 'السجل التجاري' },
        contactPerson: { en: 'Contact Person', ar: 'الشخص المسؤول' },
        contactPersonAr: { en: 'Contact Person (Arabic)', ar: 'الشخص المسؤول (عربي)' },
        paymentTerms: { en: 'Payment Terms (Days)', ar: 'شروط الدفع (أيام)' },
        creditLimit: { en: 'Credit Limit', ar: 'حد الائتمان' },
        currency: { en: 'Currency', ar: 'العملة' },
        notes: { en: 'Notes', ar: 'ملاحظات' },
        notesAr: { en: 'Notes (Arabic)', ar: 'ملاحظات (عربي)' },
        isActive: { en: 'Active Client', ar: 'عميل نشط' },
        save: { en: 'Save Client', ar: 'حفظ العميل' },
        cancel: { en: 'Cancel', ar: 'إلغاء' },
        required: { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
        invalidEmail: { en: 'Please enter a valid email address', ar: 'يرجى إدخال بريد إلكتروني صحيح' },
        saving: { en: 'Saving...', ar: 'جاري الحفظ...' }
    };

    useEffect(() => {
        if (client && mode === 'edit') {
            setFormData({
                name: client.name,
                nameAr: client.nameAr || '',
                email: client.email,
                phone: client.phone,
                address: client.address,
                addressAr: client.addressAr || '',
                vatNumber: client.vatNumber || '',
                commercialRegistration: client.commercialRegistration || '',
                contactPerson: client.contactPerson || '',
                contactPersonAr: client.contactPersonAr || '',
                paymentTerms: client.paymentTerms,
                creditLimit: client.creditLimit || 0,
                currency: client.currency,
                notes: client.notes || '',
                notesAr: client.notesAr || '',
                isActive: client.isActive
            });
        } else {
            // Reset form for create mode
            setFormData({
                name: '',
                nameAr: '',
                email: '',
                phone: '',
                address: '',
                addressAr: '',
                vatNumber: '',
                commercialRegistration: '',
                contactPerson: '',
                contactPersonAr: '',
                paymentTerms: 30,
                creditLimit: 0,
                currency: 'SAR',
                notes: '',
                notesAr: '',
                isActive: true
            });
        }
        setErrors({});
    }, [client, mode, isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = isArabic ? labels.required.ar : labels.required.en;
        }

        if (!formData.email.trim()) {
            newErrors.email = isArabic ? labels.required.ar : labels.required.en;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = isArabic ? labels.invalidEmail.ar : labels.invalidEmail.en;
        }

        if (!formData.phone.trim()) {
            newErrors.phone = isArabic ? labels.required.ar : labels.required.en;
        }

        if (!formData.address.trim()) {
            newErrors.address = isArabic ? labels.required.ar : labels.required.en;
        }

        if (formData.paymentTerms < 0) {
            newErrors.paymentTerms = isArabic ? 'يجب أن تكون القيمة أكبر من الصفر' : 'Value must be greater than 0';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            if (mode === 'create') {
                await clientService.createClient(formData);
            } else if (client) {
                await clientService.updateClient(client.id, formData);
            }

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving client:', error);
            alert(isArabic ? 'فشل في حفظ بيانات العميل' : 'Failed to save client');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof ClientFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a213a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <UserIcon className="w-6 h-6 text-blue-400" />
                        <h2 className="text-xl font-semibold text-white">
                            {mode === 'create'
                                ? (isArabic ? labels.createTitle.ar : labels.createTitle.en)
                                : (isArabic ? labels.editTitle.ar : labels.editTitle.en)
                            }
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.name.ar : labels.name.en} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className={`w-full px-3 py-2 bg-[#0e1726] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                placeholder={isArabic ? 'أدخل اسم العميل' : 'Enter client name'}
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
                        </div>

                        {/* Name Arabic */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.nameAr.ar : labels.nameAr.en}
                            </label>
                            <input
                                type="text"
                                value={formData.nameAr}
                                onChange={(e) => handleChange('nameAr', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder={isArabic ? 'أدخل اسم العميل بالعربية' : 'Enter client name in Arabic'}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.email.ar : labels.email.en} *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className={`w-full px-3 py-2 bg-[#0e1726] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                placeholder={isArabic ? 'أدخل البريد الإلكتروني' : 'Enter email address'}
                            />
                            {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.phone.ar : labels.phone.en} *
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className={`w-full px-3 py-2 bg-[#0e1726] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                placeholder={isArabic ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                            />
                            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.address.ar : labels.address.en} *
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                rows={3}
                                className={`w-full px-3 py-2 bg-[#0e1726] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none ${errors.address ? 'border-red-500' : 'border-gray-600'
                                    }`}
                                placeholder={isArabic ? 'أدخل العنوان' : 'Enter address'}
                            />
                            {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.addressAr.ar : labels.addressAr.en}
                            </label>
                            <textarea
                                value={formData.addressAr}
                                onChange={(e) => handleChange('addressAr', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                placeholder={isArabic ? 'أدخل العنوان بالعربية' : 'Enter address in Arabic'}
                            />
                        </div>
                    </div>

                    {/* Business Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.vatNumber.ar : labels.vatNumber.en}
                            </label>
                            <input
                                type="text"
                                value={formData.vatNumber}
                                onChange={(e) => handleChange('vatNumber', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder={isArabic ? 'أدخل الرقم الضريبي' : 'Enter VAT number'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.commercialRegistration.ar : labels.commercialRegistration.en}
                            </label>
                            <input
                                type="text"
                                value={formData.commercialRegistration}
                                onChange={(e) => handleChange('commercialRegistration', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder={isArabic ? 'أدخل السجل التجاري' : 'Enter commercial registration'}
                            />
                        </div>
                    </div>

                    {/* Contact Person */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.contactPerson.ar : labels.contactPerson.en}
                            </label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder={isArabic ? 'أدخل اسم الشخص المسؤول' : 'Enter contact person name'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.contactPersonAr.ar : labels.contactPersonAr.en}
                            </label>
                            <input
                                type="text"
                                value={formData.contactPersonAr}
                                onChange={(e) => handleChange('contactPersonAr', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                                placeholder={isArabic ? 'أدخل اسم الشخص المسؤول بالعربية' : 'Enter contact person name in Arabic'}
                            />
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.paymentTerms.ar : labels.paymentTerms.en} *
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.paymentTerms}
                                onChange={(e) => handleChange('paymentTerms', parseInt(e.target.value) || 0)}
                                className={`w-full px-3 py-2 bg-[#0e1726] border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${errors.paymentTerms ? 'border-red-500' : 'border-gray-600'
                                    }`}
                            />
                            {errors.paymentTerms && <p className="mt-1 text-sm text-red-400">{errors.paymentTerms}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.creditLimit.ar : labels.creditLimit.en}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.creditLimit}
                                onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.currency.ar : labels.currency.en}
                            </label>
                            <select
                                value={formData.currency}
                                onChange={(e) => handleChange('currency', e.target.value)}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="SAR">SAR - Saudi Riyal</option>
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="AED">AED - UAE Dirham</option>
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.notes.ar : labels.notes.en}
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                placeholder={isArabic ? 'أدخل ملاحظات' : 'Enter notes'}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                {isArabic ? labels.notesAr.ar : labels.notesAr.en}
                            </label>
                            <textarea
                                value={formData.notesAr}
                                onChange={(e) => handleChange('notesAr', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[#0e1726] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                                placeholder={isArabic ? 'أدخل ملاحظات بالعربية' : 'Enter notes in Arabic'}
                            />
                        </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => handleChange('isActive', e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-[#0e1726] border-gray-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-300">
                            {isArabic ? labels.isActive.ar : labels.isActive.en}
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            disabled={loading}
                        >
                            {isArabic ? labels.cancel.ar : labels.cancel.en}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            <SaveIcon className="w-4 h-4" />
                            {loading
                                ? (isArabic ? labels.saving.ar : labels.saving.en)
                                : (isArabic ? labels.save.ar : labels.save.en)
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
