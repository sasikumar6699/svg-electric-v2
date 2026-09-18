import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.value || !data.label) {
      return NextResponse.json({ error: 'Option value and label are required' }, { status: 400 });
    }

    const option = await db.specificationOption.create({
      data: {
        specificationId: params.id,
        value: data.value.trim().toUpperCase(),
        label: data.label.trim(),
        price: Number(data.price) || 0.0,
        displayOrder: Number(data.displayOrder) || 0,
        active: data.active ?? true,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to add option' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const option = await db.specificationOption.update({
      where: { id: data.id },
      data: {
        label: data.label,
        price: data.price !== undefined ? Number(data.price) : undefined,
        displayOrder: data.displayOrder !== undefined ? Number(data.displayOrder) : undefined,
        active: data.active,
      },
    });

    return NextResponse.json({ success: true, option });
  } catch {
    return NextResponse.json({ error: 'Failed to update option' }, { status: 500 });
  }
}
