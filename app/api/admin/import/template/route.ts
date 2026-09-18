import { NextResponse } from 'next/server';
import { ExcelService } from '@/lib/excel/excel-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') as any) || 'products';

    const buffer = ExcelService.generateTemplate(type);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="svg_${type}_template.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
