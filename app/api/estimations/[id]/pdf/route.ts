import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateEstimationPDF, EstimationPDFData } from '@/lib/pdf/pdf-generator';
import { EstimationStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const estimation = await db.estimation.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
        items: {
          include: {
            itemSpecs: true,
            product: { include: { category: true } },
          },
        },
      },
    });

    if (!estimation) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    const company = await db.companySettings.findUnique({ where: { id: 'default' } });

    const pdfData: EstimationPDFData = {
      estimationNumber: estimation.estimationNumber,
      date: estimation.date,
      validityDays: estimation.validityDays,
      status: estimation.status,
      referenceNumber: estimation.referenceNumber,
      remarks: estimation.remarks,
      customer: {
        customerName: estimation.customerName,
        companyName: estimation.companyName,
        contactPerson: estimation.contactPerson,
        phone: estimation.phone,
        email: estimation.email,
        address: estimation.address,
        gstin: estimation.gstin,
        state: estimation.state,
      },
      company: {
        companyName: company?.companyName || 'SVG Electric & Control Products',
        tagline: company?.tagline,
        address: company?.address || 'Coimbatore, Tamil Nadu',
        phone: company?.phone || '+91 94432 55678',
        email: company?.email || 'sales@svgelectric.com',
        website: company?.website || 'https://svgelectric.com',
        gstin: company?.gstin || '33AAAFS1234F1ZP',
        termsAndConditions: estimation.termsConditions || company?.termsAndConditions,
        bankDetails: company?.bankDetails,
      },
      items: estimation.items.map((it, idx) => ({
        sNo: idx + 1,
        productName: it.productNameSnapshot,
        productCode: it.productCodeSnapshot,
        category: it.categorySnapshot,
        isManualPrice: it.isManualPrice,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        lineTotal: it.lineTotal,
        specifications: it.itemSpecs.map((s) => ({
          name: s.specName,
          value: s.optionLabel,
          price: s.price,
        })),
      })),
      financials: {
        subtotal: estimation.subtotal,
        discountPercent: estimation.discountPercent,
        discountAmount: estimation.discountAmount,
        installationType: estimation.installationType,
        installationRate: estimation.installationRate,
        installationAmount: estimation.installationAmount,
        freightType: estimation.freightType,
        freightRate: estimation.freightRate,
        freightAmount: estimation.freightAmount,
        taxableAmount: estimation.taxableAmount,
        taxType: estimation.taxType,
        cgstRate: estimation.cgstRate,
        cgstAmount: estimation.cgstAmount,
        sgstRate: estimation.sgstRate,
        sgstAmount: estimation.sgstAmount,
        igstRate: estimation.igstRate,
        igstAmount: estimation.igstAmount,
        totalTaxAmount: estimation.totalTaxAmount,
        grandTotal: estimation.grandTotal,
        amountInWords: estimation.amountInWords,
      },
      createdBy: {
        name: estimation.createdBy.name,
        email: estimation.createdBy.email,
      },
    };

    const pdfBuffer = generateEstimationPDF(pdfData);

    // Update status if it was draft
    if (estimation.status === EstimationStatus.DRAFT) {
      await db.estimation.update({
        where: { id: params.id },
        data: { status: EstimationStatus.PDF_GENERATED },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PDF_GENERATED',
        entity: 'Estimation',
        entityId: estimation.id,
        details: { estimationNumber: estimation.estimationNumber },
      },
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="${estimation.estimationNumber}.pdf"`);

    return new NextResponse(new Uint8Array(pdfBuffer), { status: 200, headers });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
