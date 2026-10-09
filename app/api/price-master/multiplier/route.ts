import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const { make, category, percentageMultiplier, rounding = true } = await request.json();

    const pct = parseFloat(String(percentageMultiplier));
    if (isNaN(pct) || pct < -90 || pct > 500) {
      return NextResponse.json({ error: 'Valid percentage multiplier is required (-90% to +500%).' }, { status: 400 });
    }

    const where: any = { active: true };
    if (make && make !== 'ALL') {
      where.make = { equals: make, mode: 'insensitive' };
    }
    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    // Fetch targeted components
    const targetItems = await db.componentMaster.findMany({
      where,
      select: { id: true, unitPrice: true, listPrice: true },
    });

    if (targetItems.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No active components found matching criteria.' });
    }

    const factor = 1 + (pct / 100);

    // Update in batch transactions of 50
    const chunkSize = 50;
    let updatedCount = 0;

    for (let i = 0; i < targetItems.length; i += chunkSize) {
      const chunk = targetItems.slice(i, i + chunkSize);
      await db.$transaction(
        chunk.map((item) => {
          const currentList = item.listPrice && item.listPrice > 0 ? item.listPrice : item.unitPrice;
          let newListPrice = currentList * factor;
          if (rounding) {
            newListPrice = Math.round(newListPrice);
          } else {
            newListPrice = Math.round(newListPrice * 100) / 100;
          }
          newListPrice = Math.max(0, newListPrice);
          const newFinalPrice = Math.round(newListPrice * 0.90 * 100) / 100;

          return db.componentMaster.update({
            where: { id: item.id },
            data: {
              listPrice: newListPrice,
              finalPrice: newFinalPrice,
              unitPrice: newFinalPrice,
            },
          });
        })
      );
      updatedCount += chunk.length;
    }

    return NextResponse.json({
      success: true,
      count: updatedCount,
      percentageApplied: pct,
      make: make || 'ALL',
      category: category || 'ALL',
    });
  } catch (error: any) {
    console.error('Error applying annual price multiplier:', error);
    return NextResponse.json({ error: error.message || 'Failed to apply multiplier' }, { status: 500 });
  }
}
