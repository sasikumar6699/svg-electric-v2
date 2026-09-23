import { NextResponse } from 'next/server';
import { ExcelService } from '@/lib/excel/excel-service';
import { getCurrentUser } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'products') {
      const buffer = await ExcelService.exportProductsOnly();
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="svg_electric_products_catalog.xlsx"',
        },
      });
    }

    const buffer = await ExcelService.exportMasterData();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="svg_electric_master_data.xlsx"',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to export master data' }, { status: 500 });
  }
}
