import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search')?.trim();

    const where: any = { active: true };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { modelNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const finishedGoods = await db.finishedGood.findMany({
      where,
      include: {
        category: {
          select: { id: true, code: true, name: true },
        },
        _count: {
          select: { bomItems: true, variants: true },
        },
        variants: {
          include: {
            options: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, finishedGoods });
  } catch (error: any) {
    console.error('Error fetching finished goods:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Finished Goods' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      modelNumber,
      name,
      categoryId,
      description,
      enclosureHeight,
      enclosureWidth,
      enclosureDepth,
      ipRating = 'IP54',
      formRating = 'Form 2B',
      bomMaterialCost = 0,
      fabricationCost = 0,
      busbarCost = 0,
      wiringCost = 0,
      netManufacturingCost = 0,
      fatTestingCost = 0,
      designEngineeringCost = 0,
      overheadCost = 0,
      profitMarginPercent = 15,
      finalExWorksPrice = 0,
      gstAmount = 0,
      finalGrossPrice = 0,
      bomItems = [],
      variants = [],
    } = body;

    if (!name || !categoryId) {
      return NextResponse.json({ error: 'Product Name and Category are required.' }, { status: 400 });
    }

    // Automate Model Number if omitted or requested
    let finalModelNumber = (modelNumber || '').trim().toUpperCase();
    if (!finalModelNumber || finalModelNumber === 'AUTO') {
      const category = await db.productCategory.findUnique({ where: { id: categoryId } });
      const catCode = category?.code || 'CAT-PNL';
      const cleanCode = catCode.replace('CAT-', '');
      const count = await db.finishedGood.count({ where: { categoryId } });
      const currentYear = new Date().getFullYear();
      finalModelNumber = `SVG-${cleanCode}-${currentYear}-${String(count + 1).padStart(3, '0')}`;
      let attempt = 1;
      while (await db.finishedGood.findUnique({ where: { modelNumber: finalModelNumber } })) {
        attempt++;
        finalModelNumber = `SVG-${cleanCode}-${currentYear}-${String(count + attempt).padStart(3, '0')}`;
      }
    } else {
      // Check if modelNumber already exists
      const existing = await db.finishedGood.findUnique({
        where: { modelNumber: finalModelNumber },
      });
      if (existing) {
        return NextResponse.json({ error: `Model Number "${finalModelNumber}" already exists. Please choose a unique model number.` }, { status: 400 });
      }
    }

    // Validate that no BOM item has an empty or 0 price
    const unpricedItems = bomItems.filter((it: any) => !it.unitPrice || it.unitPrice <= 0);
    if (unpricedItems.length > 0) {
      return NextResponse.json({
        error: `Cannot save Finished Good: ${unpricedItems.length} BOM items have missing or zero prices. All items must have valid prices.`,
      }, { status: 400 });
    }

    const fg = await db.finishedGood.create({
      data: {
        modelNumber: finalModelNumber,
        name: name.trim(),
        categoryId,
        description: description?.trim() || null,
        enclosureHeight: parseFloat(String(enclosureHeight)) || null,
        enclosureWidth: parseFloat(String(enclosureWidth)) || null,
        enclosureDepth: parseFloat(String(enclosureDepth)) || null,
        ipRating: ipRating?.trim() || 'IP54',
        formRating: formRating?.trim() || 'Form 2B',
        bomMaterialCost: parseFloat(String(bomMaterialCost)) || 0,
        fabricationCost: parseFloat(String(fabricationCost)) || 0,
        busbarCost: parseFloat(String(busbarCost)) || 0,
        wiringCost: parseFloat(String(wiringCost)) || 0,
        netManufacturingCost: parseFloat(String(netManufacturingCost)) || 0,
        fatTestingCost: parseFloat(String(fatTestingCost)) || 0,
        designEngineeringCost: parseFloat(String(designEngineeringCost)) || 0,
        overheadCost: parseFloat(String(overheadCost)) || 0,
        profitMarginPercent: parseFloat(String(profitMarginPercent)) || 15,
        finalExWorksPrice: parseFloat(String(finalExWorksPrice)) || 0,
        gstAmount: parseFloat(String(gstAmount)) || 0,
        finalGrossPrice: parseFloat(String(finalGrossPrice)) || 0,
        bomItems: {
          create: bomItems.map((item: any, idx: number) => {
            const unitPrice = parseFloat(String(item.unitPrice)) || 0;
            const listPrice = parseFloat(String(item.listPrice)) || unitPrice;
            const quantity = parseFloat(String(item.quantity)) || 1;
            const totalAmount = parseFloat(String(item.totalAmount)) || (unitPrice * quantity);
            const gst = parseFloat(String(item.gstAmount)) || Math.round(totalAmount * 0.18);

            return {
              sectionName: item.sectionName?.trim() || 'Main Panel',
              sNo: item.sNo || idx + 1,
              description: String(item.description || '').trim(),
              rating: item.rating ? String(item.rating).trim() : null,
              typeCode: item.typeCode ? String(item.typeCode).trim() : null,
              make: String(item.make || 'Standard').trim(),
              unit: String(item.unit || 'Nos').trim(),
              quantity,
              listPrice,
              unitPrice,
              totalAmount,
              gstAmount: gst,
              grandTotal: totalAmount + gst,
            };
          }),
        },
        variants: {
          create: variants.map((dim: any, dIdx: number) => ({
            dimensionName: dim.dimensionName.trim(),
            displayOrder: dim.displayOrder || dIdx + 1,
            options: {
              create: (dim.options || []).map((opt: any, oIdx: number) => ({
                optionName: opt.optionName.trim(),
                isDefault: Boolean(opt.isDefault),
                priceDelta: parseFloat(String(opt.priceDelta)) || 0,
                description: opt.description?.trim() || null,
                displayOrder: opt.displayOrder || oIdx + 1,
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

    return NextResponse.json({ success: true, finishedGood: fg });
  } catch (error: any) {
    console.error('Error creating finished good:', error);
    return NextResponse.json({ error: error.message || 'Failed to create Finished Good' }, { status: 500 });
  }
}
