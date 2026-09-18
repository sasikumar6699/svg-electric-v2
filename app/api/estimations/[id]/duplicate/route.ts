import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { EstimationStatus } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const source = await db.estimation.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: { itemSpecs: true },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: 'Source estimation not found' }, { status: 404 });
    }

    const settings = await db.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = settings?.estimationPrefix || 'EST-';
    const currentYear = new Date().getFullYear();
    const nextNum = settings?.estimationNextNum || 1001;

    const newNumber = settings?.yearBasedNumbering
      ? `${prefix}${currentYear}-${String(nextNum).padStart(5, '0')}`
      : `${prefix}${String(nextNum).padStart(6, '0')}`;

    await db.companySettings.update({
      where: { id: 'default' },
      data: { estimationNextNum: { increment: 1 } },
    });

    const duplicate = await db.estimation.create({
      data: {
        estimationNumber: newNumber,
        date: new Date(),
        validityDays: source.validityDays,
        status: EstimationStatus.DRAFT,
        customerId: source.customerId,
        customerName: source.customerName,
        companyName: source.companyName,
        contactPerson: source.contactPerson,
        phone: source.phone,
        email: source.email,
        address: source.address,
        gstin: source.gstin,
        state: source.state,
        referenceNumber: source.referenceNumber ? `Copy of ${source.referenceNumber}` : `Copy of ${source.estimationNumber}`,
        subtotal: source.subtotal,
        discountPercent: source.discountPercent,
        discountAmount: source.discountAmount,
        taxableAmount: source.taxableAmount,
        taxType: source.taxType,
        cgstRate: source.cgstRate,
        cgstAmount: source.cgstAmount,
        sgstRate: source.sgstRate,
        sgstAmount: source.sgstAmount,
        igstRate: source.igstRate,
        igstAmount: source.igstAmount,
        totalTaxAmount: source.totalTaxAmount,
        grandTotal: source.grandTotal,
        amountInWords: source.amountInWords,
        remarks: source.remarks,
        termsConditions: source.termsConditions,
        createdById: user.userId,
        items: {
          create: source.items.map(it => ({
            productId: it.productId,
            productCodeSnapshot: it.productCodeSnapshot,
            productNameSnapshot: it.productNameSnapshot,
            categorySnapshot: it.categorySnapshot,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.lineTotal,
            priceRuleId: it.priceRuleId,
            specificationsSnapshot: it.specificationsSnapshot as any,
            itemSpecs: {
              create: it.itemSpecs.map(s => ({
                specCode: s.specCode,
                specName: s.specName,
                optionValue: s.optionValue,
                optionLabel: s.optionLabel,
              })),
            },
          })),
        },
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ESTIMATION_DUPLICATED',
        entity: 'Estimation',
        entityId: duplicate.id,
        details: {
          originalId: source.id,
          originalNumber: source.estimationNumber,
          newNumber: duplicate.estimationNumber,
        },
      },
    });

    return NextResponse.json({ success: true, estimation: duplicate });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to duplicate estimation' }, { status: 500 });
  }
}
