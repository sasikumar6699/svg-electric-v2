import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { numberToIndianWords } from '@/lib/utils';
import { EstimationStatus } from '@prisma/client';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const estimation = await db.estimation.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
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

    return NextResponse.json({ estimation });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load estimation' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.estimation.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    if (existing.status === EstimationStatus.FINALIZED && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Finalized estimations cannot be modified by Sales Users.' }, { status: 403 });
    }

    const data = await request.json();

    // Delete existing items to recreate
    await db.estimationItem.deleteMany({ where: { estimationId: params.id } });

    let subtotal = 0;
    const itemRecords: any[] = [];

    for (const it of data.items || []) {
      const lineTotal = Math.round(Number(it.unitPrice) * Number(it.quantity) * 100) / 100;
      subtotal += lineTotal;

      itemRecords.push({
        estimationId: params.id,
        productId: it.productId,
        productCodeSnapshot: it.productCode,
        productNameSnapshot: it.productName,
        categorySnapshot: it.category || 'General',
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice),
        lineTotal,
        priceRuleId: it.priceRuleId || null,
        isManualPrice: Boolean(it.isManualPrice),
        specificationsSnapshot: it.specifications || {},
        itemSpecs: {
          create: (it.detailedSpecs || []).map((ds: any) => ({
            specCode: ds.code,
            specName: ds.name,
            optionValue: String(ds.value),
            optionLabel: String(ds.label || ds.value),
            price: Number(ds.price) || 0.0,
          })),
        },
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const settings = await db.companySettings.findUnique({ where: { id: 'default' } });
    const discountPercent = Number(data.discountPercent) || 0;
    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const netSubtotal = Math.max(0, subtotal - discountAmount);

    const installationType = data.installationType || 'PERCENTAGE';
    const installationRate = Number(data.installationRate) || 0;
    let installationAmount = Number(data.installationAmount) || 0;
    if (installationType === 'PERCENTAGE') {
      installationAmount = Math.round((netSubtotal * installationRate) / 100 * 100) / 100;
    } else if (installationType === 'NONE') {
      installationAmount = 0;
    }

    const freightType = data.freightType || 'PERCENTAGE';
    const freightRate = Number(data.freightRate) || 0;
    let freightAmount = Number(data.freightAmount) || 0;
    if (freightType === 'PERCENTAGE') {
      freightAmount = Math.round((netSubtotal * freightRate) / 100 * 100) / 100;
    } else if (freightType === 'NONE') {
      freightAmount = 0;
    }

    const taxableAmount = Math.round((netSubtotal + installationAmount + freightAmount) * 100) / 100;

    const taxType = data.taxType === 'INTER_STATE' ? 'INTER_STATE' : 'INTRA_STATE';
    const cgstRate = taxType === 'INTRA_STATE' ? (settings?.defaultCGSTRate ?? 9.0) : 0;
    const sgstRate = taxType === 'INTRA_STATE' ? (settings?.defaultSGSTRate ?? 9.0) : 0;
    const igstRate = taxType === 'INTER_STATE' ? (settings?.defaultIGSTRate ?? 18.0) : 0;

    const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100;
    const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100;
    const igstAmount = Math.round((taxableAmount * igstRate) / 100 * 100) / 100;
    const totalTaxAmount = Math.round((cgstAmount + sgstAmount + igstAmount) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + totalTaxAmount) * 100) / 100;
    const amountInWords = numberToIndianWords(grandTotal);

    for (const ir of itemRecords) {
      await db.estimationItem.create({ data: ir });
    }

    let newStatus = existing.status;
    if (data.status === 'FINALIZED') {
      newStatus = EstimationStatus.FINALIZED;
    } else if (data.status === 'PENDING_APPROVAL') {
      newStatus = EstimationStatus.PENDING_APPROVAL;
    } else if (data.status === 'DRAFT') {
      newStatus = EstimationStatus.DRAFT;
    }

    const updated = await db.estimation.update({
      where: { id: params.id },
      data: {
        customerName: data.customerName,
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        gstin: data.gstin || null,
        state: data.state || 'Tamil Nadu',
        referenceNumber: data.referenceNumber || null,
        validityDays: Number(data.validityDays) || 30,
        subtotal,
        discountPercent,
        discountAmount,
        installationType,
        installationRate,
        installationAmount,
        freightType,
        freightRate,
        freightAmount,
        taxableAmount,
        taxType,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalTaxAmount,
        grandTotal,
        amountInWords,
        remarks: data.remarks || null,
        termsConditions: data.termsConditions || null,
        status: newStatus,
      },
      include: {
        items: { include: { itemSpecs: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ESTIMATION_UPDATED',
        entity: 'Estimation',
        entityId: updated.id,
        details: {
          estimationNumber: updated.estimationNumber,
          grandTotal: updated.grandTotal,
          installationAmount: updated.installationAmount,
          freightAmount: updated.freightAmount,
        },
      },
    });

    return NextResponse.json({ success: true, estimation: updated });
  } catch (error: any) {
    console.error('Estimation update error:', error);
    return NextResponse.json({ error: 'Failed to update estimation' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await db.estimation.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    if (existing.status === EstimationStatus.FINALIZED && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can delete finalized estimations.' }, { status: 403 });
    }

    await db.estimation.delete({ where: { id: params.id } });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ESTIMATION_DELETED',
        entity: 'Estimation',
        entityId: params.id,
        details: { estimationNumber: existing.estimationNumber },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete estimation' }, { status: 500 });
  }
}
