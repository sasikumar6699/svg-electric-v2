import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
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
 * Formats currency amounts as "Rs. 1,91,000.00" using ASCII characters.
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
        // fallback
      }
    }
  }
  return null;
}

export async function generateEstimationPDF(data: EstimationPDFData): Promise<Buffer> {
  // Digital Verification QR Code Generation (placed on top right)
  const qrVerifyUrl = `https://svgelectric.com/verify?est=${encodeURIComponent(data.estimationNumber)}&val=${encodeURIComponent(String(data.financials.grandTotal))}`;
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(qrVerifyUrl, {
      width: 140,
      margin: 1,
      color: { dark: '#0B2545', light: '#FFFFFF' },
      errorCorrectionLevel: 'M',
    });
  } catch (e) {
    console.warn('QR generation fallback:', e);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.setFont('times', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // --- TOP ACCENT BARS ---
  doc.setFillColor(11, 37, 69); // Deep Navy
  doc.rect(0, 0, pageWidth, 5.0, 'F');
  doc.setFillColor(220, 38, 38); // Red
  doc.rect(0, 5.0, pageWidth, 1.2, 'F');

  let currentY = 10.5;

  // =========================================================================
  // TOP HEADER: SVG Name & Address (LEFT-ALIGNED) and QR Code (RIGHT-ALIGNED)
  // =========================================================================
  const logoData = getLogoBase64();
  let textLeft = margin;
  const qrSize = 21;
  const qrX = pageWidth - margin - qrSize;

  if (logoData) {
    const logoWidth = 32;
    const logoHeight = 17.4;
    doc.addImage(logoData, 'JPEG', margin, currentY + 0.5, logoWidth, logoHeight);
    textLeft = margin + logoWidth + 4;
  }

  // Company Name (Left-Aligned)
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(11, 37, 69);
  doc.text(data.company.companyName.toUpperCase(), textLeft, currentY + 3.5);

  // Address & Contacts (Left-Aligned)
  doc.setFont('times', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(data.company.address, textLeft, currentY + 7.5);
  doc.text(
    `Phone: ${data.company.phone}   |   Email: ${data.company.email}   |   Web: ${data.company.website}`,
    textLeft,
    currentY + 11.2
  );

  doc.setFont('times', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${data.company.gstin}`, textLeft, currentY + 15.0);

  // QR Code (Right-Aligned)
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', qrX, currentY, qrSize, qrSize);
    doc.setFont('times', 'bold');
    doc.setFontSize(4.6);
    doc.setTextColor(11, 37, 69);
    doc.text('SCAN TO VERIFY', qrX + qrSize / 2, currentY + qrSize + 2.5, { align: 'center' });
  }

  currentY = Math.max(currentY + 18, currentY + qrSize + 4.5);

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;

  // =========================================================================
  // HEADING: COMMERCIAL ESTIMATION & SPECIFICATION SUMMARY
  // =========================================================================
  const ribbonHeight = 7.5;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, ribbonHeight, 1, 1, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(11, 37, 69);
  doc.text('COMMERCIAL ESTIMATION & SPECIFICATION SUMMARY', margin + 3.5, currentY + 5.2);

  doc.setFont('times', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  const estDate = data.date instanceof Date ? data.date : new Date(data.date);
  const quoteRef = `Ref: ${data.estimationNumber}`;
  const quoteDate = `Date: ${format(estDate, 'dd-MMM-yyyy')}`;
  doc.text(`${quoteRef}   |   ${quoteDate}`, pageWidth - margin - 3.5, currentY + 5.2, { align: 'right' });

  currentY += ribbonHeight + 4.5;

  // =========================================================================
  // TABLE: Columns -> S. No | Product ID | Description | Base Price
  // =========================================================================
  const tableData = data.items.map((item, idx) => {
    let descLines: string[] = [item.productName.toUpperCase()];
    if (item.category) {
      descLines.push(`Category: ${item.category}`);
    }
    if (item.specifications && item.specifications.length > 0) {
      descLines.push('');
      descLines.push('Technical Specifications & Options:');
      item.specifications.forEach((s) => {
        const pDelta = s.price && s.price > 0 ? ` (+ ${formatCurrencyPDF(s.price)})` : '';
        descLines.push(`  • ${s.name}: ${s.value}${pDelta}`);
      });
    }

    return [
      (idx + 1).toString(),
      item.productCode || `P-${item.sNo}`,
      descLines.join('\n'),
      formatCurrencyPDF(item.unitPrice),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['S. No', 'Product ID', 'Description', 'Base Price']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 37, 69],
      textColor: [255, 255, 255],
      font: 'times',
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
    },
    bodyStyles: {
      font: 'times',
      fontSize: 7.6,
      textColor: [30, 41, 59],
      cellPadding: { top: 3.5, bottom: 3.5, left: 3, right: 3 },
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 97, halign: 'left' },
      3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // =========================================================================
  // BELOW TABLE:
  // LEFT: Amount in words
  // RIGHT: Total estimation value with all variants and tax calculations
  // =========================================================================
  const summaryWidth = 86;
  const summaryX = pageWidth - margin - summaryWidth;
  const wordsWidth = summaryX - margin - 6;
  const isIntra = data.financials.taxType === 'INTRA_STATE';

  interface SummaryRow {
    label: string;
    amount: string;
    isBold?: boolean;
    isDeduction?: boolean;
  }

  const summaryRows: SummaryRow[] = [
    { label: 'Subtotal (Base Items):', amount: formatCurrencyPDF(data.financials.subtotal) },
  ];

  if ((data.financials.discountAmount || 0) > 0) {
    summaryRows.push({
      label: `Discount (${data.financials.discountPercent}%):`,
      amount: `- ${formatCurrencyPDF(data.financials.discountAmount)}`,
      isDeduction: true,
    });
  }

  if ((data.financials.installationAmount || 0) > 0) {
    summaryRows.push({
      label: 'Installation & Testing:',
      amount: `+ ${formatCurrencyPDF(data.financials.installationAmount)}`,
    });
  }

  if ((data.financials.freightAmount || 0) > 0) {
    summaryRows.push({
      label: 'Freight & Transit:',
      amount: `+ ${formatCurrencyPDF(data.financials.freightAmount)}`,
    });
  }

  summaryRows.push({
    label: 'Net Ex-Works Taxable Value:',
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

  const rowHeight = 4.6;
  const grandTotalHeight = 8.5;
  const summaryBoxHeight = 5 + summaryRows.length * rowHeight + grandTotalHeight;

  // Check if box fits on page
  if (currentY + summaryBoxHeight + 25 > pageHeight) {
    doc.addPage();
    currentY = 16;
  }

  // Left Box: Amount in Words
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, wordsWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(11, 37, 69);
  doc.text('AMOUNT IN WORDS (INR):', margin + 4, currentY + 5.5);

  doc.setFont('times', 'italic');
  doc.setFontSize(8.2);
  doc.setTextColor(15, 23, 42);
  const words = data.financials.amountInWords || numberToIndianWords(data.financials.grandTotal);
  const splitWords = doc.splitTextToSize(words, wordsWidth - 8);
  doc.text(splitWords, margin + 4, currentY + 11.5);

  doc.setFont('times', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Commercial estimation basis: Ex-Works Barur. Valid for 30 calendar days.', margin + 4, currentY + summaryBoxHeight - 4.5);

  // Right Box: Total Estimation Value with Variants & Tax Calculations
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(summaryX, currentY, summaryWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  const rightTextX = summaryX + summaryWidth - 4;

  for (let i = 0; i < summaryRows.length; i++) {
    const row = summaryRows[i];
    const rY = currentY + 4.8 + i * rowHeight;
    doc.setFont('times', row.isBold ? 'bold' : 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(row.isBold ? 15 : 71, row.isBold ? 23 : 85, row.isBold ? 42 : 105);
    doc.text(row.label, summaryX + 4, rY);

    if (row.isDeduction) doc.setTextColor(185, 28, 28);
    doc.text(row.amount, rightTextX, rY, { align: 'right' });
  }

  // Highlighted Total Bar
  const totalBarY = currentY + summaryBoxHeight - grandTotalHeight;
  doc.setFillColor(11, 37, 69);
  doc.rect(summaryX, totalBarY, summaryWidth, grandTotalHeight, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL ESTIMATION VALUE:', summaryX + 4, totalBarY + 5.6);
  doc.text(formatCurrencyPDF(data.financials.grandTotal), rightTextX, totalBarY + 5.6, { align: 'right' });

  currentY += summaryBoxHeight + 8;

  // =========================================================================
  // BELOW THAT ON LEFT: AUTHORISED SIGNATORY (NO SEAL, NO COMMERCIAL CONDITIONS)
  // =========================================================================
  doc.setFont('times', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(11, 37, 69);
  doc.text(`For ${data.company.companyName.toUpperCase()}`, margin, currentY);

  currentY += 18;

  doc.setFont('times', 'italic');
  doc.setFontSize(7.8);
  doc.setTextColor(71, 85, 105);
  doc.text('(Authorised Signatory)', margin, currentY);

  // =========================================================================
  // FOOTER ON ALL PAGES
  // =========================================================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${data.company.companyName}  •  Commercial Estimation & Specification Summary`,
      margin,
      pageHeight - 6
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  return Buffer.from(doc.output('arraybuffer'));
}
