import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { numberToIndianWords } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function formatCurrencyPDF(amount: number | null | undefined): string {
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
        // ignore fallback
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const currentModel = body.currentModel;

    if (!currentModel) {
      return NextResponse.json({ error: 'Model information is required' }, { status: 400 });
    }

    const customer = {
      companyName: body.customerInfo?.companyName || body.customerName || 'Valued Industrial Customer',
      customerName: body.customerInfo?.customerName || body.customerInfo?.contactPerson || body.customerName || 'Project Engineering In-charge',
      phone: body.customerInfo?.phone || '+91 - Not Specified',
      email: body.customerInfo?.email || '',
      siteLocation: body.customerInfo?.siteLocation || body.projectSite || 'Tamil Nadu, India',
    };

    const rawBreakdown = Array.isArray(body.selectedBreakdown) && body.selectedBreakdown.length > 0
      ? body.selectedBreakdown
      : (Array.isArray(body.selectedUpgrades) ? body.selectedUpgrades : []);

    const selectedBreakdown = rawBreakdown.map((item: any) => ({
      dimensionName: item.dimensionName || item.dimension || item.specName || 'Variant',
      selectedOptionName: item.selectedOptionName || item.option || item.optionName || 'Standard Baseline',
      priceDelta: Number(item.priceDelta !== undefined && item.priceDelta !== null ? item.priceDelta : item.delta) || 0,
      description: item.description || '',
    }));

    const baseExWorks = Number(currentModel.finalExWorksPrice) || Number(currentModel.baseSellingPrice) || 0;
    const totalDelta = Number(body.totalDelta) !== undefined && !isNaN(Number(body.totalDelta)) && Number(body.totalDelta) !== 0
      ? Number(body.totalDelta)
      : (Number(body.commercial?.upgradesTotal) || selectedBreakdown.reduce((sum: number, b: any) => sum + (b.priceDelta || 0), 0));
    const netExWorks = Number(body.netExWorks) || Number(body.commercial?.netExWorks) || (baseExWorks + totalDelta);
    const gst18 = Number(body.gst18) || Number(body.commercial?.gst18) || Math.round(netExWorks * 0.18);
    const totalProposalPrice = Number(body.totalProposalPrice) || Number(body.commercial?.totalProposal) || (netExWorks + gst18);

    // Digital Verification QR Code Generation (placed at top-right)
    const qrVerifyUrl = `https://svgelectric.com/verify?est=${encodeURIComponent(currentModel.modelNumber)}&date=${encodeURIComponent(new Date().toISOString().split('T')[0])}&val=${encodeURIComponent(String(totalProposalPrice))}`;
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrVerifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0B2545',
          light: '#FFFFFF',
        },
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

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;

    // --- TOP BRAND ACCENT BARS ---
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
    const textAvailableWidth = qrX - textLeft - 6;

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
    doc.text('SVG ELECTRIC & CONTROL PRODUCTS', textLeft, currentY + 3.5);

    // Company Address & Contacts (Left-Aligned)
    doc.setFont('times', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(
      '# 1/22 Perumal Kovil Street, Barur (Po), Pochampalli (Tk), Krishnagiri (Dt) - 635201, Tamil Nadu, India.',
      textLeft,
      currentY + 7.5
    );
    doc.text(
      'Phone: +91 88707 19804 / +91 63827 92780   |   Email: sales@svgelectric.com   |   Web: www.svgelectric.com',
      textLeft,
      currentY + 11.2
    );

    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('GSTIN: 33AAAFS1234F1ZP', textLeft, currentY + 15.0);

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
    const quoteRef = `Ref: SVG/EST/${currentModel.modelNumber}/${new Date().getFullYear()}`;
    const quoteDate = `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
    doc.text(`${quoteRef}   |   ${quoteDate}`, pageWidth - margin - 3.5, currentY + 5.2, { align: 'right' });

    currentY += ribbonHeight + 4.5;

    // =========================================================================
    // TABLE: Columns -> S. No | Product ID | Description | Base Price
    // =========================================================================
    const modelDisplayName = currentModel.name || currentModel.modelNumber || 'Standard Industrial Control Panel';
    const catLabel = typeof currentModel.category === 'object' && currentModel.category?.name
      ? currentModel.category.name
      : (typeof currentModel.category === 'string' ? currentModel.category : 'Power Control Switchboard');

    const enclosureDimText = `${currentModel.enclosureHeight || 0}mm (H) × ${currentModel.enclosureWidth || 0}mm (W) × ${currentModel.enclosureDepth || 0}mm (D)`;
    const ipRatingText = currentModel.ipRating || 'IP54';
    const formRatingText = currentModel.formRating || 'Form 2B';

    // Build Description with Model, Category, Dimensions, Ratings, and Selected Variants
    let descLines: string[] = [
      `${modelDisplayName.toUpperCase()}`,
      `Category: ${catLabel}   |   Enclosure Dimensions: ${enclosureDimText}`,
      `Ingress Protection: ${ipRatingText}   |   Form of Separation: ${formRatingText} (IEC 61439-1/2)`,
      `Construction: 2.0mm Heavy-Duty CRCA Steel Powder Coated (RAL 7032/7035)`,
    ];

    if (selectedBreakdown.length > 0) {
      descLines.push('');
      descLines.push('Configured Technical Variants:');
      selectedBreakdown.forEach((b: any) => {
        const deltaNote = b.priceDelta !== 0 ? ` (+ ${formatCurrencyPDF(b.priceDelta)})` : ' (Standard)';
        descLines.push(`  • ${b.dimensionName}: ${b.selectedOptionName}${deltaNote}`);
      });
    }

    const descriptionContent = descLines.join('\n');

    const tableData = [
      [
        '1',
        currentModel.modelNumber,
        descriptionContent,
        formatCurrencyPDF(baseExWorks),
      ],
    ];

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
    const summaryBoxHeight = 35;

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
    const words = numberToIndianWords(totalProposalPrice);
    const splitWords = doc.splitTextToSize(words, wordsWidth - 8);
    doc.text(splitWords, margin + 4, currentY + 11.5);

    doc.setFont('times', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Commercial estimation basis: Ex-Works Barur. Valid for 30 calendar days.', margin + 4, currentY + 30.5);

    // Right Box: Total Estimation Value with Variants & Tax Calculations
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(summaryX, currentY, summaryWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

    const rightTextX = summaryX + summaryWidth - 4;
    let sY = currentY + 4.8;

    doc.setFont('times', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Base Model Ex-Works Price:', summaryX + 4, sY);
    doc.text(formatCurrencyPDF(baseExWorks), rightTextX, sY, { align: 'right' });

    sY += 4.6;
    doc.text('Configured Variants Delta:', summaryX + 4, sY);
    doc.text(`+ ${formatCurrencyPDF(totalDelta)}`, rightTextX, sY, { align: 'right' });

    sY += 4.6;
    doc.setFont('times', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Net Ex-Works Selling Price:', summaryX + 4, sY);
    doc.text(formatCurrencyPDF(netExWorks), rightTextX, sY, { align: 'right' });

    sY += 4.6;
    doc.setFont('times', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('Goods & Services Tax (GST 18%):', summaryX + 4, sY);
    doc.text(formatCurrencyPDF(gst18), rightTextX, sY, { align: 'right' });

    // Highlighted Total Bar
    const totalBarY = currentY + summaryBoxHeight - 8.5;
    doc.setFillColor(11, 37, 69);
    doc.rect(summaryX, totalBarY, summaryWidth, 8.5, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL ESTIMATION VALUE:', summaryX + 4, totalBarY + 5.6);
    doc.text(formatCurrencyPDF(totalProposalPrice), rightTextX, totalBarY + 5.6, { align: 'right' });

    currentY += summaryBoxHeight + 8;

    // =========================================================================
    // BELOW THAT ON LEFT: AUTHORISED SIGNATORY (NO SEAL, NO COMMERCIAL CONDITIONS)
    // =========================================================================
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(11, 37, 69);
    doc.text('For SVG ELECTRIC & CONTROL PRODUCTS', margin, currentY);

    currentY += 18;

    doc.setFont('times', 'italic');
    doc.setFontSize(7.8);
    doc.setTextColor(71, 85, 105);
    doc.text('(Authorised Signatory)', margin, currentY);

    // =========================================================================
    // FOOTER
    // =========================================================================
    doc.setFont('times', 'italic');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'SVG Electric & Control Products  •  Barur, Krishnagiri  •  Commercial Estimation & Specification Summary',
      margin,
      pageHeight - 6
    );
    doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 6, { align: 'right' });

    // NOTE: BOM IS KEPT STRICTLY IN EXCEL FORMAT, NOT ADDED IN PDF DOWNLOAD AS INSTRUCTED.

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Automatically record this estimation in db.estimation for Recent Estimations History
    try {
      const settings = await db.companySettings.findUnique({ where: { id: 'default' } });
      const prefix = settings?.estimationPrefix || 'EST-';
      const currentYear = new Date().getFullYear();
      const nextNum = settings?.estimationNextNum || 1001;

      const estNumber = settings?.yearBasedNumbering
        ? `${prefix}${currentYear}-${String(nextNum).padStart(5, '0')}`
        : `${prefix}${String(nextNum).padStart(6, '0')}`;

      // Increment next estimation number
      await db.companySettings.update({
        where: { id: 'default' },
        data: { estimationNextNum: { increment: 1 } },
      });

      const clientCompanyName = customer.companyName && customer.companyName !== 'Valued Industrial Customer'
        ? customer.companyName
        : (customer.customerName || 'Valued Industrial Customer');

      let customerId: string | null = null;
      try {
        const existingCust = await db.customer.findFirst({
          where: { companyName: { equals: clientCompanyName, mode: 'insensitive' } },
        });
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const newCust = await db.customer.create({
            data: {
              companyName: clientCompanyName,
              customerName: customer.customerName || 'Project In-charge',
              phone: customer.phone || '+91 - Not Specified',
              address: customer.siteLocation || 'Tamil Nadu',
            },
          });
          customerId = newCust.id;
        }
      } catch (custErr) {
        console.warn('[Proposal PDF] Customer upsert notice:', custErr);
      }

      await db.estimation.create({
        data: {
          estimationNumber: estNumber,
          date: new Date(),
          validityDays: 30,
          status: 'PDF_GENERATED',
          customerId,
          customerName: customer.customerName || 'Project In-charge',
          companyName: clientCompanyName,
          contactPerson: customer.customerName || 'Project In-charge',
          phone: customer.phone || '+91 - Not Specified',
          address: customer.siteLocation || 'Tamil Nadu, India',
          subtotal: netExWorks,
          taxableAmount: netExWorks,
          taxType: 'INTRA_STATE',
          cgstRate: 9.0,
          cgstAmount: Math.round(gst18 / 2),
          sgstRate: 9.0,
          sgstAmount: Math.round(gst18 / 2),
          totalTaxAmount: gst18,
          grandTotal: totalProposalPrice,
          amountInWords: numberToIndianWords(totalProposalPrice),
          remarks: `Panel Upgradation Estimation: ${currentModel.modelNumber} (${modelDisplayName})`,
          referenceNumber: `SVG/EST/${currentModel.modelNumber}/${currentYear}`,
          createdById: session.userId,
        },
      });
    } catch (saveErr) {
      console.warn('[Proposal PDF] Could not auto-save estimation record:', saveErr);
    }

    const filename = `SVG_Estimation_${currentModel.modelNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('[Proposal PDF] Error generating proposal PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate proposal PDF' },
      { status: 500 }
    );
  }
}
