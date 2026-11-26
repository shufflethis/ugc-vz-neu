import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { getDatabase } from '@/app/lib/database';
import type { CreatorTaxProfile, TaxCountry } from '@/app/lib/payments-ledger';

type SqlClient = ReturnType<typeof getDatabase>;

export const PLATFORM_ISSUER = {
  company: 'track by track GmbH',
  brand: 'UGC VZ',
  street: 'Schliemannstr. 23',
  postalCode: '10437',
  city: 'Berlin',
  country: 'DE',
  vatId: 'DE814954842',
  email: 'hi@ugc-vz.de',
} as const;

export type VatRateType = '0' | '19' | 'reverse_charge';

export interface CreditNoteTaxCalculation {
  netCents: number;
  vatRateType: VatRateType;
  vatPercent: number;
  vatCents: number;
  grossCents: number;
  smallBusiness: boolean;
  taxCategoryCode: 'E' | 'S' | 'AE' | 'O';
  legalNote: string;
}

export interface CreditNoteDocumentInput {
  number: string;
  issuedAtIso: string;
  period: string;
  creator: {
    legalName: string;
    street: string;
    postalCode: string;
    city: string;
    country: TaxCountry;
    smallBusiness: boolean;
    taxNumber: string;
    vatId: string;
  };
  netCents: number;
  description?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatEur(cents: number): string {
  return `${(cents / 100).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

function formatXmlAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatDateDe(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateYmd(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

/**
 * pdf-lib StandardFonts (WinAnsi) safely encodes ASCII + German Umlauts & Euro.
 * Replace any exotic characters outside WinAnsi to avoid encoding exceptions.
 */
function sanitizeWinAnsi(value: string): string {
  return value
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ');
}

/**
 * Umsatzsteuerlogik für Gutschriften (§ 14 Abs. 2 UStG) je Steuerprofil:
 * - DE Kleinunternehmer (§ 19 UStG): 0 %
 * - DE Regelbesteuerung: 19 %
 * - AT: 0 % Reverse Charge
 * - CH: 0 % nicht steuerbare Drittlandsleistung
 */
export function calculateCreditNoteTax(
  netCents: number,
  profile: Pick<CreatorTaxProfile, 'country' | 'smallBusiness'>,
): CreditNoteTaxCalculation {
  const safeNet = Math.max(0, Math.round(netCents));

  if (profile.country === 'DE') {
    if (profile.smallBusiness) {
      return {
        netCents: safeNet,
        vatRateType: '0',
        vatPercent: 0,
        vatCents: 0,
        grossCents: safeNet,
        smallBusiness: true,
        taxCategoryCode: 'E',
        legalNote: 'Kein Ausweis von Umsatzsteuer, da Kleinunternehmer gemäß § 19 UStG.',
      };
    }
    const vatCents = Math.round(safeNet * 0.19);
    return {
      netCents: safeNet,
      vatRateType: '19',
      vatPercent: 19,
      vatCents,
      grossCents: safeNet + vatCents,
      smallBusiness: false,
      taxCategoryCode: 'S',
      legalNote: 'Enthält 19 % gesetzliche Umsatzsteuer gemäß § 12 Abs. 1 UStG.',
    };
  }

  if (profile.country === 'AT') {
    return {
      netCents: safeNet,
      vatRateType: 'reverse_charge',
      vatPercent: 0,
      vatCents: 0,
      grossCents: safeNet,
      smallBusiness: Boolean(profile.smallBusiness),
      taxCategoryCode: 'AE',
      legalNote: 'Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge, § 13b UStG).',
    };
  }

  return {
    netCents: safeNet,
    vatRateType: '0',
    vatPercent: 0,
    vatCents: 0,
    grossCents: safeNet,
    smallBusiness: Boolean(profile.smallBusiness),
    taxCategoryCode: 'O',
    legalNote: 'Nicht steuerbare sonstige Leistung im Drittland (Schweiz, § 3a Abs. 2 UStG).',
  };
}

/**
 * ZUGFeRD 2.x / EN16931 CrossIndustryInvoice XML (TypeCode 389 = Self-billed Invoice / Gutschrift).
 */
export function buildZugferdCreditNoteXml(
  input: CreditNoteDocumentInput,
  tax: CreditNoteTaxCalculation,
): string {
  const issueYmd = formatDateYmd(input.issuedAtIso);
  const sellerTaxId = input.creator.vatId || input.creator.taxNumber;
  const sellerTaxScheme = input.creator.vatId ? 'VA' : 'FC';
  const desc = input.description || `Creator-Vergütung geprüfte Kampagnen-Views (${input.period})`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(input.number)}</ram:ID>
    <ram:TypeCode>389</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${issueYmd}</udt:DateTimeString>
    </ram:IssueDateTime>
    <ram:IncludedNote>
      <ram:Content>${escapeXml(tax.legalNote)}</ram:Content>
    </ram:IncludedNote>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>1</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${escapeXml(desc)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${formatXmlAmount(tax.netCents)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">1</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${tax.taxCategoryCode}</ram:CategoryCode>
          <ram:RateApplicablePercent>${tax.vatPercent.toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${formatXmlAmount(tax.netCents)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(input.creator.legalName)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(input.creator.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(input.creator.street)}</ram:LineOne>
          <ram:CityName>${escapeXml(input.creator.city)}</ram:CityName>
          <ram:CountryID>${escapeXml(input.creator.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${sellerTaxId ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="${sellerTaxScheme}">${escapeXml(sellerTaxId)}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
      </ram:SellerTradeParty>
      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(PLATFORM_ISSUER.company)}</ram:Name>
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${PLATFORM_ISSUER.postalCode}</ram:PostcodeCode>
          <ram:LineOne>${PLATFORM_ISSUER.street}</ram:LineOne>
          <ram:CityName>${PLATFORM_ISSUER.city}</ram:CityName>
          <ram:CountryID>${PLATFORM_ISSUER.country}</ram:CountryID>
        </ram:PostalTradeAddress>
        <ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${PLATFORM_ISSUER.vatId}</ram:ID>
        </ram:SpecifiedTaxRegistration>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery />
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${formatXmlAmount(tax.vatCents)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:ExemptionReason>${escapeXml(tax.legalNote)}</ram:ExemptionReason>
        <ram:BasisAmount>${formatXmlAmount(tax.netCents)}</ram:BasisAmount>
        <ram:CategoryCode>${tax.taxCategoryCode}</ram:CategoryCode>
        <ram:RateApplicablePercent>${tax.vatPercent.toFixed(2)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${formatXmlAmount(tax.netCents)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${formatXmlAmount(tax.netCents)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${formatXmlAmount(tax.vatCents)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${formatXmlAmount(tax.grossCents)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${formatXmlAmount(tax.grossCents)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

/**
 * Erzeugt ein PDF mit eingebetteter ZUGFeRD-Datei (`factur-x.xml`) nach § 14 Abs. 2 & 4 UStG.
 */
export async function generateCreditNotePdfWithZugferd(
  input: CreditNoteDocumentInput,
): Promise<{ pdfBytes: Uint8Array; xml: string; tax: CreditNoteTaxCalculation }> {
  const tax = calculateCreditNoteTax(input.netCents, {
    country: input.creator.country,
    smallBusiness: input.creator.smallBusiness,
  });
  const xml = buildZugferdCreditNoteXml(input, tax);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Gutschrift ${input.number}`);
  pdfDoc.setAuthor(PLATFORM_ISSUER.company);
  pdfDoc.setSubject(`UGC VZ Gutschrift ${input.number}`);
  pdfDoc.setCreator('UGC VZ Billing Engine');

  // ZUGFeRD / Factur-X XML einbetten
  await pdfDoc.attach(Buffer.from(xml, 'utf8'), 'factur-x.xml', {
    mimeType: 'application/xml',
    description: 'ZUGFeRD EN16931 Gutschrift XML',
    creationDate: new Date(input.issuedAtIso),
    modificationDate: new Date(input.issuedAtIso),
  });

  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const brandBlue = rgb(0.024, 0.271, 0.561); // #06458F Directory Blue
  const brandRed = rgb(0.949, 0.027, 0.165); // #F2072A Creator Red
  const ink = rgb(0.125, 0.129, 0.141); // #202124
  const muted = rgb(0.361, 0.392, 0.439); // #5C6470
  const line = rgb(0.863, 0.886, 0.918); // #DCE2EA
  const cloud = rgb(0.961, 0.969, 0.98); // #F5F7FA

  // ugcVZ Brand CI Kopfstreifen (Directory Blue + Creator Red Akzent)
  page.drawRectangle({ x: 0, y: 833, width: 490, height: 9, color: brandBlue });
  page.drawRectangle({ x: 490, y: 833, width: 105.28, height: 9, color: brandRed });

  let y = 795;
  const left = 50;

  page.drawText('ugc', { x: left, y: y + 18, size: 11, font: bold, color: brandBlue });
  page.drawText('VZ', { x: left + 20, y: y + 18, size: 11, font: bold, color: brandRed });
  page.drawText('  Das Creatorverzeichnis · ugc-vz.de', { x: left + 36, y: y + 18, size: 8.5, font, color: muted });

  // Kopfzeile: Pflichtwort "Gutschrift" (§ 14 Abs. 4 Nr. 10 UStG)
  page.drawText('GUTSCHRIFT', { x: left, y: y - 4, size: 22, font: bold, color: brandBlue });
  page.drawText(`Nr. ${sanitizeWinAnsi(input.number)}`, { x: 410, y: y, size: 12, font: bold, color: ink });
  y -= 26;
  page.drawText(`Ausstellungsdatum: ${formatDateDe(input.issuedAtIso)}`, { x: 410, y, size: 9, font, color: muted });
  page.drawText(`Leistungszeitraum: ${sanitizeWinAnsi(input.period)}`, { x: left, y, size: 10, font, color: muted });

  y -= 32;
  page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 1, color: line });
  y -= 24;
  void cloud;

  // Leistender Unternehmer (Creator) vs. Leistungsempfänger (track by track GmbH)
  page.drawText('Leistender Unternehmer (Creator):', { x: left, y, size: 9, font: bold, color: muted });
  page.drawText('Leistungsempfänger (Aussteller):', { x: 310, y, size: 9, font: bold, color: muted });
  y -= 16;

  page.drawText(sanitizeWinAnsi(input.creator.legalName), { x: left, y, size: 11, font: bold, color: ink });
  page.drawText(PLATFORM_ISSUER.company, { x: 310, y, size: 11, font: bold, color: ink });
  y -= 15;
  page.drawText(sanitizeWinAnsi(input.creator.street), { x: left, y, size: 10, font, color: ink });
  page.drawText(`${PLATFORM_ISSUER.brand} / ${PLATFORM_ISSUER.street}`, { x: 310, y, size: 10, font, color: ink });
  y -= 15;
  page.drawText(sanitizeWinAnsi(`${input.creator.postalCode} ${input.creator.city} (${input.creator.country})`), { x: left, y, size: 10, font, color: ink });
  page.drawText(`${PLATFORM_ISSUER.postalCode} ${PLATFORM_ISSUER.city} (${PLATFORM_ISSUER.country})`, { x: 310, y, size: 10, font, color: ink });
  y -= 15;

  const creatorTaxLine = input.creator.vatId
    ? `USt-IdNr.: ${input.creator.vatId}`
    : input.creator.taxNumber
      ? `Steuernummer: ${input.creator.taxNumber}`
      : 'Steuernummer: hinterlegt';
  page.drawText(sanitizeWinAnsi(creatorTaxLine), { x: left, y, size: 9, font, color: muted });
  page.drawText(`USt-IdNr.: ${PLATFORM_ISSUER.vatId}`, { x: 310, y, size: 9, font, color: muted });

  // Positionstabelle
  y -= 42;
  page.drawRectangle({ x: left, y: y - 6, width: 495, height: 22, color: rgb(0.97, 0.96, 0.95) });
  page.drawText('Beschreibung', { x: left + 8, y, size: 9, font: bold, color: ink });
  page.drawText('Netto', { x: 455, y, size: 9, font: bold, color: ink });
  y -= 24;

  const desc = input.description || `Creator-Vergütung geprüfte Kampagnen-Views (${input.period})`;
  page.drawText(sanitizeWinAnsi(desc), { x: left + 8, y, size: 10, font, color: ink });
  page.drawText(formatEur(tax.netCents), { x: 455, y, size: 10, font, color: ink });
  y -= 18;
  page.drawText('Plattformgebühr für Creator: 0 % (kein Abzug)', { x: left + 8, y, size: 9, font, color: muted });
  page.drawText('0,00 EUR', { x: 455, y, size: 9, font, color: muted });

  y -= 26;
  page.drawLine({ start: { x: 310, y }, end: { x: 545, y }, thickness: 1, color: line });
  y -= 18;

  page.drawText('Nettobetrag:', { x: 310, y, size: 10, font, color: ink });
  page.drawText(formatEur(tax.netCents), { x: 455, y, size: 10, font, color: ink });
  y -= 16;

  const vatLabel =
    tax.vatRateType === '19'
      ? 'Umsatzsteuer (19 %):'
      : tax.vatRateType === 'reverse_charge'
        ? 'Umsatzsteuer (Reverse Charge):'
        : 'Umsatzsteuer (0 %):';
  page.drawText(vatLabel, { x: 310, y, size: 10, font, color: ink });
  page.drawText(formatEur(tax.vatCents), { x: 455, y, size: 10, font, color: ink });
  y -= 18;

  page.drawText('Auszahlungsbetrag (Brutto):', { x: 310, y, size: 11, font: bold, color: ink });
  page.drawText(formatEur(tax.grossCents), { x: 455, y, size: 11, font: bold, color: ink });

  // Pflichthinweise
  y -= 42;
  page.drawText(sanitizeWinAnsi(tax.legalNote), { x: left, y, size: 9.5, font: bold, color: ink });
  y -= 16;
  page.drawText('Erstellt im Gutschriftverfahren gemäß § 14 Abs. 2 Satz 2 UStG (ZUGFeRD XML eingebettet).', {
    x: left,
    y,
    size: 8.5,
    font,
    color: muted,
  });

  // Footer
  page.drawLine({ start: { x: left, y: 72 }, end: { x: 545, y: 72 }, thickness: 0.75, color: line });
  page.drawText(
    `${PLATFORM_ISSUER.company} · ${PLATFORM_ISSUER.street}, ${PLATFORM_ISSUER.postalCode} ${PLATFORM_ISSUER.city} · USt-IdNr. ${PLATFORM_ISSUER.vatId} · ${PLATFORM_ISSUER.email}`,
    { x: left, y: 54, size: 8, font, color: muted },
  );

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, xml, tax };
}

/**
 * Erzeugt eine PDF-Rechnung für Marken-Aufladungen inkl. getrennter Zeile für Kartengebühr (Spec 8.9).
 */
export async function generateBrandTopupInvoicePdf(input: {
  invoiceNumber: string;
  issuedAtIso: string;
  brandCompany: string;
  brandEmail: string;
  amountCents: number;
  surchargeCents: number;
  surchargeLabel: string;
  totalChargedCents: number;
  methodLabel: string;
  platformFeePercent?: number;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Rechnung ${input.invoiceNumber}`);
  pdfDoc.setAuthor(PLATFORM_ISSUER.company);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const brandBlue = rgb(0.024, 0.271, 0.561); // #06458F Directory Blue
  const brandRed = rgb(0.949, 0.027, 0.165); // #F2072A Creator Red
  const ink = rgb(0.125, 0.129, 0.141); // #202124
  const muted = rgb(0.361, 0.392, 0.439); // #5C6470
  const line = rgb(0.863, 0.886, 0.918); // #DCE2EA

  // ugcVZ Brand CI Kopfstreifen
  page.drawRectangle({ x: 0, y: 833, width: 490, height: 9, color: brandBlue });
  page.drawRectangle({ x: 490, y: 833, width: 105.28, height: 9, color: brandRed });

  let y = 795;
  const left = 50;

  page.drawText('ugc', { x: left, y: y + 18, size: 11, font: bold, color: brandBlue });
  page.drawText('VZ', { x: left + 20, y: y + 18, size: 11, font: bold, color: brandRed });
  page.drawText('  Das Creatorverzeichnis · ugc-vz.de', { x: left + 36, y: y + 18, size: 8.5, font, color: muted });

  page.drawText('RECHNUNG', { x: left, y: y - 4, size: 22, font: bold, color: brandBlue });
  page.drawText(`Nr. ${sanitizeWinAnsi(input.invoiceNumber)}`, { x: 410, y: y, size: 12, font: bold, color: ink });
  y -= 24;
  page.drawText(`Datum: ${formatDateDe(input.issuedAtIso)}`, { x: 410, y, size: 9, font, color: muted });
  page.drawText(`Zahlungsart: ${sanitizeWinAnsi(input.methodLabel)}`, { x: left, y, size: 9.5, font, color: muted });

  y -= 28;
  page.drawLine({ start: { x: left, y }, end: { x: 545, y }, thickness: 1, color: line });
  y -= 22;

  page.drawText('Rechnungsempfänger:', { x: left, y, size: 9, font: bold, color: muted });
  page.drawText('Aussteller:', { x: 310, y, size: 9, font: bold, color: muted });
  y -= 16;
  page.drawText(sanitizeWinAnsi(input.brandCompany || input.brandEmail), { x: left, y, size: 11, font: bold, color: ink });
  page.drawText(PLATFORM_ISSUER.company, { x: 310, y, size: 11, font: bold, color: ink });
  y -= 15;
  page.drawText(sanitizeWinAnsi(input.brandEmail), { x: left, y, size: 9.5, font, color: muted });
  page.drawText(`${PLATFORM_ISSUER.street}, ${PLATFORM_ISSUER.postalCode} ${PLATFORM_ISSUER.city}`, { x: 310, y, size: 9.5, font, color: ink });
  y -= 14;
  page.drawText(`USt-IdNr.: ${PLATFORM_ISSUER.vatId}`, { x: 310, y, size: 9, font, color: muted });

  y -= 38;
  page.drawRectangle({ x: left, y: y - 6, width: 495, height: 22, color: rgb(0.961, 0.969, 0.98) });
  page.drawText('Position', { x: left + 8, y, size: 9, font: bold, color: ink });
  page.drawText('Betrag', { x: 455, y, size: 9, font: bold, color: ink });
  y -= 24;

  const feePct = input.platformFeePercent ?? 15;
  const feeShareCents = Math.round((input.amountCents * feePct) / 100);
  const creatorPoolCents = input.amountCents - feeShareCents;

  page.drawText('Kampagnenguthaben UGC VZ (Creator-Pool)', { x: left + 8, y, size: 10, font, color: ink });
  page.drawText(formatEur(creatorPoolCents), { x: 455, y, size: 10, font, color: ink });
  y -= 18;
  page.drawText(`Servicegebühr UGC VZ (${feePct} %, im Budget enthalten)`, { x: left + 8, y, size: 10, font, color: ink });
  page.drawText(formatEur(feeShareCents), { x: 455, y, size: 10, font, color: ink });

  if (input.surchargeCents > 0) {
    y -= 18;
    page.drawText(sanitizeWinAnsi(`${input.surchargeLabel || 'Kartengebühr'} (3 %)`), {
      x: left + 8,
      y,
      size: 10,
      font: bold,
      color: ink,
    });
    page.drawText(formatEur(input.surchargeCents), { x: 455, y, size: 10, font: bold, color: ink });
  }

  y -= 26;
  page.drawLine({ start: { x: 310, y }, end: { x: 545, y }, thickness: 1, color: line });
  y -= 18;

  page.drawText('Gesamtbetrag:', { x: 310, y, size: 11, font: bold, color: ink });
  page.drawText(formatEur(input.totalChargedCents), { x: 455, y, size: 11, font: bold, color: ink });

  y -= 36;
  page.drawText('Alle Beträge in EUR. Kampagnenguthaben wird bei regulierten Zahlungsdienstleistern verwahrt.', {
    x: left,
    y,
    size: 8.5,
    font,
    color: muted,
  });

  page.drawLine({ start: { x: left, y: 72 }, end: { x: 545, y: 72 }, thickness: 0.75, color: line });
  page.drawText(
    `${PLATFORM_ISSUER.company} · ${PLATFORM_ISSUER.street}, ${PLATFORM_ISSUER.postalCode} ${PLATFORM_ISSUER.city} · USt-IdNr. ${PLATFORM_ISSUER.vatId}`,
    { x: left, y: 54, size: 8, font, color: muted },
  );

  return pdfDoc.save();
}

/**
 * Erstellt und speichert eine fortlaufende Gutschrift (GS-YYYY-NNNNNN) idempotent für einen bezahlten Creator-Payout.
 */
export async function issueCreditNoteForPayout(
  sql: SqlClient,
  input: {
    payoutId: string;
    creatorId: string;
    amountCents: number;
    taxProfile: CreatorTaxProfile;
    period?: string;
  },
): Promise<{
  id: string;
  number: string;
  pdfBytes: Uint8Array;
  xml: string;
  tax: CreditNoteTaxCalculation;
}> {
  const existing = await sql.query(
    `SELECT id, number, period, net_cents, vat_rate_type, vat_cents, gross_cents, small_business, xml_payload, issued_at
     FROM credit_notes WHERE payout_id = $1 LIMIT 1`,
    [input.payoutId],
  );

  const now = new Date();
  const period =
    input.period ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  if (existing.length > 0) {
    const row = existing[0];
    const generated = await generateCreditNotePdfWithZugferd({
      number: String(row.number),
      issuedAtIso: new Date(String(row.issued_at)).toISOString(),
      period: String(row.period),
      creator: {
        legalName: input.taxProfile.legalName,
        street: input.taxProfile.street,
        postalCode: input.taxProfile.postalCode,
        city: input.taxProfile.city,
        country: input.taxProfile.country,
        smallBusiness: Boolean(row.small_business),
        taxNumber: input.taxProfile.taxNumber,
        vatId: input.taxProfile.vatId,
      },
      netCents: Number(row.net_cents),
    });
    return {
      id: String(row.id),
      number: String(row.number),
      ...generated,
    };
  }

  const year = now.getFullYear();
  const [seqRow] = await sql.query(
    `SELECT COUNT(*)::int AS cnt FROM credit_notes WHERE number LIKE $1`,
    [`GS-${year}-%`],
  );
  const nextSeq = Number(seqRow?.cnt || 0) + 1;
  const number = `GS-${year}-${String(nextSeq).padStart(6, '0')}`;
  const issuedAtIso = now.toISOString();

  const generated = await generateCreditNotePdfWithZugferd({
    number,
    issuedAtIso,
    period,
    creator: {
      legalName: input.taxProfile.legalName,
      street: input.taxProfile.street,
      postalCode: input.taxProfile.postalCode,
      city: input.taxProfile.city,
      country: input.taxProfile.country,
      smallBusiness: input.taxProfile.smallBusiness,
      taxNumber: input.taxProfile.taxNumber,
      vatId: input.taxProfile.vatId,
    },
    netCents: input.amountCents,
  });

  const [saved] = await sql.query(
    `INSERT INTO credit_notes (
       number, creator_id, payout_id, period, net_cents, vat_rate_type,
       vat_cents, gross_cents, small_business, xml_payload, issued_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz)
     RETURNING id, number`,
    [
      number,
      input.creatorId,
      input.payoutId,
      period,
      generated.tax.netCents,
      generated.tax.vatRateType,
      generated.tax.vatCents,
      generated.tax.grossCents,
      generated.tax.smallBusiness,
      generated.xml,
      issuedAtIso,
    ],
  );

  await sql.query(
    `UPDATE creator_payouts SET credit_note_id = $1 WHERE id = $2`,
    [saved.id, input.payoutId],
  );

  return {
    id: String(saved.id),
    number: String(saved.number),
    ...generated,
  };
}
