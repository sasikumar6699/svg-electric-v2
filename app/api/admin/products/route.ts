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
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Failed to load products:', error);
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.productCode || !data.name || !data.categoryId) {
      return NextResponse.json({ error: 'Product Code, Name, and Category are required.' }, { status: 400 });
    }

    const cleanCode = data.productCode.trim().toUpperCase();
    const existing = await db.product.findUnique({
      where: { productCode: cleanCode },
    });
    if (existing) {
      return NextResponse.json({ error: `Product code "${cleanCode}" already exists.` }, { status: 400 });
    }

    const finalPrice = Number(data.price ?? data.basePrice) || 0.0;

    const product = await db.product.create({
      data: {
        productCode: cleanCode,
        name: data.name.trim(),
        price: finalPrice,
        basePrice: finalPrice,
        categoryId: data.categoryId,
        description: data.description ? data.description.trim() : null,
        specifications: Array.isArray(data.specifications) ? data.specifications : [],
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize ? Number(data.fileSize) : null,
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
        details: { code: product.productCode, name: product.name, price: product.price },
      },
    });

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('Failed to create product:', err);
    return NextResponse.json({ error: err.message || 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    const finalPrice = data.price !== undefined ? Number(data.price) : (data.basePrice !== undefined ? Number(data.basePrice) : undefined);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.productCode !== undefined) updateData.productCode = data.productCode.trim().toUpperCase();
    if (finalPrice !== undefined) {
      updateData.price = finalPrice;
      updateData.basePrice = finalPrice;
    }
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.description !== undefined) updateData.description = data.description ? data.description.trim() : null;
    if (data.specifications !== undefined) updateData.specifications = Array.isArray(data.specifications) ? data.specifications : [];
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileName !== undefined) updateData.fileName = data.fileName;
    if (data.fileType !== undefined) updateData.fileType = data.fileType;
    if (data.fileSize !== undefined) updateData.fileSize = data.fileSize ? Number(data.fileSize) : null;
    if (data.active !== undefined) updateData.active = Boolean(data.active);

    const updated = await db.product.update({
      where: { id: data.id },
      data: updateData,
      include: { category: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: updated.id,
        details: { code: updated.productCode, price: updated.price, active: updated.active },
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error('Failed to update product:', err);
    return NextResponse.json({ error: err.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });

    const deleted = await db.product.delete({
      where: { id },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRODUCT_DELETED',
        entity: 'Product',
        entityId: id,
        details: { code: deleted.productCode, name: deleted.name },
      },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Failed to delete product:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete product' }, { status: 500 });
  }
}
