import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // 1. Search distinct RM descriptions as admin types
    if (action === 'search-rm') {
      const q = searchParams.get('q')?.trim() || '';
      const category = searchParams.get('category')?.trim() || '';
      const where: any = { active: true };
      if (category && category !== 'ALL') {
        where.category = { equals: category, mode: 'insensitive' };
      }
      if (q) {
        where.description = { contains: q, mode: 'insensitive' };
      }
      const results = await db.componentMaster.findMany({
        where,
        select: { description: true, category: true },
        distinct: ['description'],
        take: 35,
        orderBy: { description: 'asc' },
      });
      return NextResponse.json({ results });
    }

    // 2. Get distinct Brands (Makes) for selected RM description
    if (action === 'get-makes') {
      const rm = searchParams.get('rm')?.trim() || '';
      if (!rm) return NextResponse.json({ makes: [] });
      const results = await db.componentMaster.findMany({
        where: {
          active: true,
          description: { contains: rm, mode: 'insensitive' },
        },
        select: { make: true },
        distinct: ['make'],
        orderBy: { make: 'asc' },
      });
      return NextResponse.json({ makes: results.map((r) => r.make).filter(Boolean) });
    }

    // 3. Get distinct Variants / Items for selected RM and Brand
    if (action === 'get-variants') {
      const rm = searchParams.get('rm')?.trim() || '';
      const make = searchParams.get('make')?.trim() || '';
      const where: any = { active: true };
      if (rm) where.description = { contains: rm, mode: 'insensitive' };
      if (make && make !== 'ALL') where.make = { equals: make, mode: 'insensitive' };
      const items = await db.componentMaster.findMany({
        where,
        select: {
          id: true,
          itemCode: true,
          description: true,
          rating: true,
          typeCode: true,
          make: true,
          category: true,
          unit: true,
          unitPrice: true,
          listPrice: true,
          finalPrice: true,
          hsnCode: true,
          gstRate: true,
        },
        orderBy: [{ rating: 'asc' }, { typeCode: 'asc' }, { unitPrice: 'asc' }],
        take: 150,
      });
      return NextResponse.json({ items });
    }

    const search = searchParams.get('search')?.trim() || '';
    const make = searchParams.get('make')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const categoriesParam = searchParams.get('categories')?.trim();
    const activeOnly = searchParams.get('active') !== 'false';

    const where: any = {};
    if (activeOnly) where.active = true;
    if (make) where.make = { equals: make, mode: 'insensitive' };
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    } else if (categoriesParam) {
      const catList = categoriesParam.split(',').map((c) => c.trim()).filter(Boolean);
      if (catList.length > 0) {
        where.category = { in: catList };
      }
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { itemCode: { contains: search, mode: 'insensitive' } },
        { typeCode: { contains: search, mode: 'insensitive' } },
        { rating: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
      ];
    }

    const limit = searchParams.get('limit');
    const take = limit ? parseInt(limit, 10) : undefined;

    const items = await db.componentMaster.findMany({
      where,
      take,
      orderBy: [{ make: 'asc' }, { category: 'asc' }, { description: 'asc' }],
    });

    // Also get distinct makes and categories for filter dropdowns
    const allMakes = await db.componentMaster.findMany({
      select: { make: true },
      distinct: ['make'],
      orderBy: { make: 'asc' },
    });

    const allCategories = await db.componentMaster.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      items,
      total: items.length,
      makes: allMakes.map((m) => m.make).filter(Boolean),
      categories: allCategories.map((c) => c.category).filter(Boolean),
    });
  } catch (error: any) {
    console.error('Error fetching component master:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk insert
    if (body.items && Array.isArray(body.items)) {
      const records = body.items.map((item: any, idx: number) => {
        const makeClean = (item.make || 'GEN').trim();
        const typeClean = (item.typeCode || item.description || `ITM${idx}`).trim().replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();
        const code = item.itemCode ? item.itemCode.trim().toUpperCase() : `CMP-${makeClean.toUpperCase()}-${typeClean.substring(0, 30)}`;

        const list = parseFloat(String(item.listPrice ?? item.unitPrice ?? 0)) || 0;
        const final = item.finalPrice !== undefined && item.finalPrice !== ''
          ? (parseFloat(String(item.finalPrice)) || 0)
          : Math.round(list * 0.90 * 100) / 100;

        return {
          itemCode: code,
          description: String(item.description || '').trim(),
          rating: item.rating ? String(item.rating).trim() : null,
          typeCode: item.typeCode ? String(item.typeCode).trim() : null,
          make: makeClean,
          category: String(item.category || 'Switchgear & Protection').trim(),
          unit: String(item.unit || 'Nos').trim(),
          listPrice: list,
          finalPrice: final,
          unitPrice: final,
          hsnCode: String(item.hsnCode || '8537').trim(),
          gstRate: parseFloat(String(item.gstRate || 18)) || 18,
          active: item.active !== false,
        };
      });

      // Filter out duplicates by itemCode
      const uniqueMap = new Map();
      for (const r of records) {
        if (r.itemCode && r.description) {
          uniqueMap.set(r.itemCode, r);
        }
      }
      const uniqueRecords = Array.from(uniqueMap.values());

      const result = await db.componentMaster.createMany({
        data: uniqueRecords,
        skipDuplicates: true,
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    // Single item add/upsert
    const {
      itemCode,
      description,
      rating,
      typeCode,
      make,
      category,
      unit,
      unitPrice,
      listPrice,
      finalPrice,
      hsnCode,
      gstRate,
    } = body;

    const list = parseFloat(String(listPrice ?? unitPrice ?? 0)) || 0;
    const final = finalPrice !== undefined && finalPrice !== ''
      ? (parseFloat(String(finalPrice)) || 0)
      : Math.round(list * 0.90 * 100) / 100;

    if (!description || !make || (list === 0 && final === 0 && unitPrice === undefined)) {
      return NextResponse.json({ error: 'Description, Make, and Price are required.' }, { status: 400 });
    }

    const cleanMake = make.trim();
    const cleanType = (typeCode || description).trim().replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();
    const finalCode = itemCode?.trim().toUpperCase() || `CMP-${cleanMake.toUpperCase()}-${cleanType.substring(0, 30)}`;

    const component = await db.componentMaster.upsert({
      where: { itemCode: finalCode },
      update: {
        description: description.trim(),
        rating: rating?.trim() || null,
        typeCode: typeCode?.trim() || null,
        make: cleanMake,
        category: category?.trim() || 'Switchgear & Protection',
        unit: unit?.trim() || 'Nos',
        listPrice: list,
        finalPrice: final,
        unitPrice: final,
        hsnCode: hsnCode?.trim() || '8537',
        gstRate: parseFloat(String(gstRate ?? 18)) || 18,
        active: true,
      },
      create: {
        itemCode: finalCode,
        description: description.trim(),
        rating: rating?.trim() || null,
        typeCode: typeCode?.trim() || null,
        make: cleanMake,
        category: category?.trim() || 'Switchgear & Protection',
        unit: unit?.trim() || 'Nos',
        listPrice: list,
        finalPrice: final,
        unitPrice: final,
        hsnCode: hsnCode?.trim() || '8537',
        gstRate: parseFloat(String(gstRate ?? 18)) || 18,
        active: true,
      },
    });

    return NextResponse.json({ success: true, component });
  } catch (error: any) {
    console.error('Error saving component:', error);
    return NextResponse.json({ error: error.message || 'Failed to save component' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, unitPrice, listPrice, finalPrice, description, rating, typeCode, make, category, unit, hsnCode, gstRate, active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Component ID is required.' }, { status: 400 });
    }

    const updateData: any = {};
    if (description) updateData.description = description.trim();
    if (rating !== undefined) updateData.rating = rating?.trim() || null;
    if (typeCode !== undefined) updateData.typeCode = typeCode?.trim() || null;
    if (make) updateData.make = make.trim();
    if (category) updateData.category = category.trim();
    if (unit) updateData.unit = unit.trim();
    if (hsnCode) updateData.hsnCode = hsnCode.trim();
    if (gstRate !== undefined) updateData.gstRate = parseFloat(String(gstRate));
    if (active !== undefined) updateData.active = Boolean(active);

    if (listPrice !== undefined) {
      const listVal = parseFloat(String(listPrice)) || 0;
      updateData.listPrice = listVal;
      if (finalPrice !== undefined) {
        const finalVal = parseFloat(String(finalPrice)) || 0;
        updateData.finalPrice = finalVal;
        updateData.unitPrice = finalVal;
      } else {
        const finalVal = Math.round(listVal * 0.90 * 100) / 100;
        updateData.finalPrice = finalVal;
        updateData.unitPrice = finalVal;
      }
    } else if (finalPrice !== undefined) {
      const finalVal = parseFloat(String(finalPrice)) || 0;
      updateData.finalPrice = finalVal;
      updateData.unitPrice = finalVal;
    } else if (unitPrice !== undefined) {
      const val = parseFloat(String(unitPrice)) || 0;
      updateData.unitPrice = val;
      updateData.finalPrice = val;
    }

    const updated = await db.componentMaster.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, component: updated });
  } catch (error: any) {
    console.error('Error updating component:', error);
    return NextResponse.json({ error: error.message || 'Failed to update component' }, { status: 500 });
  }
}
