import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const mappings = await db.productSpecification.findMany({
      where: { productId },
      include: {
        specification: {
          include: {
            options: { where: { active: true }, orderBy: { displayOrder: 'asc' } },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ mappings });
  } catch {
    return NextResponse.json({ error: 'Failed to load mappings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const { productId, specifications } = data; // specifications: Array<{ specificationId: string, isRequired: boolean, displayOrder: number }>

    if (!productId || !Array.isArray(specifications)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Delete existing mappings
    await db.productSpecification.deleteMany({ where: { productId } });

    // Create new mappings
    for (let i = 0; i < specifications.length; i++) {
      const s = specifications[i];
      await db.productSpecification.create({
        data: {
          productId,
          specificationId: s.specificationId,
          isRequired: s.isRequired ?? true,
          displayOrder: s.displayOrder ?? i,
        },
      });
    }

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRODUCT_SPECS_MAPPED',
        entity: 'ProductSpecification',
        entityId: productId,
        details: { mappedCount: specifications.length },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update product specifications' }, { status: 500 });
  }
}
