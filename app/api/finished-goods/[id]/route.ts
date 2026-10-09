import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const fg = await db.finishedGood.findUnique({
      where: { id },
      include: {
        category: true,
        bomItems: {
          orderBy: [{ sectionName: 'asc' }, { sNo: 'asc' }],
        },
        variants: {
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!fg) {
      return NextResponse.json({ error: 'Finished Good not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, finishedGood: fg });
  } catch (error: any) {
    console.error('Error fetching finished good details:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch Finished Good' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }

    const { id } = params;
    await db.finishedGood.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Finished Good deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting finished good:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete Finished Good' }, { status: 500 });
  }
}
