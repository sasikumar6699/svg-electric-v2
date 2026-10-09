import { NextRequest, NextResponse } from 'next/server';
import * as xlsx from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    // Exactly as required: Price is NOT necessary in the template!
    const headers = [
      'S.No',
      'Section / Sub-Assembly',
      'Material Description',
      'Specification / Rating',
      'Type Code',
      'Make / Brand',
      'Unit',
      'Quantity',
    ];

    const sampleRows = [
      [1, 'Main DC Control Panel', 'Thyristor 570A Module', '570A', 'SKKT 570/16E', 'Bussmann', 'Nos', 3],
      [2, 'Main DC Control Panel', 'Bridge Rectifier Module', 'SDCS-BAB-F02', 'SDCS-BAB-F02', 'ABB', 'Nos', 1],
      [3, 'Main DC Control Panel', 'DC Drive 680A 4Q Converter', '680A', 'DCS880-S01-0680-05', 'ABB', 'Nos', 1],
      [4, 'Main DC Control Panel', 'Switch Fuse Unit (SFU) 3P', '630A', 'OS630D03', 'ABB', 'Nos', 1],
      [5, 'Main DC Control Panel', 'Main AC Contactor 3P', '600A', 'AF305-30-11', 'ABB', 'Nos', 1],
      [6, 'Main DC Control Panel', 'Input Line Choke 3P', '600A', 'ACL-600A', 'Arihant Electrical', 'Nos', 1],
      [7, 'Main DC Control Panel', 'PLC CPU Module', '64 I/O', 'FX5U-64MT', 'Mitsubishi', 'Nos', 1],
      [8, 'Marshalling Box', 'Terminal Blocks Feed-Through', '2.5 sq.mm', 'KUT2.5', 'Elmex', 'Nos', 57],
      [9, 'HMI Operator Box', 'Color Touch Screen HMI 10 inch', '10 inch', 'IT7100E-INT', 'Inovance', 'Nos', 1],
      [10, 'Main DC Control Panel', 'Al. Busbar Main Power', '50x10 mm', 'EC-Grade Al', 'Reputed', 'Mtrs', 9],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = xlsx.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 26 }, // Section
      { wch: 38 }, // Description
      { wch: 22 }, // Rating
      { wch: 22 }, // Type Code
      { wch: 18 }, // Make
      { wch: 10 }, // Unit
      { wch: 12 }, // Quantity
    ];

    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Panel BOM Template');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="SVG_Panel_BOM_Template_NoPrice.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error generating BOM template:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
