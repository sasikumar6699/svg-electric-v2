import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as xlsx from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const items = await db.componentMaster.findMany({
      where: { active: true },
      orderBy: [{ make: 'asc' }, { category: 'asc' }, { description: 'asc' }],
    });

    const headers = [
      'Item Code',
      'Category',
      'Make / Brand',
      'Material Description',
      'Specification / Rating',
      'Type Code',
      'Unit',
      'List Price (MRP)',
      'Final Price (INR)',
      'HSN Code',
      'GST %',
      'Last Updated',
    ];

    const dataRows = items.map((item) => {
      const listP = item.listPrice && item.listPrice > 0 ? item.listPrice : (item.unitPrice || 0);
      const finalP = item.finalPrice && item.finalPrice > 0 ? item.finalPrice : Math.round(listP * 0.90 * 100) / 100;

      return [
        item.itemCode,
        item.category,
        item.make,
        item.description,
        item.rating || '',
        item.typeCode || '',
        item.unit,
        listP,
        finalP,
        item.hsnCode || '8537',
        item.gstRate,
        new Date(item.updatedAt).toISOString().split('T')[0],
      ];
    });

    const wsData = [headers, ...dataRows];
    const ws = xlsx.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 24 }, // Item Code
      { wch: 24 }, // Category
      { wch: 16 }, // Make
      { wch: 42 }, // Description
      { wch: 22 }, // Rating
      { wch: 22 }, // Type Code
      { wch: 8 },  // Unit
      { wch: 18 }, // Price
      { wch: 12 }, // HSN
      { wch: 8 },  // GST
      { wch: 14 }, // Date
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Component Master');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="SVG_Price_Master_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting price master:', error);
    return NextResponse.json({ error: 'Failed to export price master' }, { status: 500 });
  }
}
