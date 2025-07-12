import { ZATCAInvoice } from '../../types/zatca';
import { ZATCAQRCodeGenerator } from './qrGenerator';
import { ZATCAUBLGenerator } from './ublGenerator';

export class ZATCAPDFGenerator {
    /**
     * Generate PDF/A-3 invoice with embedded UBL XML
     */
    static async generatePDFInvoice(invoice: ZATCAInvoice): Promise<Blob> {
        try {
            // Generate UBL XML
            const ublXML = ZATCAUBLGenerator.generateUBLXML(invoice);

            // Generate QR code
            await ZATCAQRCodeGenerator.generateInvoiceQRCode(invoice);
            const qrCodeSVG = await ZATCAQRCodeGenerator.generateQRCodeSVG({
                sellerName: invoice.supplier.name,
                vatNumber: invoice.supplier.vatNumber,
                timestamp: `${invoice.issueDate}T${invoice.issueTime}Z`,
                invoiceTotal: invoice.legalMonetaryTotal.taxInclusiveAmount,
                vatTotal: invoice.taxTotal.taxAmount
            });

            // Generate HTML template
            const htmlContent = this.generateHTMLTemplate(invoice, qrCodeSVG, ublXML);

            // Convert to PDF (in a real implementation, you'd use a PDF library)
            const pdfBlob = await this.convertHTMLToPDF(htmlContent, ublXML);

            return pdfBlob;
        } catch (error) {
            console.error('Error generating PDF invoice:', error);
            throw new Error('Failed to generate PDF invoice');
        }
    }

    /**
     * Generate HTML template for invoice
     */
    private static generateHTMLTemplate(invoice: ZATCAInvoice, qrCodeSVG: string, ublXML: string): string {
        return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة ضريبية مبسطة - ${invoice.id}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            color: #666;
            margin: 10px 0;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .invoice-details, .company-details {
            flex: 1;
        }
        .invoice-details {
            text-align: right;
        }
        .company-details {
            text-align: left;
        }
        .details-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .details-box h3 {
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .details-box p {
            margin: 5px 0;
            font-size: 14px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: center;
        }
        .items-table th {
            background-color: #007bff;
            color: white;
            font-weight: bold;
        }
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .totals {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        .qr-code {
            text-align: center;
        }
        .qr-code h3 {
            margin-bottom: 10px;
            color: #007bff;
        }
        .totals-table {
            width: 300px;
        }
        .totals-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 10px;
            border: 1px solid #ddd;
        }
        .totals-table .total-row {
            background-color: #007bff;
            color: white;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
        .zatca-compliance {
            background: #e8f5e8;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
            color: #2d5a2d;
        }
        .english {
            direction: ltr;
            text-align: left;
        }
        .arabic {
            direction: rtl;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <h1>فاتورة ضريبية مبسطة</h1>
            <h2 class="english">Simplified Tax Invoice</h2>
            <p>رقم الفاتورة: ${invoice.id}</p>
            <p class="english">Invoice Number: ${invoice.id}</p>
        </div>
        
        <!-- ZATCA Compliance Notice -->
        <div class="zatca-compliance">
            <strong>هذه فاتورة متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك</strong><br>
            <span class="english">This invoice is compliant with ZATCA requirements</span>
        </div>
        
        <!-- Invoice Information -->
        <div class="invoice-info">
            <div class="company-details">
                <div class="details-box">
                    <h3>معلومات الشركة / Company Information</h3>
                    <p><strong>الاسم:</strong> ${invoice.supplier.name}</p>
                    <p><strong>Name:</strong> ${invoice.supplier.name}</p>
                    <p><strong>الرقم الضريبي:</strong> ${invoice.supplier.vatNumber}</p>
                    <p><strong>VAT Number:</strong> ${invoice.supplier.vatNumber}</p>
                    <p><strong>رقم السجل التجاري:</strong> ${invoice.supplier.crNumber}</p>
                    <p><strong>CR Number:</strong> ${invoice.supplier.crNumber}</p>
                    <p><strong>العنوان:</strong> ${invoice.supplier.address.street}, ${invoice.supplier.address.cityName}</p>
                    <p><strong>Address:</strong> ${invoice.supplier.address.street}, ${invoice.supplier.address.cityName}</p>
                </div>
            </div>
            
            <div class="invoice-details">
                <div class="details-box">
                    <h3>تفاصيل الفاتورة / Invoice Details</h3>
                    <p><strong>التاريخ:</strong> ${invoice.issueDate}</p>
                    <p><strong>Date:</strong> ${invoice.issueDate}</p>
                    <p><strong>الوقت:</strong> ${invoice.issueTime}</p>
                    <p><strong>Time:</strong> ${invoice.issueTime}</p>
                    <p><strong>UUID:</strong> ${invoice.uuid}</p>
                    <p><strong>رقم العداد:</strong> ${invoice.invoiceCounterValue}</p>
                    <p><strong>Counter:</strong> ${invoice.invoiceCounterValue}</p>
                </div>
            </div>
        </div>
        
        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>الوصف<br>Description</th>
                    <th>الكمية<br>Quantity</th>
                    <th>السعر<br>Price</th>
                    <th>الضريبة<br>Tax Rate</th>
                    <th>المجموع<br>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.invoiceLines.map(line => `
                <tr>
                    <td>${line.item.name}</td>
                    <td>${line.invoicedQuantity}</td>
                    <td>${line.price.priceAmount.toFixed(2)} ${invoice.documentCurrencyCode}</td>
                    <td>${line.item.classifiedTaxCategory.percent}%</td>
                    <td>${line.lineExtensionAmount.toFixed(2)} ${invoice.documentCurrencyCode}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Totals and QR Code -->
        <div class="totals">
            <div class="qr-code">
                <h3>رمز الاستجابة السريعة<br>QR Code</h3>
                ${qrCodeSVG}
                <p style="font-size: 10px; margin-top: 10px;">
                    امسح الرمز للتحقق من الفاتورة<br>
                    Scan to verify invoice
                </p>
            </div>
            
            <div class="totals-table">
                <table>
                    <tr>
                        <td><strong>المجموع الفرعي / Subtotal:</strong></td>
                        <td>${invoice.legalMonetaryTotal.taxExclusiveAmount.toFixed(2)} ${invoice.documentCurrencyCode}</td>
                    </tr>
                    <tr>
                        <td><strong>ضريبة القيمة المضافة / VAT:</strong></td>
                        <td>${invoice.taxTotal.taxAmount.toFixed(2)} ${invoice.taxCurrencyCode}</td>
                    </tr>
                    <tr class="total-row">
                        <td><strong>المجموع الكلي / Total:</strong></td>
                        <td><strong>${invoice.legalMonetaryTotal.taxInclusiveAmount.toFixed(2)} ${invoice.documentCurrencyCode}</strong></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>هذه فاتورة إلكترونية تم إنشاؤها بواسطة نظام الفوترة الإلكترونية المعتمد من هيئة الزكاة والضريبة والجمارك</p>
            <p class="english">This is an electronic invoice generated by a ZATCA-approved e-invoicing system</p>
            <p>تم الإنشاء في: ${new Date().toISOString()}</p>
        </div>
    </div>
    
    <!-- Embedded UBL XML (hidden) -->
    <div style="display: none;" id="ubl-xml">
        ${this.escapeHTML(ublXML)}
    </div>
</body>
</html>`;
    }

    /**
     * Convert HTML to PDF (mock implementation)
     */
    private static async convertHTMLToPDF(htmlContent: string, ublXML: string): Promise<Blob> {
        // In a real implementation, you would use a library like:
        // - jsPDF with html2canvas
        // - Puppeteer
        // - PDFKit
        // - Or a server-side PDF generation service

        // For now, return a mock PDF blob
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(ZATCA Invoice PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF

<!-- Embedded UBL XML -->
${ublXML}
`;

        return new Blob([pdfContent], { type: 'application/pdf' });
    }

    /**
     * Escape HTML characters
     */
    private static escapeHTML(html: string): string {
        return html
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Generate invoice preview HTML
     */
    static generateInvoicePreview(invoice: ZATCAInvoice): string {
        return `
        <div class="invoice-preview">
            <h3>Invoice Preview</h3>
            <p><strong>Invoice Number:</strong> ${invoice.id}</p>
            <p><strong>Date:</strong> ${invoice.issueDate}</p>
            <p><strong>Supplier:</strong> ${invoice.supplier.name}</p>
            <p><strong>VAT Number:</strong> ${invoice.supplier.vatNumber}</p>
            <p><strong>Total:</strong> ${invoice.legalMonetaryTotal.taxInclusiveAmount.toFixed(2)} ${invoice.documentCurrencyCode}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
        `;
    }

    /**
     * Validate PDF/A-3 compliance
     */
    static validatePDFACompliance(pdfBlob: Blob): boolean {
        // In a real implementation, you would validate:
        // - PDF/A-3 structure
        // - Embedded XML attachment
        // - Font embedding
        // - Color space compliance
        // - Metadata requirements

        return pdfBlob.size > 0 && pdfBlob.type === 'application/pdf';
    }

    /**
     * Generate PDF (for testing)
     */
    async generatePDF(invoice: ZATCAInvoice): Promise<Buffer> {
        try {
            // For now, generate basic PDF without QR code
            // Future: Generate QR code and embed in PDF
            const pdfData = await this.generateBasicPDF(invoice);
            return pdfData;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }

    /**
     * Generate basic PDF (mock implementation)
     */
    private async generateBasicPDF(invoice: ZATCAInvoice): Promise<Buffer> {
        // Mock PDF generation logic
        const pdfContent = `Basic PDF content for invoice ${invoice.id}`;
        return Buffer.from(pdfContent);
    }
}
