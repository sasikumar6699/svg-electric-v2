import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const categories = await db.productCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.code || !data.name) {
      return NextResponse.json({ error: 'Category Code and Name are required' }, { status: 400 });
    }

    const category = await db.productCategory.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description || null,
        displayOrder: Number(data.displayOrder) || 0,
        active: data.active ?? true,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
