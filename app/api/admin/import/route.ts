import { NextResponse } from 'next/server';
import { ExcelService } from '@/lib/excel/excel-service';
import { getCurrentUser } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'products' | 'pricing-rules';

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    if (type === 'products') {
      result = await ExcelService.validateAndImportProducts(buffer);
    } else if (type === 'pricing-rules') {
      result = await ExcelService.validateAndImportPricingRules(buffer);
    } else {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: 'Import failed: ' + (error.message || '') }, { status: 500 });
  }
}
