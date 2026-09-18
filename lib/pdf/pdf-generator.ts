import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToIndianWords } from '@/lib/utils';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';

export interface EstimationPDFData {
  estimationNumber: string;
  date: Date | string;
  validityDays: number;
  status: string;
  referenceNumber?: string | null;
  remarks?: string | null;
  customer: {
    customerName: string;
    companyName: string;
    contactPerson?: string | null;
    phone: string;
    email?: string | null;
    address: string;
    gstin?: string | null;
    state?: string | null;
  };
  company: {
    companyName: string;
    tagline?: string | null;
    address: string;
    phone: string;
    email: string;
    website: string;
    gstin: string;
    termsAndConditions?: string | null;
    bankDetails?: string | null;
  };
  items: Array<{
    sNo: number;
    productName: string;
    productCode: string;
    category: string;
    isManualPrice?: boolean;
    specifications: Array<{ name: string; value: string; price?: number }>;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  financials: {
    subtotal: number;
    discountPercent: number;
    discountAmount: number;
    installationType?: string;
    installationRate?: number;
    installationAmount?: number;
    freightType?: string;
    freightRate?: number;
    freightAmount?: number;
    taxableAmount: number;
    taxType: string;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
    totalTaxAmount: number;
    grandTotal: number;
    amountInWords?: string | null;
  };
  createdBy: {
    name: string;
    email: string;
  };
}

/**
 * Formats currency amounts as "Rs. 1,91,000.00" using pure ASCII characters.
 * This completely avoids the Type-1 PDF font glyph encoding issue where the Unicode ₹ symbol
 * was rendering as superscript "¹" and throwing off right-alignment text calculations.
 */
export function formatCurrencyPDF(amount: number | null | undefined): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const numStr = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(val);
  return `Rs. ${numStr}`;
}

let cachedLogoBase64: string | null = null;

function getLogoBase64(): string | null {
  if (cachedLogoBase64) return cachedLogoBase64;
  const candidatePaths = [
    path.join(process.cwd(), 'public', 'logo.jpg'),
    path.join(process.cwd(), 'lib', 'pdf', 'assets', 'logo.jpg'),
    path.join(process.cwd(), 'public', 'electcare-logo.jpg'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const buf = fs.readFileSync(p);
        cachedLogoBase64 = `data:image/jpeg;base64,${buf.toString('base64')}`;
        return cachedLogoBase64;
      } catch (e) {
        // ignore and fallback
      }
    }
  }
  return null;
}

export function generateEstimationPDF(data: EstimationPDFData): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Set Times New Roman as primary default font family
  doc.setFont('times', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 13;

  // Helper for drawing clean underlined text
  const drawUnderlinedText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    fontStyle: 'bold' | 'normal' | 'italic' = 'bold',
    color: [number, number, number] = [11, 37, 69]
  ) => {
    doc.setFont('times', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    doc.text(text, x, y);
    const textWidth = doc.getTextWidth(text);
    doc.setDrawColor(...color);
    doc.setLineWidth(0.3);
    doc.line(x, y + 0.8, x + textWidth, y + 0.8);
  };

  // --- TOP BRAND ACCENT BARS ---
  // Deep Navy top bar
  doc.setFillColor(11, 37, 69); // #0B2545 deep navy
  doc.rect(0, 0, pageWidth, 5.5, 'F');
  // ElectCare Red accent bar
  doc.setFillColor(220, 38, 38); // #DC2626 bright red matching logo
  doc.rect(0, 5.5, pageWidth, 1.5, 'F');

  // --- BRAND HEADER BLOCK (2-Column Segregated Layout with Logo) ---
  const col1Left = margin; // 14mm
  const col2Left = margin + 118; // 132mm
  const col2Width = pageWidth - margin - col2Left; // 64mm (ends at 196mm)

  const logoData = getLogoBase64();
  let textLeft = col1Left;
  let textWidth = 114;

  if (logoData) {
    const logoWidth = 38;
    const logoHeight = 20.6; // 38mm / 1.842 aspect ratio
    doc.addImage(logoData, 'JPEG', col1Left, currentY + 1.5, logoWidth, logoHeight);
    textLeft = col1Left + logoWidth + 4; // 14 + 38 + 4 = 56mm
    textWidth = col2Left - textLeft - 3; // 132 - 56 - 3 = 73mm
  }

  // Company Details next to logo (or full left column if logo absent)
  doc.setFont('times', 'bold');
  doc.setFontSize(logoData ? 12 : 15);
  doc.setTextColor(11, 37, 69);
  const compNameLines = doc.splitTextToSize(data.company.companyName.toUpperCase(), textWidth);
  doc.text(compNameLines, textLeft, currentY + 4);
  let compY = currentY + 4 + compNameLines.length * 4.2;

  if (data.company.tagline) {
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const tagLines = doc.splitTextToSize(data.company.tagline, textWidth);
    doc.text(tagLines, textLeft, compY);
    compY += tagLines.length * 3.3;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  const addrLines = doc.splitTextToSize(data.company.address, textWidth);
  doc.text(addrLines, textLeft, compY);
  compY += addrLines.length * 3.2;

  const contactText = `Phone: ${data.company.phone} | Email: ${data.company.email}`;
  const contactLines = doc.splitTextToSize(contactText, textWidth);
  doc.text(contactLines, textLeft, compY);
  compY += contactLines.length * 3.2;

  doc.setFont('times', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${data.company.gstin}`, textLeft, compY);
  compY += 3.8;

  // Right Column: Segregated Estimation Badge Box
  const estBoxY = 13;
  const estBoxHeight = 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(col2Left, estBoxY, col2Width, estBoxHeight, 2, 2, 'FD');

  // Header strip inside badge
  doc.setFillColor(11, 37, 69);
  doc.roundedRect(col2Left, estBoxY, col2Width, 7.5, 2, 2, 'F');
  doc.rect(col2Left, estBoxY + 4, col2Width, 3.5, 'F'); // flatten lower corners

  const badgeCenterX = col2Left + col2Width / 2;
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ESTIMATION', badgeCenterX, estBoxY + 5.2, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`No: ${data.estimationNumber}`, badgeCenterX, estBoxY + 13.5, { align: 'center' });

  const estDate = data.date instanceof Date ? data.date : new Date(data.date);
  doc.setFont('times', 'italic');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${format(estDate, 'dd-MMM-yyyy')}`, badgeCenterX, estBoxY + 18.5, { align: 'center' });

  if (data.validityDays) {
    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Validity: ${data.validityDays} Days`, badgeCenterX, estBoxY + 23, { align: 'center' });
  }

  currentY = Math.max(compY + 2, estBoxY + estBoxHeight + 3.5);

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 4;

  // --- CUSTOMER / BILL TO BLOCK (Estimation details box removed) ---
  const custBoxWidth = pageWidth - margin * 2; // 182mm
  const custBoxHeight = 26;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, custBoxWidth, custBoxHeight, 1.5, 1.5, 'FD');

  // Customer header with clean underline
  drawUnderlinedText('CUSTOMER / BILL TO:', margin + 4, currentY + 5.5, 8.5, 'bold', [11, 37, 69]);

  // Left column of Customer card: Company Name, Attn, Address
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.customer.companyName, margin + 4, currentY + 11);

  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let custLineY = currentY + 15.5;
  if (data.customer.contactPerson) {
    doc.text(`Attn: ${data.customer.contactPerson}`, margin + 4, custLineY);
    custLineY += 4.2;
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(7.8);
  const splitCustAddress = doc.splitTextToSize(data.customer.address, 115);
  doc.text(splitCustAddress, margin + 4, custLineY);

  // Right column of Customer card: GSTIN, State, Contact, Reference RFQ
  const custRightX = margin + 122;
  doc.setFont('times', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${data.customer.gstin || 'Unregistered / Not Provided'}`, custRightX, currentY + 11);

  doc.setFont('times', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  if (data.customer.state) {
    doc.text(`State: ${data.customer.state}`, custRightX, currentY + 15.5);
  }
  if (data.customer.phone) {
    doc.text(`Phone: ${data.customer.phone}`, custRightX, currentY + 19.8);
  }
  if (data.referenceNumber) {
    doc.setFont('times', 'italic');
    doc.text(`Ref / RFQ: ${data.referenceNumber}`, custRightX, currentY + 23.8);
  }

  currentY += custBoxHeight + 5;

  // --- ITEMS TABLE ---
  // Specifications displayed in clean bulletin format WITHOUT individual prices
  const tableData = data.items.map((item) => {
    const specsFormatted = item.specifications
      .map((s) => `  •  ${s.name}: ${s.value}`)
      .join('\n');

    const descCell = `${item.productName.toUpperCase()}\n[Item Code: ${item.productCode} | ${item.category}]\n\nTechnical Specifications:\n${specsFormatted}`;

    const unitPriceDisplay = `${formatCurrencyPDF(item.unitPrice)}${item.isManualPrice ? '\n(Manual Rate)' : ''}`;

    return [
      item.sNo.toString(),
      descCell,
      item.quantity.toString(),
      unitPriceDisplay,
      formatCurrencyPDF(item.lineTotal),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['S.No', 'Description & Technical Specifications', 'Qty', 'Unit Price', 'Amount']],
    body: tableData,
    theme: 'grid',
    tableWidth: 182,
    headStyles: {
      font: 'times',
      fillColor: [11, 37, 69],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center', // Single line and center aligned for all headers!
      valign: 'middle',
      cellPadding: { top: 3.5, bottom: 3.5, left: 2, right: 2 },
    },
    styles: {
      font: 'times',
      fontSize: 7.8,
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 4 },
      textColor: [30, 41, 59],
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 94, halign: 'left' },
      2: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 31, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 31, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // --- FINANCIAL TOTALS & AMOUNT IN WORDS BLOCK ---
  const hasDiscount = (data.financials.discountAmount || 0) > 0;
  const hasInstallation = (data.financials.installationAmount || 0) > 0;
  const hasFreight = (data.financials.freightAmount || 0) > 0;
  const isIntra = data.financials.taxType === 'INTRA_STATE';

  interface SummaryRow {
    label: string;
    amount: string;
    isBold?: boolean;
    isDeduction?: boolean;
  }

  const summaryRows: SummaryRow[] = [
    { label: 'Subtotal (Line Items):', amount: formatCurrencyPDF(data.financials.subtotal) },
  ];

  if (hasDiscount) {
    summaryRows.push({
      label: `Discount (${data.financials.discountPercent}%):`,
      amount: `- ${formatCurrencyPDF(data.financials.discountAmount)}`,
      isDeduction: true,
    });
  }

  if (hasInstallation) {
    const label =
      data.financials.installationType === 'PERCENTAGE'
        ? `Installation & Comm. (${data.financials.installationRate}%):`
        : 'Installation & Comm. (Fixed):';
    summaryRows.push({
      label,
      amount: `+ ${formatCurrencyPDF(data.financials.installationAmount || 0)}`,
    });
  }

  if (hasFreight) {
    const label =
      data.financials.freightType === 'PERCENTAGE'
        ? `Freight & Transit (${data.financials.freightRate}%):`
        : 'Freight & Transit (Fixed):';
    summaryRows.push({
      label,
      amount: `+ ${formatCurrencyPDF(data.financials.freightAmount || 0)}`,
    });
  }

  summaryRows.push({
    label: 'Taxable Assessable Value:',
    amount: formatCurrencyPDF(data.financials.taxableAmount),
    isBold: true,
  });

  if (isIntra) {
    summaryRows.push({
      label: `CGST (${data.financials.cgstRate}%):`,
      amount: formatCurrencyPDF(data.financials.cgstAmount),
    });
    summaryRows.push({
      label: `SGST (${data.financials.sgstRate}%):`,
      amount: formatCurrencyPDF(data.financials.sgstAmount),
    });
  } else {
    summaryRows.push({
      label: `IGST (${data.financials.igstRate}%):`,
      amount: formatCurrencyPDF(data.financials.igstAmount),
    });
  }

  const rowHeight = 5.2;
  const grandTotalHeight = 9.0;
  const boxTopPadding = 3.0;
  const totalBoxHeight = boxTopPadding + summaryRows.length * rowHeight + grandTotalHeight;

  // Check if financial summary fits on page or needs new page
  if (currentY + totalBoxHeight + 35 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }

  const summaryWidth = 88;
  const summaryX = pageWidth - margin - summaryWidth; // 108mm
  const rightPriceX = summaryX + summaryWidth - 6.0; // 6mm safely inside the right border to ensure zero overflow

  // Draw Financial Summary Container Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX, currentY, summaryWidth, totalBoxHeight, 1.5, 1.5, 'FD');

  // Render individual summary rows
  for (let i = 0; i < summaryRows.length; i++) {
    const row = summaryRows[i];
    const rowY = currentY + boxTopPadding + i * rowHeight + 3.8;

    doc.setFont('times', row.isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(row.isBold ? 11 : 71, row.isBold ? 37 : 85, row.isBold ? 69 : 105);
    doc.text(row.label, summaryX + 5, rowY);

    if (row.isDeduction) {
      doc.setTextColor(185, 28, 28);
    }
    doc.text(row.amount, rightPriceX, rowY, { align: 'right' });
  }

  // Grand Total Highlight Bar (Sits completely inside the bottom of the box)
  const grandTotalY = currentY + totalBoxHeight - grandTotalHeight;
  doc.setFillColor(11, 37, 69);
  doc.rect(summaryX, grandTotalY, summaryWidth, grandTotalHeight, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryX + 5, grandTotalY + 5.8);
  doc.text(formatCurrencyPDF(data.financials.grandTotal), rightPriceX, grandTotalY + 5.8, { align: 'right' });

  // Amount In Words Box on Left Side (Symmetrical height)
  const wordsBoxWidth = summaryX - margin - 5;
  const wordsBoxHeight = totalBoxHeight;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, wordsBoxWidth, wordsBoxHeight, 1.5, 1.5, 'FD');

  drawUnderlinedText('AMOUNT IN WORDS (INR):', margin + 4, currentY + 6.0, 7.8, 'bold', [11, 37, 69]);

  doc.setFont('times', 'italic');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  const words = data.financials.amountInWords || numberToIndianWords(data.financials.grandTotal);
  const splitWords = doc.splitTextToSize(words, wordsBoxWidth - 8);
  doc.text(splitWords, margin + 4, currentY + 12.5);

  currentY += totalBoxHeight + 6;

  // Remarks if any
  if (data.remarks) {
    drawUnderlinedText('REMARKS:', margin, currentY, 8, 'bold', [11, 37, 69]);
    currentY += 4;
    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitRemarks = doc.splitTextToSize(data.remarks, pageWidth - margin * 2);
    doc.text(splitRemarks, margin, currentY);
    currentY += splitRemarks.length * 3.5 + 4;
  }

  // Terms and conditions
  if (data.company.termsAndConditions) {
    if (currentY + 35 > pageHeight) {
      doc.addPage();
      currentY = 20;
    }
    drawUnderlinedText('TERMS & CONDITIONS:', margin, currentY, 8.5, 'bold', [11, 37, 69]);
    currentY += 4.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    const splitTerms = doc.splitTextToSize(data.company.termsAndConditions, pageWidth - margin * 2);
    doc.text(splitTerms, margin, currentY);
    currentY += splitTerms.length * 3.3 + 8;
  }

  // Authorized Signatory (Centered directly below company name)
  if (currentY + 28 > pageHeight) {
    doc.addPage();
    currentY = 20;
  }

  const signBlockWidth = 70;
  const signBlockX = pageWidth - margin - signBlockWidth;
  const signCenterX = signBlockX + signBlockWidth / 2;

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 37, 69);
  doc.text(`For ${data.company.companyName.toUpperCase()}`, signCenterX, currentY + 6, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Authorized Signatory)', signCenterX, currentY + 24, { align: 'center' });

  // Footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.text(
      `This is a system generated technical & commercial estimation quotation. Subject to terms & conditions.`,
      margin,
      pageHeight - 7
    );

    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}
