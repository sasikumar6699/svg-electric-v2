import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { EstimationStatus } from '@prisma/client';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status } = await request.json();
    if (!Object.values(EstimationStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await db.estimation.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Estimation not found' }, { status: 404 });
    }

    // Only admins can approve or reject
    if ((status === EstimationStatus.APPROVED || status === EstimationStatus.REJECTED) && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only Administrator can approve or reject estimations.' }, { status: 403 });
    }

    const updateData: any = { status };
    if (status === EstimationStatus.APPROVED || status === EstimationStatus.REJECTED) {
      updateData.approvedById = user.userId;
      updateData.approvedAt = new Date();
    }

    const updated = await db.estimation.update({
      where: { id: params.id },
      data: updateData,
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: `ESTIMATION_${status}`,
        entity: 'Estimation',
        entityId: updated.id,
        details: { oldStatus: existing.status, newStatus: status },
      },
    });

    return NextResponse.json({ success: true, estimation: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
