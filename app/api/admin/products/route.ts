import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { productCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        productSpecs: {
          include: {
            specification: {
              include: {
                options: { where: { active: true }, orderBy: { displayOrder: 'asc' } },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: { pricingRules: true },
        },
      },
      orderBy: { productCode: 'asc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.productCode || !data.name || !data.categoryId) {
      return NextResponse.json({ error: 'Product Code, Name, and Category are required.' }, { status: 400 });
    }

    const existing = await db.product.findUnique({
      where: { productCode: data.productCode.trim().toUpperCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'A product with this product code already exists.' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        productCode: data.productCode.trim().toUpperCase(),
        name: data.name.trim(),
        basePrice: Number(data.basePrice) || 0.0,
        categoryId: data.categoryId,
        description: data.description || null,
        active: data.active ?? true,
      },
      include: { category: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRODUCT_CREATED',
        entity: 'Product',
        entityId: product.id,
        details: { code: product.productCode, name: product.name, basePrice: product.basePrice },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    const updated = await db.product.update({
      where: { id: data.id },
      data: {
        name: data.name?.trim(),
        basePrice: data.basePrice !== undefined ? Number(data.basePrice) : undefined,
        categoryId: data.categoryId,
        description: data.description,
        active: data.active,
      },
      include: { category: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: updated.id,
        details: { code: updated.productCode, basePrice: updated.basePrice, active: updated.active },
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
