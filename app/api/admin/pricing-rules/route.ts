import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { buildCriteriaHash } from '@/lib/pricing/pricing-engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (productId) where.productId = productId;
    if (activeOnly) where.active = true;

    const rules = await db.pricingRule.findMany({
      where,
      include: { product: { select: { id: true, productCode: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ rules });
  } catch {
    return NextResponse.json({ error: 'Failed to load pricing rules' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const { ruleCode, productId, specCriteria, basePrice, notes } = data;

    if (!ruleCode || !productId || !specCriteria || basePrice === undefined) {
      return NextResponse.json({ error: 'Rule Code, Product, Criteria, and Base Price are required.' }, { status: 400 });
    }

    const priceNum = Number(basePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: 'Base price must be a non-negative number.' }, { status: 400 });
    }

    const criteriaHash = buildCriteriaHash(specCriteria);

    const rule = await db.pricingRule.create({
      data: {
        ruleCode: ruleCode.trim().toUpperCase(),
        productId,
        specCriteria,
        criteriaHash,
        basePrice: priceNum,
        notes: notes || null,
        active: true,
      },
      include: { product: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRICING_RULE_CREATED',
        entity: 'PricingRule',
        entityId: rule.id,
        details: { ruleCode: rule.ruleCode, basePrice: rule.basePrice, criteriaHash },
      },
    });

    return NextResponse.json({ success: true, rule });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create pricing rule: ' + (err.message || '') }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const data = await request.json();
    const existing = await db.pricingRule.findUnique({ where: { id: data.id } });
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    const priceNum = data.basePrice !== undefined ? Number(data.basePrice) : existing.basePrice;
    const specCriteria = data.specCriteria || existing.specCriteria;
    const criteriaHash = buildCriteriaHash(specCriteria);

    const updated = await db.pricingRule.update({
      where: { id: data.id },
      data: {
        basePrice: priceNum,
        specCriteria,
        criteriaHash,
        notes: data.notes !== undefined ? data.notes : existing.notes,
        active: data.active !== undefined ? data.active : existing.active,
      },
      include: { product: true },
    });

    await db.auditLog.create({
      data: {
        userId: user.userId,
        action: 'PRICING_RULE_UPDATED',
        entity: 'PricingRule',
        entityId: updated.id,
        details: {
          ruleCode: updated.ruleCode,
          oldPrice: existing.basePrice,
          newPrice: updated.basePrice,
          active: updated.active,
        },
      },
    });

    return NextResponse.json({ success: true, rule: updated });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to update pricing rule' }, { status: 500 });
  }
}
