import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET(request: NextRequest) {
  try {
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
    ];

    const sampleRows = [
      ['CMP-ABB-DCS880-680A', 'Drives & Softstarters', 'ABB', 'DC Drive 680A Converter Module', '680A 4Q', 'DCS880-S01-0680-05', 'Nos', 465556, 419000, '85044090', 18],
      ['CMP-ABB-AF305-CONT', 'Switchgear & Protection', 'ABB', 'Main AC Contactor 3P with 230V Coil', '600A AC-1', 'AF305-30-11-13', 'Nos', 33333, 30000, '85364900', 18],
      ['CMP-MITS-FX5U-64MT', 'Automation & Control', 'Mitsubishi', 'iQ-F High Speed PLC CPU Module', '64 I/O Transistor', 'FX5U-64MT/ESS', 'Nos', 44444, 40000, '85371000', 18],
      ['CMP-ELMEX-KUT2.5', 'Cables & Wiring', 'Elmex', 'Standard Feed-Through Terminal Block', '2.5 sq.mm', 'KUT 2.5', 'Nos', 13, 12, '85389000', 18],
      ['CMP-POLY-CU-1.0-GRY', 'Cables & Wiring', 'Polycab', 'FRLS Flexible Copper Control Wire', '1.0 sq.mm 1100V', 'FRLS-1.0-GRY', 'Mtrs', 28, 25, '85444990', 18],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = xlsx.utils.aoa_to_sheet(wsData);

    // Auto-fit column widths
    ws['!cols'] = [
      { wch: 22 }, // Item Code
      { wch: 24 }, // Category
      { wch: 16 }, // Make
      { wch: 38 }, // Description
      { wch: 22 }, // Rating
      { wch: 22 }, // Type Code
      { wch: 8 },  // Unit
      { wch: 18 }, // Price
      { wch: 14 }, // HSN
      { wch: 8 },  // GST
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Price Master');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Price_Master_Import_Template.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating price master template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
