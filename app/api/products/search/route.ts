import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) { ... }
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q') || searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const specName = searchParams.get('specName') || '';
    const specValue = searchParams.get('specValue') || '';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;

    const where: any = {
      active: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Base query
    let products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Client-level keyword filtering across name, code, description, and JSON specifications
    if (search.trim()) {
      const qLower = search.toLowerCase().trim();
      products = products.filter((p) => {
        const matchName = p.name.toLowerCase().includes(qLower);
        const matchCode = p.productCode.toLowerCase().includes(qLower);
        const matchDesc = p.description?.toLowerCase().includes(qLower) || false;
        const matchCat = p.category?.name.toLowerCase().includes(qLower) || false;

        // Check specs
        let matchSpec = false;
        if (Array.isArray(p.specifications)) {
          matchSpec = p.specifications.some((s: any) =>
            String(s.name || '').toLowerCase().includes(qLower) ||
            String(s.value || '').toLowerCase().includes(qLower)
          );
        }

        return matchName || matchCode || matchDesc || matchCat || matchSpec;
      });
    }

    // Specification-specific filter
    if (specName && specValue) {
      const targetName = specName.toLowerCase().trim();
      const targetVal = specValue.toLowerCase().trim();
      products = products.filter((p) => {
        if (!Array.isArray(p.specifications)) return false;
        return p.specifications.some(
          (s: any) =>
            String(s.name || '').toLowerCase().trim() === targetName &&
            String(s.value || '').toLowerCase().trim().includes(targetVal)
        );
      });
    } else if (specValue && !specName) {
      const targetVal = specValue.toLowerCase().trim();
      products = products.filter((p) => {
        if (!Array.isArray(p.specifications)) return false;
        return p.specifications.some((s: any) =>
          String(s.value || '').toLowerCase().trim().includes(targetVal)
        );
      });
    }

    // Fetch categories for quick filter chips
    const categories = await db.productCategory.findMany({
      where: { active: true },
      orderBy: { displayOrder: 'asc' },
    });

    // Aggregate unique specifications for quick filter pills
    const allProducts = await db.product.findMany({
      where: { active: true },
      select: { specifications: true },
    });

    const specAggregates: Record<string, Set<string>> = {};
    for (const p of allProducts) {
      if (Array.isArray(p.specifications)) {
        for (const s of p.specifications as any[]) {
          if (s.name && s.value) {
            const key = String(s.name).trim();
            const val = String(s.value).trim();
            if (!specAggregates[key]) {
              specAggregates[key] = new Set<string>();
            }
            specAggregates[key].add(val);
          }
        }
      }
    }

    const availableFilters = Object.entries(specAggregates).map(([name, valuesSet]) => ({
      name,
      values: Array.from(valuesSet).slice(0, 10), // Limit top 10 unique values
    }));

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
      categories,
      availableFilters,
    });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search products' }, { status: 500 });
  }
}
