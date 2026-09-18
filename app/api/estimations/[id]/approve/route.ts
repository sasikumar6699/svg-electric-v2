import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { EstimationStatus } from '@prisma/client';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Administrator can approve estimations.' }, { status: 403 });
    }

    const existing = await db.estimation.findUnique({
      where: { id: params.id },
      include: { createdBy: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    let remarks: string | null = null;
    try {
      const body = await request.json();
      remarks = body.remarks || null;
    } catch {
      // Body is optional
    }

    const updated = await db.estimation.update({
      where: { id: params.id },
      data: {
        status: EstimationStatus.APPROVED,
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
        action: 'ESTIMATION_APPROVED',
        entity: 'Estimation',
        entityId: updated.id,
        details: {
          estimationNumber: updated.estimationNumber,
          approvedBy: user.name,
          remarks,
          previousStatus: existing.status,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Estimation ${updated.estimationNumber} approved successfully.`,
      estimation: updated,
    });
  } catch (error: any) {
    console.error('Approve estimation error:', error);
    return NextResponse.json({ error: 'Failed to approve estimation' }, { status: 500 });
  }
}