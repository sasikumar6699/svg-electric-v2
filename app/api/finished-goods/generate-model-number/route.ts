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
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await db.productCategory.findUnique({
      where: { id: categoryId },
    });

    const catCode = category?.code || 'CAT-PNL';
    const cleanCode = catCode.replace('CAT-', '');
    const currentYear = new Date().getFullYear();

    const existingCount = await db.finishedGood.count({
      where: { categoryId },
    });

    let sequence = existingCount + 1;
    let modelNumber = `SVG-${cleanCode}-${currentYear}-${String(sequence).padStart(3, '0')}`;

    while (await db.finishedGood.findUnique({ where: { modelNumber } })) {
      sequence++;
      modelNumber = `SVG-${cleanCode}-${currentYear}-${String(sequence).padStart(3, '0')}`;
    }

    return NextResponse.json({ success: true, modelNumber, sequence });
  } catch (error: any) {
    console.error('Error generating model number:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate model number' },
      { status: 500 }
    );
  }
}
