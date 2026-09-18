import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const specifications = await db.specification.findMany({
      where: { active: true },
      include: {
        options: {
          where: { active: true },
          orderBy: { displayOrder: 'asc' },
        },
        productSpecs: {
          include: {
            product: {
              select: { id: true, productCode: true, name: true, basePrice: true },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    const products = await db.product.findMany({
      where: { active: true },
      select: { id: true, productCode: true, name: true, basePrice: true },
      orderBy: { productCode: 'asc' },
    });

    return NextResponse.json({ specifications, products });
  } catch (error: any) {
    console.error('Failed to fetch pricing matrix options:', error);
    return NextResponse.json({ error: 'Failed to load options pricing matrix' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    // Support single option price update: { optionId, price }
    if (data.optionId && data.price !== undefined) {
      const updated = await db.specificationOption.update({
        where: { id: data.optionId },
        data: { price: Math.max(0, Number(data.price)) },
      });

      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'SPEC_OPTION_PRICE_UPDATED',
          entity: 'SpecificationOption',
          entityId: updated.id,
          details: { optionValue: updated.value, newPrice: updated.price },
        },
      });

      return NextResponse.json({ success: true, option: updated });
    }

    // Support bulk option price updates: { updates: [{ id, price }] }
    if (Array.isArray(data.updates)) {
      const results = [];
      for (const u of data.updates) {
        if (u.id && u.price !== undefined) {
          const updated = await db.specificationOption.update({
            where: { id: u.id },
            data: { price: Math.max(0, Number(u.price)) },
          });
          results.push(updated);
        }
      }

      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'BULK_SPEC_OPTION_PRICES_UPDATED',
          entity: 'SpecificationOption',
          details: { count: results.length },
        },
      });

      return NextResponse.json({ success: true, count: results.length });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update option price in matrix:', error);
    return NextResponse.json({ error: 'Failed to update price' }, { status: 500 });
  }
}
