import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { numberToIndianWords } from '@/lib/utils';
import { EstimationStatus } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const customerId = searchParams.get('customerId') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '15', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (user.role === 'SALES_USER') {
      where.OR = [
        { createdById: user.userId },
        { status: { in: [EstimationStatus.PENDING_APPROVAL, EstimationStatus.REVISION_REQUESTED, EstimationStatus.APPROVED, EstimationStatus.REJECTED, EstimationStatus.FINALIZED, EstimationStatus.PDF_GENERATED] } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status as EstimationStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { estimationNumber: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
            { customerName: { contains: search, mode: 'insensitive' } },
            { referenceNumber: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [total, estimations] = await Promise.all([
      db.estimation.count({ where }),
      db.estimation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { name: true, email: true } },
          items: { select: { id: true, productNameSnapshot: true, quantity: true, lineTotal: true, isManualPrice: true } },
        },
      }),
    ]);

    return NextResponse.json({
      estimations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Fetch estimations error:', error);
    return NextResponse.json({ error: 'Failed to fetch estimations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await request.json();

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: 'Estimation must include at least one product item.' }, { status: 400 });
    }

    if (!data.companyName || !data.customerName || !data.phone || !data.address) {
      return NextResponse.json({ error: 'Customer details (Company, Name, Phone, Address) are required.' }, { status: 400 });
    }

    // Company Settings for estimation numbering & tax
    const settings = await db.companySettings.findUnique({ where: { id: 'default' } });
    const prefix = settings?.estimationPrefix || 'EST-';
    const currentYear = new Date().getFullYear();
    const nextNum = settings?.estimationNextNum || 1001;

    const estimationNumber = settings?.yearBasedNumbering
      ? `${prefix}${currentYear}-${String(nextNum).padStart(5, '0')}`
      : `${prefix}${String(nextNum).padStart(6, '0')}`;

    // Increment estimation number atomically
    await db.companySettings.update({
      where: { id: 'default' },
      data: { estimationNextNum: { increment: 1 } },
    });

    // Compute line items and verify snapshots
    let subtotal = 0;
    const itemRecords: any[] = [];

    for (const it of data.items) {
      const lineTotal = Math.round(Number(it.unitPrice) * Number(it.quantity) * 100) / 100;
      subtotal += lineTotal;

      itemRecords.push({
        productId: it.productId,
        productCodeSnapshot: it.productCode || it.productCodeSnapshot || 'PROD',
        productNameSnapshot: it.productName || it.productNameSnapshot || 'Product',
        categorySnapshot: it.category || it.categorySnapshot || 'General',
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

    let initialStatus: EstimationStatus;
    if (data.status === 'DRAFT') {
      initialStatus = EstimationStatus.DRAFT;
    } else if (user.role === 'ADMIN') {
      // If created by admin, directly goes as approved estimation
      initialStatus = EstimationStatus.APPROVED;
    } else {
      initialStatus = EstimationStatus.PENDING_APPROVAL;
    }

    const estimation = await db.estimation.create({
      data: {
        estimationNumber,
        date: data.date ? new Date(data.date) : new Date(),
        validityDays: Number(data.validityDays) || 30,
        status: initialStatus,
        approvedById: initialStatus === EstimationStatus.APPROVED ? user.userId : null,
        approvedAt: initialStatus === EstimationStatus.APPROVED ? new Date() : null,
        approvalRemarks: initialStatus === EstimationStatus.APPROVED ? 'Approved upon creation by Administrator' : null,
        customerId: data.customerId || null,
        customerName: data.customerName,
        companyName: data.companyName,
        contactPerson: data.contactPerson || null,
        phone: data.phone,
        email: data.email || null,
        address: data.address,
        gstin: data.gstin || null,
        state: data.state || 'Tamil Nadu',
        referenceNumber: data.referenceNumber || null,
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
        termsConditions: data.termsConditions || settings?.termsAndConditions || null,
        createdById: user.userId,
        items: {
          create: itemRecords,
        },
      },
      include: {
        items: { include: { itemSpecs: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: estimation.status === 'FINALIZED' ? 'ESTIMATION_FINALIZED' : 'ESTIMATION_CREATED',
        entity: 'Estimation',
        entityId: estimation.id,
        details: {
          estimationNumber: estimation.estimationNumber,
          grandTotal: estimation.grandTotal,
          itemCount: estimation.items.length,
          installationAmount: estimation.installationAmount,
          freightAmount: estimation.freightAmount,
        },
      },
    });

    return NextResponse.json({ success: true, estimation });
  } catch (error: any) {
    console.error('Estimation creation error:', error);
    return NextResponse.json({ error: 'Failed to create estimation: ' + (error.message || '') }, { status: 500 });
  }
}
