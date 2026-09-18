import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'USER_LOGOUT',
          entity: 'User',
          entityId: user.userId,
        },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth_session', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json({ success: true });
  }
}
