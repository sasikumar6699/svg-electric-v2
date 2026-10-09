import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as xlsx from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No Excel file provided.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const wb = xlsx.read(buffer, { type: 'buffer' });

    // Use sheet named BOM or the first sheet
    const sheetName = wb.SheetNames.find((s) => s.toUpperCase().includes('BOM')) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) {
      return NextResponse.json({ error: 'No valid sheet found in uploaded Excel file.' }, { status: 400 });
    }

    const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Fetch all active components from ComponentMaster for fast in-memory matching
    const masterComponents = await db.componentMaster.findMany({
      where: { active: true },
      select: {
        id: true,
        itemCode: true,
        description: true,
        rating: true,
        typeCode: true,
        make: true,
        category: true,
        unitPrice: true,
        unit: true,
      },
    });

    // Helper map for exact matches
    const makeTypeMap = new Map<string, typeof masterComponents[0]>();
    const makeDescMap = new Map<string, typeof masterComponents[0]>();

    for (const c of masterComponents) {
      const makeKey = (c.make || '').trim().toLowerCase();
      if (c.typeCode) {
        makeTypeMap.set(`${makeKey}::${c.typeCode.trim().toLowerCase()}`, c);
      }
      makeTypeMap.set(c.itemCode.trim().toLowerCase(), c);
      makeDescMap.set(`${makeKey}::${c.description.trim().toLowerCase()}`, c);
    }

    const parsedItems: any[] = [];
    let currentSection = 'Main Control Panel';
    let sNoCounter = 1;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] || '').trim();

      // Detect sub-assembly section headers
      if (firstCell.toUpperCase().includes('CONTROL SYSTEM') || firstCell.toUpperCase().includes('MAIN PANEL')) {
        currentSection = firstCell;
        continue;
      }
      if (firstCell.toUpperCase().includes('MARSHALLING')) {
        currentSection = 'Marshalling Box';
        continue;
      }
      if (firstCell.toUpperCase().includes('HMI')) {
        currentSection = 'HMI Operator Station Box';
        continue;
      }

      // Skip header rows
      if (
        firstCell.toUpperCase().startsWith('S.NO') ||
        firstCell.toUpperCase().startsWith('CUSTOMER') ||
        firstCell.toUpperCase().startsWith('DESPATCH') ||
        firstCell.toUpperCase().startsWith('PRODUCTION')
      ) {
        continue;
      }

      let sNo = parseInt(firstCell, 10);
      let desc = '';
      let rating = '';
      let typeCode = '';
      let make = '';
      let unit = 'Nos';
      let qty = 1;
      let explicitPrice: number | null = null;

      // Handle standard 8-column template or 11-column full BOM format
      if (!isNaN(sNo)) {
        desc = String(row[1] || '').trim();
        rating = row[2] ? String(row[2]).trim() : '';
        typeCode = row[3] ? String(row[3]).trim() : '';
        make = row[4] ? String(row[4]).trim() : 'Standard';
        unit = row[5] ? String(row[5]).trim() : 'Nos';
        qty = parseFloat(String(row[6] || 1)) || 1;
        // Check if price was provided in column 7
        if (row[7] !== undefined && row[7] !== null && String(row[7]).trim() !== '' && !isNaN(Number(row[7]))) {
          explicitPrice = parseFloat(String(row[7]));
        }
      } else {
        // If first cell was not a number, maybe it's Description (no S.No column)
        desc = firstCell;
        if (!desc || desc.length < 2) continue;
        rating = row[1] ? String(row[1]).trim() : '';
        typeCode = row[2] ? String(row[2]).trim() : '';
        make = row[3] ? String(row[3]).trim() : 'Standard';
        unit = row[4] ? String(row[4]).trim() : 'Nos';
        qty = parseFloat(String(row[5] || 1)) || 1;
        sNo = sNoCounter;
      }

      if (!desc && !typeCode) continue;

      sNoCounter++;
      const cleanMake = make.trim().toLowerCase();
      const cleanType = typeCode.trim().toLowerCase();
      const cleanDesc = desc.trim().toLowerCase();

      // Attempt matching against Price Master
      let matchedComp = null;
      if (cleanType) {
        matchedComp = makeTypeMap.get(`${cleanMake}::${cleanType}`);
      }
      if (!matchedComp && cleanDesc) {
        matchedComp = makeDescMap.get(`${cleanMake}::${cleanDesc}`);
      }
      if (!matchedComp) {
        // Fuzzy search: check if any component matches description substring & make
        matchedComp = masterComponents.find(
          (c) =>
            c.make.toLowerCase() === cleanMake &&
            (c.description.toLowerCase().includes(cleanDesc) || cleanDesc.includes(c.description.toLowerCase()))
        );
      }

      let finalUnitPrice: number | null = explicitPrice;
      let isMapped = false;
      let componentId: string | null = null;
      let matchedCategory = 'Switchgear & Protection';

      if (matchedComp) {
        // Price master takes precedence or fills empty price
        finalUnitPrice = matchedComp.unitPrice;
        isMapped = true;
        componentId = matchedComp.id;
        matchedCategory = matchedComp.category;
      } else if (explicitPrice !== null && explicitPrice > 0) {
        // Price was present in uploaded sheet
        isMapped = true;
      }

      // Auto-categorize unmapped items
      if (!isMapped) {
        if (cleanDesc.includes('drive') || cleanDesc.includes('vfd') || cleanDesc.includes('thyristor')) {
          matchedCategory = 'Drives & Softstarters';
        } else if (cleanDesc.includes('enclosure') || cleanDesc.includes('box')) {
          matchedCategory = 'Enclosures';
        } else if (cleanDesc.includes('busbar') || cleanDesc.includes('sleeve')) {
          matchedCategory = 'Busbar Systems';
        } else if (cleanDesc.includes('wire') || cleanDesc.includes('cable') || cleanDesc.includes('lug') || cleanDesc.includes('terminal')) {
          matchedCategory = 'Cables & Wiring';
        } else if (cleanDesc.includes('plc') || cleanDesc.includes('hmi')) {
          matchedCategory = 'Automation & Control';
        }
      }

      const totalAmount = finalUnitPrice !== null ? Math.round(qty * finalUnitPrice) : 0;
      const gstAmount = finalUnitPrice !== null ? Math.round(totalAmount * 0.18) : 0;
      const grandTotal = totalAmount + gstAmount;

      parsedItems.push({
        id: `bom-${Date.now()}-${parsedItems.length + 1}`,
        sectionName: currentSection,
        sNo,
        description: desc,
        rating: rating || null,
        typeCode: typeCode || null,
        make: make || 'Standard',
        unit: unit || 'Nos',
        quantity: qty,
        unitPrice: finalUnitPrice, // null if unmapped!
        totalAmount,
        gstAmount,
        grandTotal,
        isMapped,
        componentId,
        category: matchedCategory,
      });
    }

    const unmappedCount = parsedItems.filter((it) => it.unitPrice === null || it.unitPrice <= 0).length;
    const mappedCount = parsedItems.length - unmappedCount;

    return NextResponse.json({
      success: true,
      items: parsedItems,
      totalCount: parsedItems.length,
      mappedCount,
      unmappedCount,
    });
  } catch (error: any) {
    console.error('Error parsing BOM Excel upload:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse BOM file' }, { status: 500 });
  }
}
