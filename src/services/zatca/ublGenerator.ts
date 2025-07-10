import { ZATCAInvoice } from '../../types/zatca';

export class ZATCAUBLGenerator {
    /**
     * Generate UBL XML for ZATCA compliant invoice
     */
    static generateUBLXML(invoice: ZATCAInvoice): string {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent>
                ${this.generateSignatureExtension(invoice)}
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>BR-KSA-12</cbc:CustomizationID>
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${invoice.id}</cbc:ID>
    <cbc:UUID>${invoice.uuid}</cbc:UUID>
    <cbc:IssueDate>${invoice.issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${invoice.issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="0200000">${invoice.invoiceTypeCode}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>${invoice.documentCurrencyCode}</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>${invoice.taxCurrencyCode}</cbc:TaxCurrencyCode>
    
    ${this.generateInvoiceCounterValue(invoice)}
    ${this.generatePreviousInvoiceHash(invoice)}
    
    ${this.generateSupplierParty(invoice)}
    ${invoice.customer ? this.generateCustomerParty(invoice) : ''}
    ${this.generateDelivery(invoice)}
    ${this.generatePaymentMeans(/* invoice */)}
    ${this.generateTaxTotal(invoice)}
    ${this.generateLegalMonetaryTotal(invoice)}
    ${this.generateInvoiceLines(invoice)}
    
</Invoice>`;

        return this.formatXML(xml);
    }

    private static generateSignatureExtension(invoice: ZATCAInvoice): string {
        if (!invoice.cryptographicStamp) {
            return '';
        }

        return `
        <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="signature">
            <ds:SignedInfo>
                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
                <ds:Reference Id="invoiceSignedData" URI="">
                    <ds:Transforms>
                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                            <ds:XPath>not(//ancestor-or-self::ext:UBLExtensions)</ds:XPath>
                        </ds:Transform>
                        <ds:Transform Algorithm="http://www.w3.org/2006/12/xml-c14n11"/>
                    </ds:Transforms>
                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                    <ds:DigestValue></ds:DigestValue>
                </ds:Reference>
            </ds:SignedInfo>
            <ds:SignatureValue>${invoice.cryptographicStamp.digitalSignature}</ds:SignatureValue>
            <ds:KeyInfo>
                <ds:X509Data>
                    <ds:X509Certificate>${invoice.cryptographicStamp.publicKey}</ds:X509Certificate>
                </ds:X509Data>
            </ds:KeyInfo>
        </ds:Signature>`;
    }

    private static generateInvoiceCounterValue(invoice: ZATCAInvoice): string {
        return `
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${invoice.invoiceCounterValue}</cbc:UUID>
    </cac:AdditionalDocumentReference>`;
    }

    private static generatePreviousInvoiceHash(invoice: ZATCAInvoice): string {
        return `
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cac:Attachment>
            <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoice.previousInvoiceHash}</cbc:EmbeddedDocumentBinaryObject>
        </cac:Attachment>
    </cac:AdditionalDocumentReference>`;
    }

    private static generateSupplierParty(invoice: ZATCAInvoice): string {
        return `
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="${invoice.supplier.scheme}">${invoice.supplier.id}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>${invoice.supplier.address.street}</cbc:StreetName>
                ${invoice.supplier.address.additionalStreet ? `<cbc:AdditionalStreetName>${invoice.supplier.address.additionalStreet}</cbc:AdditionalStreetName>` : ''}
                <cbc:BuildingNumber>${invoice.supplier.address.buildingNumber}</cbc:BuildingNumber>
                ${invoice.supplier.address.plotIdentification ? `<cbc:PlotIdentification>${invoice.supplier.address.plotIdentification}</cbc:PlotIdentification>` : ''}
                <cbc:CitySubdivisionName>${invoice.supplier.address.citySubdivision || ''}</cbc:CitySubdivisionName>
                <cbc:CityName>${invoice.supplier.address.cityName}</cbc:CityName>
                <cbc:PostalZone>${invoice.supplier.address.postalZone}</cbc:PostalZone>
                <cbc:CountrySubentity>${invoice.supplier.address.countrySubentity}</cbc:CountrySubentity>
                <cac:Country>
                    <cbc:IdentificationCode>${invoice.supplier.address.countryCode}</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoice.supplier.vatNumber}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${invoice.supplier.name}</cbc:RegistrationName>
                <cbc:CompanyID>${invoice.supplier.crNumber}</cbc:CompanyID>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>`;
    }

    private static generateCustomerParty(invoice: ZATCAInvoice): string {
        if (!invoice.customer) return '';

        return `
    <cac:AccountingCustomerParty>
        <cac:Party>
            ${invoice.customer.address ? `
            <cac:PostalAddress>
                <cbc:StreetName>${invoice.customer.address.street || ''}</cbc:StreetName>
                <cbc:CityName>${invoice.customer.address.cityName || ''}</cbc:CityName>
                <cac:Country>
                    <cbc:IdentificationCode>${invoice.customer.address.countryCode}</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>` : ''}
            ${invoice.customer.vatNumber ? `
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${invoice.customer.vatNumber}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>` : ''}
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${invoice.customer.name || 'End Customer'}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>`;
    }

    private static generateDelivery(invoice: ZATCAInvoice): string {
        return `
    <cac:Delivery>
        <cbc:ActualDeliveryDate>${invoice.issueDate}</cbc:ActualDeliveryDate>
        <cbc:LatestDeliveryDate>${invoice.issueDate}</cbc:LatestDeliveryDate>
    </cac:Delivery>`;
    }

    private static generatePaymentMeans(/* _invoice: ZATCAInvoice */): string {
        return `
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode>10</cbc:PaymentMeansCode>
        <cbc:InstructionNote>Cash</cbc:InstructionNote>
    </cac:PaymentMeans>`;
    }

    private static generateTaxTotal(invoice: ZATCAInvoice): string {
        let taxSubtotals = '';

        for (const subtotal of invoice.taxTotal.taxSubtotals) {
            taxSubtotals += `
            <cac:TaxSubtotal>
                <cbc:TaxableAmount currencyID="${invoice.documentCurrencyCode}">${subtotal.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
                <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${subtotal.taxAmount.toFixed(2)}</cbc:TaxAmount>
                <cac:TaxCategory>
                    <cbc:ID>${subtotal.taxCategory.id}</cbc:ID>
                    <cbc:Percent>${subtotal.taxCategory.percent}</cbc:Percent>
                    <cac:TaxScheme>
                        <cbc:ID>${subtotal.taxCategory.taxScheme}</cbc:ID>
                    </cac:TaxScheme>
                </cac:TaxCategory>
            </cac:TaxSubtotal>`;
        }

        return `
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${invoice.taxTotal.taxAmount.toFixed(2)}</cbc:TaxAmount>
        ${taxSubtotals}
    </cac:TaxTotal>`;
    }

    private static generateLegalMonetaryTotal(invoice: ZATCAInvoice): string {
        return `
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.taxExclusiveAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
        ${invoice.legalMonetaryTotal.allowanceTotalAmount ? `<cbc:AllowanceTotalAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.allowanceTotalAmount.toFixed(2)}</cbc:AllowanceTotalAmount>` : ''}
        ${invoice.legalMonetaryTotal.prepaidAmount ? `<cbc:PrepaidAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.prepaidAmount.toFixed(2)}</cbc:PrepaidAmount>` : ''}
        <cbc:PayableAmount currencyID="${invoice.documentCurrencyCode}">${invoice.legalMonetaryTotal.payableAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>`;
    }

    private static generateInvoiceLines(invoice: ZATCAInvoice): string {
        let lines = '';

        for (const line of invoice.invoiceLines) {
            lines += `
    <cac:InvoiceLine>
        <cbc:ID>${line.id}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="PCE">${line.invoicedQuantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="${invoice.documentCurrencyCode}">${line.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="${invoice.taxCurrencyCode}">${line.taxTotal.taxAmount.toFixed(2)}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="${invoice.taxCurrencyCode}">${line.taxTotal.taxAmount.toFixed(2)}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${line.item.name}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>${line.item.classifiedTaxCategory.id}</cbc:ID>
                <cbc:Percent>${line.item.classifiedTaxCategory.percent}</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>${line.item.classifiedTaxCategory.taxScheme}</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="${invoice.documentCurrencyCode}">${line.price.priceAmount.toFixed(2)}</cbc:PriceAmount>
            <cbc:BaseQuantity unitCode="PCE">${line.price.baseQuantity}</cbc:BaseQuantity>
        </cac:Price>
    </cac:InvoiceLine>`;
        }

        return lines;
    }

    private static formatXML(xml: string): string {
        // Simple XML formatting - in a real implementation, you'd use a proper XML formatter
        return xml.replace(/>\s*</g, '>\n<').replace(/^\s*\n/gm, '');
    }

    /**
     * Validate UBL XML against ZATCA schema
     */
    static validateUBLXML(xml: string): boolean {
        try {
            // Basic validation - check for required elements
            const requiredElements = [
                'Invoice',
                'cbc:UBLVersionID',
                'cbc:CustomizationID',
                'cbc:ProfileID',
                'cbc:ID',
                'cbc:UUID',
                'cbc:IssueDate',
                'cbc:IssueTime',
                'cbc:InvoiceTypeCode',
                'cac:AccountingSupplierParty',
                'cac:TaxTotal',
                'cac:LegalMonetaryTotal',
                'cac:InvoiceLine'
            ];

            for (const element of requiredElements) {
                if (!xml.includes(element)) {
                    console.error(`Missing required element: ${element}`);
                    return false;
                }
            }

            // Check for valid XML structure
            const parser = new DOMParser();
            const doc = parser.parseFromString(xml, 'text/xml');
            const parserError = doc.querySelector('parsererror');

            if (parserError) {
                console.error('XML parsing error:', parserError.textContent);
                return false;
            }

            return true;
        } catch (error) {
            console.error('UBL XML validation error:', error);
            return false;
        }
    }

    async generateUBL(invoice: ZATCAInvoice): Promise<string> {
        try {
            // Use the static method to generate UBL XML
            return ZATCAUBLGenerator.generateUBLXML(invoice);
        } catch (error) {
            console.error('Error generating UBL:', error);
            throw error;
        }
    }
}
