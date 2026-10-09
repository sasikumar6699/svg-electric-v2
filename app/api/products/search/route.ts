import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

    // Fetch Finished Goods
    const fgWhere: any = { active: true };
    if (categoryId) fgWhere.categoryId = categoryId;
    if (search.trim()) {
      fgWhere.OR = [
        { modelNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const finishedGoods = await db.finishedGood.findMany({
      where: fgWhere,
      include: {
        category: true,
        bomItems: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map Finished Goods to standard product shape for search console
    const mappedFgProducts = finishedGoods.map((fg) => {
      const specs = [
        { name: 'Enclosure Size', value: `${fg.enclosureHeight || 2000}×${fg.enclosureWidth || 1000}×${fg.enclosureDepth || 600} mm` },
        { name: 'Protection', value: fg.ipRating || 'IP54' },
        { name: 'Form Factor', value: fg.formRating || 'Form 2B' },
        { name: 'BOM Density', value: `${fg.bomItems?.length || 0} Materials` },
      ];

      return {
        id: fg.id,
        productCode: fg.modelNumber,
        name: fg.name,
        price: fg.finalGrossPrice,
        basePrice: fg.finalExWorksPrice,
        categoryId: fg.categoryId,
        category: fg.category ? { id: fg.category.id, name: fg.category.name, code: fg.category.code } : undefined,
        description: fg.description,
        specifications: specs,
        fileUrl: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        active: fg.active,
        createdAt: fg.createdAt.toISOString(),
        updatedAt: fg.updatedAt.toISOString(),
        isFinishedGood: true,
        configuratorUrl: `/sales/configurator?modelId=${fg.id}`,
      };
    });

    // Also fetch legacy products if any remain
    const prodWhere: any = { active: true };
    if (categoryId) prodWhere.categoryId = categoryId;
    if (minPrice !== undefined || maxPrice !== undefined) {
      prodWhere.price = {};
      if (minPrice !== undefined) prodWhere.price.gte = minPrice;
      if (maxPrice !== undefined) prodWhere.price.lte = maxPrice;
    }

    let legacyProducts = await db.product.findMany({
      where: prodWhere,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    if (search.trim()) {
      const qLower = search.toLowerCase().trim();
      legacyProducts = legacyProducts.filter((p) => {
        const matchName = p.name.toLowerCase().includes(qLower);
        const matchCode = p.productCode.toLowerCase().includes(qLower);
        const matchDesc = p.description?.toLowerCase().includes(qLower) || false;
        return matchName || matchCode || matchDesc;
      });
    }

    const allCombined = [...mappedFgProducts, ...legacyProducts];

    // Fetch categories for quick filter chips
    const categories = await db.productCategory.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      count: allCombined.length,
      products: allCombined,
      categories,
      availableFilters: [
        { name: 'Enclosure Size', values: ['2000×1000×600 mm', '1800×900×500 mm', '2200×1600×800 mm'] },
        { name: 'Protection', values: ['IP54', 'IP52', 'IP55'] },
        { name: 'Form Factor', values: ['Form 2B', 'Form 4B'] },
      ],
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
