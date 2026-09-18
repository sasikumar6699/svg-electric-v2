import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { Role } from '@prisma/client';

export async function GET() {
  try {
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, phone: true, active: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    if (!data.email || !data.password || !data.name) {
      return NextResponse.json({ error: 'Email, Password, and Name are required.' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);
    const newUser = await db.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        name: data.name.trim(),
        role: data.role === 'ADMIN' ? Role.ADMIN : Role.SALES_USER,
        phone: data.phone || null,
        active: true,
      },
      select: { id: true, email: true, name: true, role: true, phone: true, active: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: newUser.id,
        details: { email: newUser.email, role: newUser.role },
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const updateData: any = {
      name: data.name?.trim(),
      phone: data.phone || null,
      role: data.role,
      active: data.active,
    };

    if (data.password && data.password.trim().length >= 6) {
      updateData.passwordHash = await hashPassword(data.password.trim());
    }

    const updated = await db.user.update({
      where: { id: data.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true, phone: true, active: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: updated.id,
        details: { email: updated.email, role: updated.role, active: updated.active },
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
