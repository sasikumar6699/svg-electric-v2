import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const variants = await db.fgVariantDimension.findMany({
      where: { finishedGoodId: id },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ variants });
  } catch (error: any) {
    console.error('Error fetching variants for finished good:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch variants' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { variants } = body; // Array of { dimensionName, displayOrder, options: [...] }

    if (!Array.isArray(variants)) {
      return NextResponse.json({ error: 'Variants must be an array.' }, { status: 400 });
    }

    // Verify finished good exists
    const fg = await db.finishedGood.findUnique({
      where: { id },
    });

    if (!fg) {
      return NextResponse.json({ error: 'Finished Good not found.' }, { status: 404 });
    }

    // Delete existing variants for this finished good and recreate cleanly
    await db.$transaction(async (tx) => {
      await tx.fgVariantDimension.deleteMany({
        where: { finishedGoodId: id },
      });

      for (let dIdx = 0; dIdx < variants.length; dIdx++) {
        const dim = variants[dIdx];
        if (!dim.dimensionName || !dim.dimensionName.trim()) continue;

        const createdDim = await tx.fgVariantDimension.create({
          data: {
            finishedGoodId: id,
            dimensionName: dim.dimensionName.trim(),
            displayOrder: dim.displayOrder || dIdx + 1,
          },
        });

        const options = Array.isArray(dim.options) ? dim.options : [];
        if (options.length > 0) {
          await tx.fgVariantOption.createMany({
            data: options.map((opt: any, oIdx: number) => ({
              dimensionId: createdDim.id,
              optionName: String(opt.optionName || `Option ${oIdx + 1}`).trim(),
              isDefault: Boolean(opt.isDefault),
              priceDelta: parseFloat(String(opt.priceDelta || 0)) || 0,
              description: opt.description ? String(opt.description).trim() : null,
              displayOrder: opt.displayOrder || oIdx + 1,
            })),
          });
        }
      }
    });

    // Fetch updated variants
    const updatedVariants = await db.fgVariantDimension.findMany({
      where: { finishedGoodId: id },
      include: {
        options: {
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ success: true, variants: updatedVariants });
  } catch (error: any) {
    console.error('Error saving variants for finished good:', error);
    return NextResponse.json({ error: error.message || 'Failed to save variants' }, { status: 500 });
  }
}
