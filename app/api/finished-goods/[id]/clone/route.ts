import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const newModelNumber = body.newModelNumber?.trim()?.toUpperCase();

    // Fetch source Finished Good with all children
    const sourceFg = await db.finishedGood.findUnique({
      where: { id },
      include: {
        bomItems: true,
        variants: {
          include: { options: true },
        },
      },
    });

    if (!sourceFg) {
      return NextResponse.json({ error: 'Source Finished Good not found.' }, { status: 404 });
    }

    // Auto-generate target model number if not provided
    let targetModelNumber = newModelNumber;
    if (!targetModelNumber) {
      const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      targetModelNumber = `${sourceFg.modelNumber}-CLONE-${timestamp}`;
    }

    // Ensure unique
    const existing = await db.finishedGood.findUnique({
      where: { modelNumber: targetModelNumber },
    });
    if (existing) {
      targetModelNumber = `${targetModelNumber}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // Clone the Finished Good
    const cloned = await db.finishedGood.create({
      data: {
        modelNumber: targetModelNumber,
        name: `${sourceFg.name} (Clone)`,
        categoryId: sourceFg.categoryId,
        description: sourceFg.description ? `Cloned from ${sourceFg.modelNumber}. ${sourceFg.description}` : null,
        enclosureHeight: sourceFg.enclosureHeight,
        enclosureWidth: sourceFg.enclosureWidth,
        enclosureDepth: sourceFg.enclosureDepth,
        ipRating: sourceFg.ipRating,
        formRating: sourceFg.formRating,
        bomMaterialCost: sourceFg.bomMaterialCost,
        fabricationCost: sourceFg.fabricationCost,
        busbarCost: sourceFg.busbarCost,
        wiringCost: sourceFg.wiringCost,
        netManufacturingCost: sourceFg.netManufacturingCost,
        fatTestingCost: sourceFg.fatTestingCost,
        designEngineeringCost: sourceFg.designEngineeringCost,
        overheadCost: sourceFg.overheadCost,
        profitMarginPercent: sourceFg.profitMarginPercent,
        finalExWorksPrice: sourceFg.finalExWorksPrice,
        gstAmount: sourceFg.gstAmount,
        finalGrossPrice: sourceFg.finalGrossPrice,
        bomItems: {
          create: sourceFg.bomItems.map((item) => ({
            sectionName: item.sectionName,
            sNo: item.sNo,
            description: item.description,
            rating: item.rating,
            typeCode: item.typeCode,
            make: item.make,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            gstAmount: item.gstAmount,
            grandTotal: item.grandTotal,
          })),
        },
        variants: {
          create: sourceFg.variants.map((dim) => ({
            dimensionName: dim.dimensionName,
            displayOrder: dim.displayOrder,
            options: {
              create: dim.options.map((opt) => ({
                optionName: opt.optionName,
                isDefault: opt.isDefault,
                priceDelta: opt.priceDelta,
                description: opt.description,
                displayOrder: opt.displayOrder,
              })),
            },
          })),
        },
      },
      include: {
        category: true,
        bomItems: true,
        variants: {
          include: { options: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Model successfully cloned as "${cloned.modelNumber}".`,
      cloned,
    });
  } catch (error: any) {
    console.error('Error cloning finished good:', error);
    return NextResponse.json({ error: error.message || 'Failed to clone Finished Good' }, { status: 500 });
  }
}
