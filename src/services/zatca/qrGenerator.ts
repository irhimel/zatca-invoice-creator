import { QRCodeData, TLVData, ZATCAInvoice } from '../../types/zatca';

export class ZATCAQRCodeGenerator {
    /**
     * Generate TLV (Tag-Length-Value) encoded QR code data
     * According to ZATCA specification
     */
    static generateTLVData(data: QRCodeData): TLVData[] {
        const tlvData: TLVData[] = [];

        // Tag 1: Seller Name (UTF-8)
        const sellerNameBytes = new TextEncoder().encode(data.sellerName);
        tlvData.push({
            tag: 1,
            length: sellerNameBytes.length,
            value: data.sellerName
        });

        // Tag 2: VAT Registration Number
        const vatNumberBytes = new TextEncoder().encode(data.vatNumber);
        tlvData.push({
            tag: 2,
            length: vatNumberBytes.length,
            value: data.vatNumber
        });

        // Tag 3: Invoice Timestamp (ISO 8601)
        const timestampBytes = new TextEncoder().encode(data.timestamp);
        tlvData.push({
            tag: 3,
            length: timestampBytes.length,
            value: data.timestamp
        });

        // Tag 4: Invoice Total (with VAT)
        const invoiceTotalStr = data.invoiceTotal.toFixed(2);
        const invoiceTotalBytes = new TextEncoder().encode(invoiceTotalStr);
        tlvData.push({
            tag: 4,
            length: invoiceTotalBytes.length,
            value: invoiceTotalStr
        });

        // Tag 5: VAT Total
        const vatTotalStr = data.vatTotal.toFixed(2);
        const vatTotalBytes = new TextEncoder().encode(vatTotalStr);
        tlvData.push({
            tag: 5,
            length: vatTotalBytes.length,
            value: vatTotalStr
        });

        return tlvData;
    }

    /**
     * Convert TLV data to binary format
     */
    static tlvToBinary(tlvData: TLVData[]): Uint8Array {
        let totalLength = 0;

        // Calculate total length needed
        for (const tlv of tlvData) {
            const valueBytes = typeof tlv.value === 'string'
                ? new TextEncoder().encode(tlv.value)
                : tlv.value;
            totalLength += 1 + 1 + valueBytes.length; // tag + length + value
        }

        const buffer = new Uint8Array(totalLength);
        let offset = 0;

        for (const tlv of tlvData) {
            const valueBytes = typeof tlv.value === 'string'
                ? new TextEncoder().encode(tlv.value)
                : tlv.value;

            // Write tag (1 byte)
            buffer[offset] = tlv.tag;
            offset += 1;

            // Write length (1 byte)
            buffer[offset] = valueBytes.length;
            offset += 1;

            // Write value
            buffer.set(valueBytes, offset);
            offset += valueBytes.length;
        }

        return buffer;
    }

    /**
     * Convert binary data to Base64
     */
    static binaryToBase64(binary: Uint8Array): string {
        // Convert Uint8Array to string
        let binaryString = '';
        for (let i = 0; i < binary.length; i++) {
            binaryString += String.fromCharCode(binary[i]);
        }

        // Convert to Base64
        return btoa(binaryString);
    }

    /**
     * Generate Base64 encoded QR code data
     */
    static generateQRCodeData(data: QRCodeData): string {
        const tlvData = this.generateTLVData(data);
        const binaryData = this.tlvToBinary(tlvData);
        return this.binaryToBase64(binaryData);
    }

    /**
     * Generate QR code SVG
     */
    static async generateQRCodeSVG(data: QRCodeData): Promise<string> {
        const qrData = this.generateQRCodeData(data);

        // For now, return a placeholder SVG
        // In a real implementation, you would use a QR code library like qrcode
        return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="white"/>
            <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
                QR Code: ${qrData.substring(0, 20)}...
            </text>
        </svg>`;
    }

    /**
     * Validate QR code data format
     */
    static validateQRCodeData(data: QRCodeData): boolean {
        try {
            // Check required fields
            if (!data.sellerName || !data.vatNumber || !data.timestamp) {
                return false;
            }

            // Validate VAT number format (15 digits)
            const vatRegex = /^\d{15}$/;
            if (!vatRegex.test(data.vatNumber)) {
                return false;
            }

            // Validate timestamp format (ISO 8601)
            const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
            if (!timestampRegex.test(data.timestamp)) {
                return false;
            }

            // Validate amounts
            if (data.invoiceTotal < 0 || data.vatTotal < 0) {
                return false;
            }

            return true;
        } catch (error) {
            console.error('QR code validation error:', error);
            return false;
        }
    }

    /**
     * Generate QR code for invoice
     */
    static async generateInvoiceQRCode(invoice: ZATCAInvoice): Promise<string> {
        const qrData: QRCodeData = {
            sellerName: invoice.supplier.name,
            vatNumber: invoice.supplier.vatNumber,
            timestamp: invoice.issueDate,
            invoiceTotal: invoice.legalMonetaryTotal.payableAmount,
            vatTotal: invoice.taxTotal.taxAmount
        };

        return this.generateQRCodeSVG(qrData);
    }

    private encodeTLV(tag: number, value: string): Buffer {
        const valueBuffer = Buffer.from(value, 'utf8');
        const lengthBuffer = Buffer.alloc(1);
        lengthBuffer.writeUInt8(valueBuffer.length, 0);

        return Buffer.concat([
            Buffer.from([tag]),
            lengthBuffer,
            valueBuffer
        ]);
    }
}
