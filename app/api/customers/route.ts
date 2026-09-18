import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const customers = await db.customer.findMany({
      where: {
        active: true,
        OR: q
          ? [
              { customerName: { contains: q, mode: 'insensitive' } },
              { companyName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { companyName: 'asc' },
    });

    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const data = await request.json();

    if (!data.companyName || !data.customerName || !data.phone || !data.address) {
      return NextResponse.json({ error: 'Company Name, Customer Name, Phone, and Address are required.' }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        companyName: data.companyName.trim(),
        customerName: data.customerName.trim(),
        contactPerson: data.contactPerson ? data.contactPerson.trim() : null,
        phone: data.phone.trim(),
        email: data.email ? data.email.trim() : null,
        address: data.address.trim(),
        gstin: data.gstin ? data.gstin.trim().toUpperCase() : null,
        state: data.state || 'Tamil Nadu',
        notes: data.notes || null,
        active: true,
      },
    });

    if (user) {
      await db.auditLog.create({
        data: {
          userId: user.userId,
          action: 'CUSTOMER_CREATED',
          entity: 'Customer',
          entityId: customer.id,
          details: { companyName: customer.companyName },
        },
      });
    }

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
