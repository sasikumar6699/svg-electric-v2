import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.trim() || '';

    const where: any = {};
    if (category && category !== 'ALL') {
      where.OR = [
        { categoryCode: { equals: category, mode: 'insensitive' } },
        { categoryCode: 'ALL' },
      ];
    }

    const templates = await db.variantMasterTemplate.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { dimensionName: 'asc' }],
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching variant master templates:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, categoryCode = 'ALL', dimensionName, description, displayOrder = 1, options } = body;

    if (!dimensionName || !dimensionName.trim()) {
      return NextResponse.json({ error: 'Variant Dimension Name is required.' }, { status: 400 });
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return NextResponse.json({ error: 'At least one variant option is required.' }, { status: 400 });
    }

    const cleanedOptions = options.map((opt: any, idx: number) => ({
      optionName: String(opt.optionName || `Option ${idx + 1}`).trim(),
      isDefault: Boolean(opt.isDefault),
      priceDelta: parseFloat(String(opt.priceDelta || 0)) || 0,
      description: opt.description ? String(opt.description).trim() : null,
    }));

    if (id) {
      const updated = await db.variantMasterTemplate.update({
        where: { id },
        data: {
          categoryCode: categoryCode.trim().toUpperCase(),
          dimensionName: dimensionName.trim(),
          description: description?.trim() || null,
          displayOrder: parseInt(String(displayOrder), 10) || 1,
          options: cleanedOptions,
        },
      });
      return NextResponse.json({ success: true, template: updated });
    }

    const created = await db.variantMasterTemplate.create({
      data: {
        categoryCode: categoryCode.trim().toUpperCase(),
        dimensionName: dimensionName.trim(),
        description: description?.trim() || null,
        displayOrder: parseInt(String(displayOrder), 10) || 1,
        options: cleanedOptions,
      },
    });

    return NextResponse.json({ success: true, template: created });
  } catch (error: any) {
    console.error('Error saving variant master template:', error);
    return NextResponse.json({ error: error.message || 'Failed to save template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 });
    }

    await db.variantMasterTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Template deleted.' });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete template' }, { status: 500 });
  }
}
