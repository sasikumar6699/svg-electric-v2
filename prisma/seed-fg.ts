import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExcelRow {
  sNo: number;
  description: string;
  rating: string;
  typeCode: string;
  make: string;
  unit: string;
  qty: number;
  pricePerUnit: number;
  totalAmount: number;
  gst: number;
  grandTotal: number;
  section: string;
}

function sanitizeCode(text: string, fallback: string): string {
  if (!text) return fallback;
  const cleaned = text.trim().replace(/[^a-zA-Z0-9_-]/g, '-').toUpperCase();
  return cleaned.length > 0 ? cleaned.substring(0, 40) : fallback;
}

async function main() {
  console.log('=== SVG Electric Finished Goods & BOM Ingestion ===');

  const excelPath = path.resolve('C:/Users/LENOVO/.gemini/antigravity/brain/646b3c2e-ac0d-47d9-8f88-9fe70d59109f/.user_uploaded/media_1790913185708.xlsx');
  console.log(`Reading BOM dataset from: ${excelPath}`);

  const wb = xlsx.readFile(excelPath);
  const sheet = wb.Sheets['BOM'];
  if (!sheet) {
    throw new Error('Sheet "BOM" not found in uploaded excel file.');
  }

  const rawRows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  // 1. Ensure ProductCategory CAT-DCD exists
  const dcCategory = await prisma.productCategory.upsert({
    where: { code: 'CAT-DCD' },
    update: {
      name: 'DC Drive Panel',
      description: 'DC motor drive and regenerative thyristor converter control panels',
    },
    create: {
      code: 'CAT-DCD',
      name: 'DC Drive Panel',
      description: 'DC motor drive and regenerative thyristor converter control panels',
      displayOrder: 5,
    },
  });
  console.log(`✓ DC Category Verified: ${dcCategory.name} (${dcCategory.id})`);

  // Parse all 129 line items into structured list
  const bomRows: ExcelRow[] = [];
  let currentSection = 'Main DC Control Panel';

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').trim();

    if (firstCell.includes('CONTROL SYSTEM FOR DC')) {
      currentSection = 'Main DC Control Panel';
      continue;
    }
    if (firstCell.includes('MARSHALLING BOX')) {
      currentSection = 'Marshalling Box';
      continue;
    }
    if (firstCell.includes('HMI Box')) {
      currentSection = 'HMI Operator Station Box';
      continue;
    }

    // Skip headers and customer metadata
    if (firstCell.startsWith('CUSTOMER') || firstCell.startsWith('S.NO') || isNaN(Number(firstCell))) {
      continue;
    }

    const sNo = parseInt(firstCell, 10);
    const description = String(row[1] || '').trim();
    if (!description && !row[4]) continue;

    const rating = row[2] ? String(row[2]).trim() : '';
    const typeCode = row[3] ? String(row[3]).trim() : '';
    const make = row[4] ? String(row[4]).trim() : 'Standard';
    const unit = row[5] ? String(row[5]).trim() : 'Nos';
    const qty = parseFloat(String(row[6] || 1)) || 1;
    const pricePerUnit = parseFloat(String(row[7] || 0)) || 0;
    const totalAmount = parseFloat(String(row[8] || (qty * pricePerUnit))) || (qty * pricePerUnit);
    const gst = parseFloat(String(row[9] || (totalAmount * 0.18))) || (totalAmount * 0.18);
    const grandTotal = parseFloat(String(row[10] || (totalAmount + gst))) || (totalAmount + gst);

    bomRows.push({
      sNo,
      description: description || `Component Item ${sNo}`,
      rating,
      typeCode,
      make,
      unit,
      qty,
      pricePerUnit,
      totalAmount,
      gst,
      grandTotal,
      section: currentSection,
    });
  }

  console.log(`✓ Parsed ${bomRows.length} BOM lines from client Excel.`);

  // 2. Ingest into ComponentMaster
  console.log('Seeding ComponentMaster library...');
  const componentData = [];
  const seenCodes = new Set<string>();

  for (let idx = 0; idx < bomRows.length; idx++) {
    const item = bomRows[idx];
    const categoryGroup =
      item.description.toLowerCase().includes('drive') ? 'Drives & Softstarters' :
      item.description.toLowerCase().includes('enclosure') ? 'Enclosures' :
      item.description.toLowerCase().includes('busbar') ? 'Busbar Systems' :
      item.description.toLowerCase().includes('wire') || item.description.toLowerCase().includes('cable') || item.description.toLowerCase().includes('lug') ? 'Cables & Wiring' :
      item.description.toLowerCase().includes('plc') || item.description.toLowerCase().includes('hmi') ? 'Automation & Control' :
      'Switchgear & Protection';

    const itemCode = `CMP-${sanitizeCode(item.make, 'GEN')}-${sanitizeCode(item.typeCode || item.description, `ITM${idx + 1}`)}`;
    if (!seenCodes.has(itemCode)) {
      seenCodes.add(itemCode);
      componentData.push({
        itemCode,
        description: item.description,
        rating: item.rating || null,
        typeCode: item.typeCode || null,
        make: item.make,
        unit: item.unit,
        unitPrice: item.pricePerUnit,
        category: categoryGroup,
        hsnCode: '8537',
        gstRate: 18.0,
      });
    }
  }

  await prisma.componentMaster.createMany({
    data: componentData,
    skipDuplicates: true,
  });
  console.log(`✓ ComponentMaster populated with ${componentData.length} unique bought-out components.`);

  // 3. SEED FINISHED GOOD 1: SVG-DC-680A-STD (Client Baseline, 129 Items)
  console.log('Seeding FG Model 1: SVG-DC-680A-STD...');
  const baseBomSum = bomRows.reduce((acc, r) => acc + r.totalAmount, 0); // ~863,810

  // 4 Stages for 680A Standard:
  const fg1Fab = 75000;    // Enclosures (65k main + 5k marshalling + 5k HMI)
  const fg1Busbar = 51000; // Al busbars, heat-shrink sleeves, clamps, bending labor
  const fg1Wiring = 25000; // Copper flexible wires, lugs, TBs, point wiring labor
  const fg1Hardware = baseBomSum - fg1Fab - 31000; // Hardware excluding structural fab & raw busbar items
  const fg1NetCost = fg1Hardware + fg1Fab + fg1Busbar + fg1Wiring; // Total direct cost ~910,000

  const fg1Fat = 18000;
  const fg1Design = 22000;
  const fg1Overhead = 36000;
  const fg1MarginPct = 15.0;
  const fg1Subtotal = fg1NetCost + fg1Fat + fg1Design + fg1Overhead;
  const fg1ExWorks = Math.round(fg1Subtotal * (1 + fg1MarginPct / 100));
  const fg1Gst = Math.round(fg1ExWorks * 0.18);
  const fg1Gross = fg1ExWorks + fg1Gst;

  // Clean existing FG if any to allow fresh recreation
  await prisma.finishedGood.deleteMany({
    where: { modelNumber: { in: ['SVG-DC-680A-STD', 'SVG-DC-400A-ECON', 'SVG-DC-1000A-PREM'] } },
  });

  const fg1 = await prisma.finishedGood.create({
    data: {
      modelNumber: 'SVG-DC-680A-STD',
      name: 'DC Drive Control System 680A (Standard)',
      categoryId: dcCategory.id,
      description: 'Standard 680A heavy-duty DC drive system with ABB DCS880 drive, Mitsubishi FX5U PLC, Inovance 10" HMI, Marshalling Box, and EC grade Aluminum busbar power distribution.',
      enclosureHeight: 2000,
      enclosureWidth: 1000,
      enclosureDepth: 600,
      ipRating: 'IP54',
      formRating: 'Form 2B',
      bomMaterialCost: baseBomSum,
      fabricationCost: fg1Fab,
      busbarCost: fg1Busbar,
      wiringCost: fg1Wiring,
      netManufacturingCost: fg1NetCost,
      fatTestingCost: fg1Fat,
      designEngineeringCost: fg1Design,
      overheadCost: fg1Overhead,
      profitMarginPercent: fg1MarginPct,
      finalExWorksPrice: fg1ExWorks,
      gstAmount: fg1Gst,
      finalGrossPrice: fg1Gross,
      bomItems: {
        create: bomRows.map((r, idx) => ({
          sectionName: r.section,
          sNo: r.sNo,
          description: r.description,
          rating: r.rating || null,
          typeCode: r.typeCode || null,
          make: r.make,
          unit: r.unit,
          quantity: r.qty,
          unitPrice: r.pricePerUnit,
          totalAmount: r.totalAmount,
          gstAmount: r.gst,
          grandTotal: r.grandTotal,
        })),
      },
      variants: {
        create: [
          {
            dimensionName: 'DC Drive & Switchgear Make',
            displayOrder: 1,
            options: {
              create: [
                { optionName: 'ABB DCS880 680A + AF Contactor + OS SFU', isDefault: true, priceDelta: 0, description: 'Standard premium ABB drive with heavy-duty switchgear', displayOrder: 1 },
                { optionName: 'Siemens Sinamics DCM 680A + 3RT Contactor', isDefault: false, priceDelta: 45000, description: 'Siemens DCM 4-quadrant drive with SIRIUS switchgear', displayOrder: 2 },
                { optionName: 'Inovance 680A DC Drive + Schneider Switchgear', isDefault: false, priceDelta: -55000, description: 'Cost-effective alternative for general industrial drives', displayOrder: 3 },
              ],
            },
          },
          {
            dimensionName: 'Automation & PLC / HMI Tier',
            displayOrder: 2,
            options: {
              create: [
                { optionName: 'Mitsubishi FX5U PLC + Inovance 10" Color HMI', isDefault: true, priceDelta: 0, description: 'Standard high-speed PLC with 10" capacitive touch screen', displayOrder: 1 },
                { optionName: 'Siemens S7-1200 CPU + Siemens KTP1000 Comfort HMI', isDefault: false, priceDelta: 55000, description: 'Profinet industrial Ethernet architecture with Siemens TIA Portal', displayOrder: 2 },
                { optionName: 'Inovance H5U PLC + Inovance 7" Touch HMI', isDefault: false, priceDelta: -18000, description: 'Compact architecture for cost-sensitive projects', displayOrder: 3 },
              ],
            },
          },
          {
            dimensionName: 'Busbar Conductor Material',
            displayOrder: 3,
            options: {
              create: [
                { optionName: 'Electrolytic EC Aluminum Busbar (50x10 mm)', isDefault: true, priceDelta: 0, description: 'Standard EC-Grade Aluminum with heat-shrink insulation sleeves', displayOrder: 1 },
                { optionName: 'ETP Electrolytic Copper Busbar 99.9% Pure (Tin Plated)', isDefault: false, priceDelta: 82000, description: 'Maximum conductivity, lowest temperature rise, superior corrosion resistance', displayOrder: 2 },
              ],
            },
          },
          {
            dimensionName: 'Remote IoT Telemetry & Diagnostics',
            displayOrder: 4,
            options: {
              create: [
                { optionName: 'Without Remote Gateway (Hardwired Terminal IO Only)', isDefault: true, priceDelta: 0, description: 'Standard hardwired field signals and local HMI operation', displayOrder: 1 },
                { optionName: 'Industrial 4G/Ethernet Cloud IoT Telemetry Gateway', isDefault: false, priceDelta: 38000, description: 'Secure remote monitoring, live alarms, SMS alerts, and remote drive tuning', displayOrder: 2 },
              ],
            },
          },
          {
            dimensionName: 'Enclosure Form of Separation',
            displayOrder: 5,
            options: {
              create: [
                { optionName: 'Form 2B Standard Industrial Enclosure', isDefault: true, priceDelta: 0, description: 'Terminals separated from busbars, IP54 rated sheet metal', displayOrder: 1 },
                { optionName: 'Form 4B Compartmentalized Separation', isDefault: false, priceDelta: 28000, description: 'Individual functional units and terminal chambers separated by steel barriers', displayOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✓ FG 1 Created: ${fg1.modelNumber} with 129 BOM items and 5 variant dimensions.`);

  // 4. SEED FINISHED GOOD 2: SVG-DC-400A-ECON (400A Economy Variant)
  console.log('Seeding FG Model 2: SVG-DC-400A-ECON...');
  const econMultiplier = 0.72; // ~28% cost reduction for 400A drive & switchgear
  const fg2BomRows = bomRows.map((r) => {
    let price = r.pricePerUnit;
    let desc = r.description;
    let rating = r.rating;

    if (desc.toLowerCase().includes('drive') && r.make === 'ABB') {
      price = 295000; // 400A drive
      rating = '400A';
    } else if (desc.toLowerCase().includes('thyristor')) {
      price = 8500; // 350A thyristor
      rating = '350A';
    } else if (desc.toLowerCase().includes('sfu') && r.make === 'ABB') {
      price = 16000; // 400A SFU
      rating = '400A';
    } else if (desc.toLowerCase().includes('main contactor')) {
      price = 21000; // 400A contactor
      rating = '400A';
    } else if (desc.toLowerCase().includes('choke')) {
      price = 26000;
      rating = '400A';
    } else if (desc.toLowerCase().includes('hmi') && desc.toLowerCase().includes('inovance')) {
      price = 14000; // 7" HMI
      desc = 'HMI Inovance 7" Touch Screen';
      rating = '7 inch';
    } else if (desc.toLowerCase().includes('busbar')) {
      price = Math.round(price * 0.8);
    }

    const total = Math.round(r.qty * price);
    const gst = Math.round(total * 0.18);
    return {
      ...r,
      description: desc,
      rating,
      pricePerUnit: price,
      totalAmount: total,
      gst,
      grandTotal: total + gst,
    };
  });

  const fg2BomSum = fg2BomRows.reduce((acc, r) => acc + r.totalAmount, 0);
  const fg2Fab = 65000;
  const fg2Busbar = 38000;
  const fg2Wiring = 20000;
  const fg2NetCost = fg2BomSum;
  const fg2Fat = 14000;
  const fg2Design = 16000;
  const fg2Overhead = 28000;
  const fg2MarginPct = 14.0;
  const fg2Subtotal = fg2NetCost + fg2Fat + fg2Design + fg2Overhead;
  const fg2ExWorks = Math.round(fg2Subtotal * (1 + fg2MarginPct / 100));
  const fg2Gst = Math.round(fg2ExWorks * 0.18);
  const fg2Gross = fg2ExWorks + fg2Gst;

  const fg2 = await prisma.finishedGood.create({
    data: {
      modelNumber: 'SVG-DC-400A-ECON',
      name: 'DC Drive Control System 400A (Economy)',
      categoryId: dcCategory.id,
      description: 'Compact 400A DC drive solution for up to 150HP industrial DC motors. Features ABB 400A DC drive, Mitsubishi PLC, Inovance 7" HMI, and optimized aluminum busbars.',
      enclosureHeight: 1800,
      enclosureWidth: 900,
      enclosureDepth: 500,
      ipRating: 'IP52',
      formRating: 'Form 2B',
      bomMaterialCost: fg2BomSum,
      fabricationCost: fg2Fab,
      busbarCost: fg2Busbar,
      wiringCost: fg2Wiring,
      netManufacturingCost: fg2NetCost,
      fatTestingCost: fg2Fat,
      designEngineeringCost: fg2Design,
      overheadCost: fg2Overhead,
      profitMarginPercent: fg2MarginPct,
      finalExWorksPrice: fg2ExWorks,
      gstAmount: fg2Gst,
      finalGrossPrice: fg2Gross,
      bomItems: {
        create: fg2BomRows.map((r) => ({
          sectionName: r.section,
          sNo: r.sNo,
          description: r.description,
          rating: r.rating || null,
          typeCode: r.typeCode || null,
          make: r.make,
          unit: r.unit,
          quantity: r.qty,
          unitPrice: r.pricePerUnit,
          totalAmount: r.totalAmount,
          gstAmount: r.gst,
          grandTotal: r.grandTotal,
        })),
      },
      variants: {
        create: [
          {
            dimensionName: 'DC Drive & Switchgear Make',
            displayOrder: 1,
            options: {
              create: [
                { optionName: 'ABB DCS880 400A + AF Contactor', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Siemens Sinamics DCM 400A', isDefault: false, priceDelta: 35000, displayOrder: 2 },
                { optionName: 'Inovance 400A DC Drive Package', isDefault: false, priceDelta: -45000, displayOrder: 3 },
              ],
            },
          },
          {
            dimensionName: 'Automation & PLC / HMI Tier',
            displayOrder: 2,
            options: {
              create: [
                { optionName: 'Mitsubishi FX5U PLC + Inovance 7" Color HMI', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Upgrade to Inovance 10" Capacitive HMI', isDefault: false, priceDelta: 8000, displayOrder: 2 },
                { optionName: 'Siemens S7-1200 + 7" KTP700 Basic HMI', isDefault: false, priceDelta: 38000, displayOrder: 3 },
              ],
            },
          },
          {
            dimensionName: 'Busbar Conductor Material',
            displayOrder: 3,
            options: {
              create: [
                { optionName: 'Electrolytic EC Aluminum Busbar (40x10 mm)', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'ETP Electrolytic Copper Busbar 99.9% Pure', isDefault: false, priceDelta: 55000, displayOrder: 2 },
              ],
            },
          },
          {
            dimensionName: 'Remote IoT Telemetry & Diagnostics',
            displayOrder: 4,
            options: {
              create: [
                { optionName: 'Without Remote Gateway', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Industrial 4G/Ethernet Cloud IoT Telemetry Gateway', isDefault: false, priceDelta: 38000, displayOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✓ FG 2 Created: ${fg2.modelNumber} with 129 BOM items.`);

  // 5. SEED FINISHED GOOD 3: SVG-DC-1000A-PREM (1000A Heavy Industrial Variant)
  console.log('Seeding FG Model 3: SVG-DC-1000A-PREM...');
  const fg3BomRows = bomRows.map((r) => {
    let price = r.pricePerUnit;
    let desc = r.description;
    let rating = r.rating;
    let make = r.make;

    if (desc.toLowerCase().includes('drive') && r.make === 'ABB') {
      price = 680000; // 1000A drive
      rating = '1000A';
    } else if (desc.toLowerCase().includes('thyristor')) {
      price = 22000; // 900A thyristor
      rating = '900A';
    } else if (desc.toLowerCase().includes('sfu')) {
      price = 55000; // 1000A SFU / ACB
      desc = '1000A 3P Drawout Air Circuit Breaker (ACB) / SFU Incomer';
      rating = '1000A';
    } else if (desc.toLowerCase().includes('main contactor')) {
      price = 58000; // 1000A contactor
      rating = '1000A';
    } else if (desc.toLowerCase().includes('choke')) {
      price = 62000;
      rating = '1000A';
    } else if (desc.toLowerCase().includes('plc')) {
      price = 110000;
      desc = 'PLC Siemens Simatic S7-1500 Advanced Automation CPU';
      make = 'Siemens';
      rating = 'CPU 1515-2 PN';
    } else if (desc.toLowerCase().includes('hmi')) {
      price = 65000;
      desc = 'Siemens TP1200 12" Comfort High-Resolution HMI';
      make = 'Siemens';
      rating = '12 inch Comfort';
    } else if (desc.toLowerCase().includes('busbar')) {
      price = Math.round(price * 2.2); // Copper busbars
      desc = desc.replace(/AL\./i, 'Cu. (Copper) ');
    } else if (desc.toLowerCase().includes('panel enclosure')) {
      price = 120000; // Dual-door Rittal type with cooling unit
      desc = 'Heavy Duty Dual Door IP55 Enclosure with 1.5 TR Closed-Loop AC';
    }

    const total = Math.round(r.qty * price);
    const gst = Math.round(total * 0.18);
    return {
      ...r,
      description: desc,
      rating,
      make,
      pricePerUnit: price,
      totalAmount: total,
      gst,
      grandTotal: total + gst,
    };
  });

  const fg3BomSum = fg3BomRows.reduce((acc, r) => acc + r.totalAmount, 0);
  const fg3Fab = 120000; // Heavy duty dual-door + AC unit
  const fg3Busbar = 115000; // 1000A Copper busbar system
  const fg3Wiring = 42000;
  const fg3NetCost = fg3BomSum;
  const fg3Fat = 28000;
  const fg3Design = 35000;
  const fg3Overhead = 55000;
  const fg3MarginPct = 16.0;
  const fg3Subtotal = fg3NetCost + fg3Fat + fg3Design + fg3Overhead;
  const fg3ExWorks = Math.round(fg3Subtotal * (1 + fg3MarginPct / 100));
  const fg3Gst = Math.round(fg3ExWorks * 0.18);
  const fg3Gross = fg3ExWorks + fg3Gst;

  const fg3 = await prisma.finishedGood.create({
    data: {
      modelNumber: 'SVG-DC-1000A-PREM',
      name: 'DC Drive Control System 1000A (Premium Heavy Duty)',
      categoryId: dcCategory.id,
      description: 'Engineered for severe duty steel rolling mills and extruders. ABB 1000A DC drive, Siemens S7-1500 PLC, 12" Comfort HMI, 99.9% ETP Copper busbar system, and closed-loop climate controlled IP55 enclosure.',
      enclosureHeight: 2200,
      enclosureWidth: 1600,
      enclosureDepth: 800,
      ipRating: 'IP55',
      formRating: 'Form 4B',
      bomMaterialCost: fg3BomSum,
      fabricationCost: fg3Fab,
      busbarCost: fg3Busbar,
      wiringCost: fg3Wiring,
      netManufacturingCost: fg3NetCost,
      fatTestingCost: fg3Fat,
      designEngineeringCost: fg3Design,
      overheadCost: fg3Overhead,
      profitMarginPercent: fg3MarginPct,
      finalExWorksPrice: fg3ExWorks,
      gstAmount: fg3Gst,
      finalGrossPrice: fg3Gross,
      bomItems: {
        create: fg3BomRows.map((r) => ({
          sectionName: r.section,
          sNo: r.sNo,
          description: r.description,
          rating: r.rating || null,
          typeCode: r.typeCode || null,
          make: r.make,
          unit: r.unit,
          quantity: r.qty,
          unitPrice: r.pricePerUnit,
          totalAmount: r.totalAmount,
          gstAmount: r.gst,
          grandTotal: r.grandTotal,
        })),
      },
      variants: {
        create: [
          {
            dimensionName: 'DC Drive & Converter Make',
            displayOrder: 1,
            options: {
              create: [
                { optionName: 'ABB DCS880 1000A 4-Quadrant Regenerative Drive', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Siemens Sinamics DCM 1000A 4Q Regenerative Drive', isDefault: false, priceDelta: 65000, displayOrder: 2 },
              ],
            },
          },
          {
            dimensionName: 'Automation & PLC Architecture',
            displayOrder: 2,
            options: {
              create: [
                { optionName: 'Siemens S7-1500 Advanced PLC + 12" Comfort HMI', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Siemens S7-1500 Redundant CPU (Hot Standby)', isDefault: false, priceDelta: 145000, displayOrder: 2 },
                { optionName: 'Mitsubishi iQ-R High Performance PLC + 12" GOT HMI', isDefault: false, priceDelta: -25000, displayOrder: 3 },
              ],
            },
          },
          {
            dimensionName: 'Enclosure Cooling & Climate Control',
            displayOrder: 3,
            options: {
              create: [
                { optionName: '1.5 TR Closed-Loop Industrial Air Conditioner (IP55)', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Dual 1.5 TR Redundant Air Conditioners with Auto-Sequencer', isDefault: false, priceDelta: 72000, displayOrder: 2 },
              ],
            },
          },
          {
            dimensionName: 'Cloud Telemetry & Industry 4.0 Gateway',
            displayOrder: 4,
            options: {
              create: [
                { optionName: 'Ewon Flexy 205 Industrial IoT Gateway with VPN', isDefault: true, priceDelta: 0, displayOrder: 1 },
                { optionName: 'Without IoT Gateway (Field hardwired signals only)', isDefault: false, priceDelta: -38000, displayOrder: 2 },
              ],
            },
          },
        ],
      },
    },
  });
  console.log(`✓ FG 3 Created: ${fg3.modelNumber} with 129 BOM items.`);

  console.log('\n=== Seeding Completed Successfully! ===');
  console.log(`Summary:`);
  console.log(`- Finished Goods seeded: 3`);
  console.log(`  1. ${fg1.modelNumber}: ₹${fg1.finalExWorksPrice.toLocaleString('en-IN')} (Gross: ₹${fg1.finalGrossPrice.toLocaleString('en-IN')})`);
  console.log(`  2. ${fg2.modelNumber}: ₹${fg2.finalExWorksPrice.toLocaleString('en-IN')} (Gross: ₹${fg2.finalGrossPrice.toLocaleString('en-IN')})`);
  console.log(`  3. ${fg3.modelNumber}: ₹${fg3.finalExWorksPrice.toLocaleString('en-IN')} (Gross: ₹${fg3.finalGrossPrice.toLocaleString('en-IN')})`);
  console.log(`- ComponentMaster items: ${componentData.length}`);
  console.log(`- Total BOM line items: ${bomRows.length * 3} across 3 models.`);
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
