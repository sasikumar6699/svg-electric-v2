import { NextResponse } from 'next/server';
import { PricingEngine } from '@/lib/pricing/pricing-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, specifications, quantity, manualPriceOverride } = body;

    const result = await PricingEngine.calculatePrice({
      productId,
      specifications: specifications || {},
      quantity: Number(quantity) || 1,
      manualPriceOverride:
        manualPriceOverride !== undefined && manualPriceOverride !== null && manualPriceOverride !== ''
          ? Number(manualPriceOverride)
          : null,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { error: 'An error occurred while calculating the price. Please verify inputs.' },
      { status: 500 }
    );
  }
}
