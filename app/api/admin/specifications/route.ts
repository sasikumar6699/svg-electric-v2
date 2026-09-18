import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { InputType } from '@prisma/client';

export async function GET() {
  try {
    const specifications = await db.specification.findMany({
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { productSpecs: true } },
      },
      orderBy: { displayOrder: 'asc' },
    });
    return NextResponse.json({ specifications });
  } catch {
    return NextResponse.json({ error: 'Failed to load specifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.code || !data.name) {
      return NextResponse.json({ error: 'Specification Code and Name are required' }, { status: 400 });
    }

    const spec = await db.specification.create({
      data: {
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        inputType: (data.inputType as InputType) || InputType.DROPDOWN,
        unit: data.unit || null,
        description: data.description || null,
        displayOrder: Number(data.displayOrder) || 0,
        active: data.active ?? true,
      },
    });

    // If options array provided, create them
    if (Array.isArray(data.options)) {
      for (let i = 0; i < data.options.length; i++) {
        const opt = data.options[i];
        if (opt.value && opt.label) {
          await db.specificationOption.create({
            data: {
              specificationId: spec.id,
              value: opt.value.trim().toUpperCase(),
              label: opt.label.trim(),
              displayOrder: i,
              active: true,
            },
          });
        }
      }
    }

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'SPECIFICATION_CREATED',
        entity: 'Specification',
        entityId: spec.id,
        details: { code: spec.code, name: spec.name },
      },
    });

    return NextResponse.json({ success: true, specification: spec });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create specification' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const updated = await db.specification.update({
      where: { id: data.id },
      data: {
        name: data.name?.trim(),
        inputType: data.inputType as InputType,
        unit: data.unit,
        description: data.description,
        displayOrder: Number(data.displayOrder) || 0,
        active: data.active,
      },
    });

    return NextResponse.json({ success: true, specification: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update specification' }, { status: 500 });
  }
}
