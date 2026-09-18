import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET() {
  try {
    const settings = await db.companySettings.findUnique({ where: { id: 'default' } });
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();

    const updated = await db.companySettings.upsert({
      where: { id: 'default' },
      update: {
        companyName: data.companyName,
        tagline: data.tagline,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        gstin: data.gstin,
        gstEnabled: data.gstEnabled,
        defaultGSTRate: Number(data.defaultGSTRate) || 18,
        defaultCGSTRate: Number(data.defaultCGSTRate) || 9,
        defaultSGSTRate: Number(data.defaultSGSTRate) || 9,
        defaultIGSTRate: Number(data.defaultIGSTRate) || 18,
        estimationPrefix: data.estimationPrefix || 'EST-',
        yearBasedNumbering: data.yearBasedNumbering ?? true,
        termsAndConditions: data.termsAndConditions,
        bankDetails: data.bankDetails,
      },
      create: {
        id: 'default',
        companyName: data.companyName || 'SVG Electric & Control Products',
        tagline: data.tagline,
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        gstin: data.gstin || '',
        gstEnabled: data.gstEnabled ?? true,
        defaultGSTRate: Number(data.defaultGSTRate) || 18,
        defaultCGSTRate: Number(data.defaultCGSTRate) || 9,
        defaultSGSTRate: Number(data.defaultSGSTRate) || 9,
        defaultIGSTRate: Number(data.defaultIGSTRate) || 18,
        estimationPrefix: data.estimationPrefix || 'EST-',
        yearBasedNumbering: data.yearBasedNumbering ?? true,
        termsAndConditions: data.termsAndConditions || '',
        bankDetails: data.bankDetails || '',
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'COMPANY_SETTINGS_UPDATED',
        entity: 'CompanySettings',
        entityId: 'default',
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
