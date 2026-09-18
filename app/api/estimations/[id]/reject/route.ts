import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { EstimationStatus } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Administrator can reject estimations.' }, { status: 403 });
    }

    const existing = await db.estimation.findUnique({
      where: { id: params.id },
      include: { createdBy: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    let remarks = '';
    try {
      const body = await request.json();
      remarks = (body.remarks || body.reason || '').trim();
    } catch {
      // Error parsing
    }

    if (!remarks) {
      return NextResponse.json({ error: 'Reason for rejection is required.' }, { status: 400 });
    }

    const updated = await db.estimation.update({
      where: { id: params.id },
      data: {
        status: EstimationStatus.REJECTED,
        approvedById: user.userId,
        approvedAt: new Date(),
        approvalRemarks: remarks,
      },
      include: {
        approvedBy: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'ESTIMATION_REJECTED',
        entity: 'Estimation',
        entityId: updated.id,
        details: {
          estimationNumber: updated.estimationNumber,
          rejectedBy: user.name,
          remarks,
          previousStatus: existing.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Estimation ${updated.estimationNumber} rejected/sent back for revision.`,
      estimation: updated,
    });
  } catch (error: any) {
    console.error('Reject estimation error:', error);
    return NextResponse.json({ error: 'Failed to reject estimation' }, { status: 500 });
  }
}