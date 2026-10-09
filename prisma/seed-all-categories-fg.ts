import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding Finished Goods for All Categories ===');

  // Fetch all categories
  const categories = await prisma.productCategory.findMany();
  const catMap = new Map<string, string>(); // code -> id
  categories.forEach((c) => catMap.set(c.code, c.id));

  // 1. MCC Panel: SVG-MCC-400A-6F
  const mccCatId = catMap.get('CAT-MCC');
  if (mccCatId) {
    console.log('Seeding MCC Panel: SVG-MCC-400A-6F...');
    const mccBom = [
      { sNo: 1, sectionName: 'Incomer Feeder', description: '400A 3P 36kA Thermal-Magnetic MCCB Incomer', rating: '400A 36kA', typeCode: 'XT4N 400', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 38000 },
      { sNo: 2, sectionName: 'Incomer Feeder', description: 'Digital Multifunction Energy Meter with RS485 Modbus', rating: '96x96 mm Cl 1.0', typeCode: 'RISH Master 3440', make: 'Rishabh', unit: 'Nos', quantity: 1, unitPrice: 8500 },
      { sNo: 3, sectionName: 'Incomer Feeder', description: 'Current Transformers (CT) Class 1.0 15VA', rating: '400/5A', typeCode: 'RCT-400/5', make: 'Automatic Electric', unit: 'Nos', quantity: 3, unitPrice: 1200 },
      { sNo: 4, sectionName: 'Incomer Feeder', description: 'LED Phase Indicating Lamps (R, Y, B)', rating: '230V AC LED', typeCode: 'CL2-523', make: 'ABB', unit: 'Set', quantity: 1, unitPrice: 650 },
      { sNo: 5, sectionName: 'Starter Feeders (6 Nos)', description: 'Star-Delta Motor Starters for 30HP Pumps (3 Nos)', rating: '30HP / 45A', typeCode: 'AF30-30 Star-Delta', make: 'ABB', unit: 'Set', quantity: 3, unitPrice: 28500 },
      { sNo: 6, sectionName: 'Starter Feeders (6 Nos)', description: 'Direct-on-Line (DOL) Starters for 10HP Motors (3 Nos)', rating: '10HP / 18A', typeCode: 'AF16-30 DOL', make: 'ABB', unit: 'Set', quantity: 3, unitPrice: 12500 },
      { sNo: 7, sectionName: 'Starter Feeders (6 Nos)', description: 'Motor Protection Circuit Breakers (MPCB)', rating: '16-25A', typeCode: 'MS132-25', make: 'ABB', unit: 'Nos', quantity: 6, unitPrice: 4200 },
      { sNo: 8, sectionName: 'Busbar & Structure', description: 'EC Grade Aluminum Busbars 400A (50x6 mm)', rating: '400A 3P+N', typeCode: 'AL-50X6', make: 'Reputed', unit: 'Mtrs', quantity: 14, unitPrice: 2200 },
      { sNo: 9, sectionName: 'Busbar & Structure', description: 'Busbar Heat-Shrink Colored Insulation Sleeves', rating: '50mm Dia', typeCode: 'BSS-50', make: 'Reputed', unit: 'Set', quantity: 1, unitPrice: 4500 },
      { sNo: 10, sectionName: 'Control & Wiring', description: 'Terminal Blocks 4 sq.mm Feed Through', rating: '4.0 sq.mm', typeCode: 'KUT4', make: 'Elmex', unit: 'Nos', quantity: 65, unitPrice: 18 },
      { sNo: 11, sectionName: 'Control & Wiring', description: 'Flexible Copper Control Cables 1.5 sq.mm', rating: '1100V FRLS', typeCode: 'CBL-1.5-GRY', make: 'Polycab', unit: 'Mtrs', quantity: 220, unitPrice: 32 },
      { sNo: 12, sectionName: 'Control & Wiring', description: 'Push Buttons & Selector Switches (Start/Stop/Auto/Manual)', rating: '22.5 mm', typeCode: 'MP1-10G', make: 'ABB', unit: 'Nos', quantity: 18, unitPrice: 450 },
      { sNo: 13, sectionName: 'Enclosure', description: 'Free-Standing Floor Mounted Form 3B Compartmentalized Enclosure', rating: '2000x1200x600 mm', typeCode: 'ENC-MCC-6F', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 72000 },
    ];

    const bomSum = mccBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const fabCost = 72000;
    const busbarCost = 35000;
    const wireCost = 28000;
    const netCost = bomSum;
    const exWorks = Math.round(netCost * 1.18);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-MCC-400A-6F' },
      update: {},
      create: {
        modelNumber: 'SVG-MCC-400A-6F',
        name: 'Industrial Motor Control Center Panel (400A, 6 Feeders)',
        categoryId: mccCatId,
        description: 'Standard 400A MCC panel housing 3 Star-Delta feeders (30HP) and 3 DOL feeders (10HP) with ABB switchgear, Al busbars, and Form 3B compartment segregation.',
        enclosureHeight: 2000,
        enclosureWidth: 1200,
        enclosureDepth: 600,
        ipRating: 'IP54',
        formRating: 'Form 3B',
        bomMaterialCost: bomSum,
        fabricationCost: fabCost,
        busbarCost: busbarCost,
        wiringCost: wireCost,
        netManufacturingCost: netCost,
        fatTestingCost: 12000,
        designEngineeringCost: 15000,
        overheadCost: 22000,
        profitMarginPercent: 15,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: mccBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Switchgear & Contactor Make',
              options: {
                create: [
                  { optionName: 'ABB Switchgear (AF Contactors & XT MCCB)', isDefault: true, priceDelta: 0 },
                  { optionName: 'Siemens SIRIUS Switchgear Package', isDefault: false, priceDelta: 32000 },
                  { optionName: 'Schneider Electric TeSys & Compact NSX', isDefault: false, priceDelta: 28000 },
                ],
              },
            },
            {
              dimensionName: 'Busbar Conductor Material',
              options: {
                create: [
                  { optionName: 'EC Grade Aluminum Busbar (50x6 mm)', isDefault: true, priceDelta: 0 },
                  { optionName: '99.9% ETP Pure Copper Busbar', isDefault: false, priceDelta: 68000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 2. PLC & HMI Panel: SVG-PLC-S71200-10HMI
  const plcCatId = catMap.get('CAT-PLC');
  if (plcCatId) {
    console.log('Seeding PLC & HMI Panel: SVG-PLC-S71200-10HMI...');
    const plcBom = [
      { sNo: 1, sectionName: 'PLC Automation Rack', description: 'Siemens S7-1200 CPU 1214C DC/DC/DC Compact Controller', rating: '14 DI / 10 DO / 2 AI', typeCode: '6ES7214-1AG40-0XB0', make: 'Siemens', unit: 'Nos', quantity: 1, unitPrice: 48000 },
      { sNo: 2, sectionName: 'PLC Automation Rack', description: 'Siemens SM 1223 Digital Input/Output Expansion Module', rating: '16 DI / 16 DO Transistor', typeCode: '6ES7223-1BL32-0XB0', make: 'Siemens', unit: 'Nos', quantity: 2, unitPrice: 24000 },
      { sNo: 3, sectionName: 'PLC Automation Rack', description: 'Siemens SM 1231 Analog Input Module (4 AI 13-bit)', rating: '4 AI (0-10V / 4-20mA)', typeCode: '6ES7231-4HD32-0XB0', make: 'Siemens', unit: 'Nos', quantity: 1, unitPrice: 28000 },
      { sNo: 4, sectionName: 'Operator Interface', description: 'Siemens KTP1000 Basic Color Touch Screen HMI 10 inch', rating: '10 inch TFT 65K Colors', typeCode: '6AV2123-2GB03-0AX0', make: 'Siemens', unit: 'Nos', quantity: 1, unitPrice: 58000 },
      { sNo: 5, sectionName: 'Power & Protection', description: 'Industrial Switched Mode Power Supply (SMPS) 24V DC 10A', rating: '24V DC 240W', typeCode: 'CP-E 24/10.0', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 12500 },
      { sNo: 6, sectionName: 'Power & Protection', description: 'Miniature Circuit Breakers (MCB) 2P 10A Curve C', rating: '10A 10kA', typeCode: 'SH202-C10', make: 'ABB', unit: 'Nos', quantity: 4, unitPrice: 950 },
      { sNo: 7, sectionName: 'Relays & Isolation', description: 'Slim Interface Relays 24V DC with Base & LED', rating: '1 CO 6A', typeCode: 'CR-S024VDC1R', make: 'ABB', unit: 'Nos', quantity: 24, unitPrice: 580 },
      { sNo: 8, sectionName: 'Networking & Telemetry', description: 'Industrial Unmanaged 8-Port Fast Ethernet Switch', rating: '8x RJ45 10/100 Mbps', typeCode: 'SCALANCE XB008', make: 'Siemens', unit: 'Nos', quantity: 1, unitPrice: 14500 },
      { sNo: 9, sectionName: 'Terminals & Wiring', description: 'Knife Disconnect & Fuse Terminal Blocks', rating: '4 sq.mm', typeCode: 'KULT4', make: 'Elmex', unit: 'Nos', quantity: 80, unitPrice: 45 },
      { sNo: 10, sectionName: 'Terminals & Wiring', description: 'Shielded Twisted Pair Cables (STP) for Analog I/O', rating: '2-Pair 0.5 sq.mm', typeCode: 'CBL-STP-0.5', make: 'Polycab', unit: 'Mtrs', quantity: 100, unitPrice: 55 },
      { sNo: 11, sectionName: 'Enclosure', description: 'Wall / Floor Mounting IP55 Rittal-type Automation Enclosure', rating: '1600x800x400 mm', typeCode: 'ENC-PLC-1608', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 42000 },
    ];

    const bomSum = plcBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.22);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-PLC-S71200-10HMI' },
      update: {},
      create: {
        modelNumber: 'SVG-PLC-S71200-10HMI',
        name: 'Automated Process PLC & 10" HMI Control Panel',
        categoryId: plcCatId,
        description: 'Complete automation enclosure with Siemens S7-1200 CPU, digital/analog expansion, 10" color HMI, 24V DC regulated power, and Scalance industrial networking.',
        enclosureHeight: 1600,
        enclosureWidth: 800,
        enclosureDepth: 400,
        ipRating: 'IP55',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 42000,
        busbarCost: 8000,
        wiringCost: 22000,
        netManufacturingCost: bomSum,
        fatTestingCost: 15000,
        designEngineeringCost: 25000,
        overheadCost: 18000,
        profitMarginPercent: 18,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: plcBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'PLC Hardware Platform',
              options: {
                create: [
                  { optionName: 'Siemens S7-1200 CPU 1214C + KTP1000 HMI', isDefault: true, priceDelta: 0 },
                  { optionName: 'Mitsubishi FX5U PLC + Inovance 10" Touch HMI', isDefault: false, priceDelta: -28000 },
                  { optionName: 'Rockwell Allen-Bradley Micro850 + PanelView 10"', isDefault: false, priceDelta: 45000 },
                ],
              },
            },
            {
              dimensionName: 'Remote Cloud Telemetry & VPN Gateway',
              options: {
                create: [
                  { optionName: 'Without Remote Gateway (Local Hardwired)', isDefault: true, priceDelta: 0 },
                  { optionName: 'Industrial 4G/LTE Cloud IoT VPN Gateway (Ewon Flexy)', isDefault: false, priceDelta: 38000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 3. APFC Panel: SVG-APFC-250KVAR
  const apfcCatId = catMap.get('CAT-APFC');
  if (apfcCatId) {
    console.log('Seeding APFC Panel: SVG-APFC-250KVAR...');
    const apfcBom = [
      { sNo: 1, sectionName: 'Main Incomer', description: '400A 3P 36kA Thermal-Magnetic MCCB Incomer', rating: '400A 36kA', typeCode: 'XT4N 400', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 38000 },
      { sNo: 2, sectionName: 'APFC Controller', description: '8-Step Automatic Power Factor Controller with THD Monitoring', rating: '8 Stages / 415V', typeCode: 'BR6000-R08', make: 'Epcos / TDK', unit: 'Nos', quantity: 1, unitPrice: 22000 },
      { sNo: 3, sectionName: 'Capacitor Banks', description: 'Heavy Duty MPP Gas-Filled Power Capacitors 50 kVAr (4 Nos)', rating: '50 kVAr 440V', typeCode: 'PhaseCap HD 50', make: 'Epcos / TDK', unit: 'Nos', quantity: 4, unitPrice: 18500 },
      { sNo: 4, sectionName: 'Capacitor Banks', description: 'Heavy Duty MPP Gas-Filled Power Capacitors 25 kVAr (2 Nos)', rating: '25 kVAr 440V', typeCode: 'PhaseCap HD 25', make: 'Epcos / TDK', unit: 'Nos', quantity: 2, unitPrice: 11000 },
      { sNo: 5, sectionName: 'Harmonic Detuned Reactors', description: '7% Detuned Harmonic Filter Reactors for 50 kVAr (Copper Wound)', rating: '50 kVAr 7% Cu', typeCode: 'DTR-50-7%', make: 'Schneider', unit: 'Nos', quantity: 4, unitPrice: 26000 },
      { sNo: 6, sectionName: 'Capacitor Duty Contactors', description: 'Capacitor Duty Contactors with Pre-Charge Resistors', rating: '50 kVAr / 70A', typeCode: 'UA50-30-RA', make: 'ABB', unit: 'Nos', quantity: 6, unitPrice: 6800 },
      { sNo: 7, sectionName: 'Backup Protection', description: 'HRC Fuse Links DIN Size 00/1 for Capacitor Steps', rating: '125A 500V', typeCode: '170M1568', make: 'Bussmann', unit: 'Nos', quantity: 18, unitPrice: 950 },
      { sNo: 8, sectionName: 'Busbar & Cooling', description: 'Electrolytic Aluminum Busbars (50x10 mm)', rating: '400A 3P+N', typeCode: 'AL-50X10', make: 'Reputed', unit: 'Mtrs', quantity: 12, unitPrice: 2500 },
      { sNo: 9, sectionName: 'Busbar & Cooling', description: 'Thermostat Controlled Cooling Exhaust Fans with Louvre & Filter', rating: '230V AC 150 CFM', typeCode: 'FAN-150-AC', make: 'Rexnord', unit: 'Nos', quantity: 2, unitPrice: 3200 },
      { sNo: 10, sectionName: 'Enclosure', description: 'Ventilated Floor Mounting IP42 APFC Switchboard Enclosure', rating: '2000x1000x600 mm', typeCode: 'ENC-APFC-250', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 65000 },
    ];

    const bomSum = apfcBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.16);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-APFC-250KVAR' },
      update: {},
      create: {
        modelNumber: 'SVG-APFC-250KVAR',
        name: 'Automatic Power Factor Correction Panel 250 kVAr (8 Steps)',
        categoryId: apfcCatId,
        description: 'Automatic power factor correction system rated 250 kVAr with 7% detuned harmonic filter reactors, Epcos BR6000 controller, ABB capacitor duty contactors, and forced cooling.',
        enclosureHeight: 2000,
        enclosureWidth: 1000,
        enclosureDepth: 600,
        ipRating: 'IP42',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 65000,
        busbarCost: 32000,
        wiringCost: 20000,
        netManufacturingCost: bomSum,
        fatTestingCost: 10000,
        designEngineeringCost: 12000,
        overheadCost: 18000,
        profitMarginPercent: 14,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: apfcBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Harmonic Filter Reactors Specification',
              options: {
                create: [
                  { optionName: 'With 7% Detuned Harmonic Filter Reactors (Standard)', isDefault: true, priceDelta: 0 },
                  { optionName: 'Without Harmonic Reactors (Pure Capacitor Steps)', isDefault: false, priceDelta: -95000 },
                  { optionName: 'With 14% Detuned Reactors (For Heavy Non-Linear Loads)', isDefault: false, priceDelta: 42000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 4. AC Drive Panel: SVG-ACD-150HP-VFD
  const acdCatId = catMap.get('CAT-ACD');
  if (acdCatId) {
    console.log('Seeding AC Drive Panel: SVG-ACD-150HP-VFD...');
    const acdBom = [
      { sNo: 1, sectionName: 'Main Drive Unit', description: 'ABB ACS580 110kW / 150HP Variable Frequency Drive (VFD)', rating: '110kW / 206A 415V', typeCode: 'ACS580-01-206A-4', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 385000 },
      { sNo: 2, sectionName: 'Main Drive Unit', description: 'ABB Assistant Control Panel (Keypad) Door Mounting Kit', rating: 'IP66 Door Mount', typeCode: 'DPMP-01', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 8500 },
      { sNo: 3, sectionName: 'Power Switchgear', description: '250A 3P 36kA Thermal-Magnetic MCCB Incomer', rating: '250A 36kA', typeCode: 'XT3N 250', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 26000 },
      { sNo: 4, sectionName: 'Power Switchgear', description: 'Input Line Choke 3P for Harmonics & Surge Suppression', rating: '210A 3P', typeCode: 'ACL-210A', make: 'Arihant Electrical', unit: 'Nos', quantity: 1, unitPrice: 28000 },
      { sNo: 5, sectionName: 'Power Switchgear', description: 'Main AC Contactor 3P with 230V Coil', rating: '210A AC-3', typeCode: 'AF210-30-11', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 19500 },
      { sNo: 6, sectionName: 'Braking & Dissipation', description: 'Dynamic Braking Unit (DBU) & Stainless Steel Braking Resistor', rating: '110kW 10% Duty', typeCode: 'DBU-110KW', make: 'Reputed', unit: 'Set', quantity: 1, unitPrice: 32000 },
      { sNo: 7, sectionName: 'Control & Meters', description: 'Digital Multi-Function Power Meter with RS485 Modbus', rating: '96x96 mm Cl 1.0', typeCode: 'RISH Master 3440', make: 'Rishabh', unit: 'Nos', quantity: 1, unitPrice: 8500 },
      { sNo: 8, sectionName: 'Cooling System', description: 'Heavy-Duty Forced Exhaust Fan with Thermostat Control', rating: '230V AC 300 CFM', typeCode: 'FAN-300-AC', make: 'Rexnord', unit: 'Nos', quantity: 2, unitPrice: 4500 },
      { sNo: 9, sectionName: 'Busbar & Wiring', description: 'EC Grade Aluminum Busbars 250A (40x10 mm)', rating: '250A', typeCode: 'AL-40X10', make: 'Reputed', unit: 'Mtrs', quantity: 10, unitPrice: 2100 },
      { sNo: 10, sectionName: 'Enclosure', description: 'Floor Mounting IP54 Powder Coated Enclosure with Plinth & Gland Plate', rating: '2000x800x600 mm', typeCode: 'ENC-VFD-110K', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 62000 },
    ];

    const bomSum = acdBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.17);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-ACD-150HP-VFD' },
      update: {},
      create: {
        modelNumber: 'SVG-ACD-150HP-VFD',
        name: 'AC Variable Frequency Drive (VFD) Panel 110kW / 150HP',
        categoryId: acdCatId,
        description: 'Complete VFD control panel engineered with ABB ACS580 110kW drive, 3P AC input line choke, dynamic braking resistor, bypass switchgear, and IP54 ventilated enclosure.',
        enclosureHeight: 2000,
        enclosureWidth: 800,
        enclosureDepth: 600,
        ipRating: 'IP54',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 62000,
        busbarCost: 24000,
        wiringCost: 18000,
        netManufacturingCost: bomSum,
        fatTestingCost: 14000,
        designEngineeringCost: 18000,
        overheadCost: 22000,
        profitMarginPercent: 15,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: acdBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'VFD Drive Manufacturer Make',
              options: {
                create: [
                  { optionName: 'ABB ACS580 110kW General Purpose Drive', isDefault: true, priceDelta: 0 },
                  { optionName: 'Siemens Sinamics G120 110kW Vector Drive', isDefault: false, priceDelta: 36000 },
                  { optionName: 'Danfoss VLT AutomationDrive 110kW', isDefault: false, priceDelta: 28000 },
                ],
              },
            },
            {
              dimensionName: 'Bypass Starter Provision',
              options: {
                create: [
                  { optionName: 'VFD Drive Only (Standard Operation)', isDefault: true, priceDelta: 0 },
                  { optionName: 'VFD + Across-the-Line DOL Bypass Contactor Starter', isDefault: false, priceDelta: 42000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 5. PCC Panel: SVG-PCC-1250A-ACB
  const pccCatId = catMap.get('CAT-PCC');
  if (pccCatId) {
    console.log('Seeding PCC Panel: SVG-PCC-1250A-ACB...');
    const pccBom = [
      { sNo: 1, sectionName: 'Main Incomer ACB', description: '1250A 4P 50kA Microprocessor Drawout Air Circuit Breaker (ACB)', rating: '1250A 4P 50kA', typeCode: 'Emax2 E1.2N 1250', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 165000 },
      { sNo: 2, sectionName: 'Outgoing Feeders', description: '400A 3P 36kA Thermal Magnetic MCCB Outgoing (2 Nos)', rating: '400A 36kA', typeCode: 'XT4N 400', make: 'ABB', unit: 'Nos', quantity: 2, unitPrice: 38000 },
      { sNo: 3, sectionName: 'Outgoing Feeders', description: '250A 3P 36kA Thermal Magnetic MCCB Outgoing (3 Nos)', rating: '250A 36kA', typeCode: 'XT3N 250', make: 'ABB', unit: 'Nos', quantity: 3, unitPrice: 26000 },
      { sNo: 4, sectionName: 'Metering & Protection', description: 'Class 0.5S Dual Source Energy Meter (EB / DG)', rating: '96x96 mm Cl 0.5S', typeCode: 'RISH EM3490', make: 'Rishabh', unit: 'Nos', quantity: 1, unitPrice: 14500 },
      { sNo: 5, sectionName: 'Metering & Protection', description: 'Protection Current Transformers (CT) Class 5P10 15VA', rating: '1250/5A 5P10', typeCode: 'CT-1250/5', make: 'Automatic Electric', unit: 'Nos', quantity: 4, unitPrice: 3200 },
      { sNo: 6, sectionName: 'Main Power Busbar', description: 'Electrolytic Grade Aluminum Busbars 1250A (80x10 mm 2 Runs)', rating: '1250A 50kA 1s', typeCode: 'AL-80X10-2R', make: 'Reputed', unit: 'Mtrs', quantity: 22, unitPrice: 4200 },
      { sNo: 7, sectionName: 'Main Power Busbar', description: 'SMC/DMC High Strength Busbar Support Insulators', rating: '65x65 mm M12', typeCode: 'INS-DMC-M12', make: 'Hertson', unit: 'Nos', quantity: 36, unitPrice: 650 },
      { sNo: 8, sectionName: 'Enclosure', description: 'Heavy Duty Floor Mounting Form 4B Fully Compartmentalized Switchboard', rating: '2200x1600x800 mm', typeCode: 'ENC-PCC-1250', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 110000 },
    ];

    const bomSum = pccBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.16);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-PCC-1250A-ACB' },
      update: {},
      create: {
        modelNumber: 'SVG-PCC-1250A-ACB',
        name: 'Power Control Center (PCC) Main Switchboard 1250A',
        categoryId: pccCatId,
        description: 'Main incoming and power distribution switchboard featuring 1250A 4P Drawout ACB incomer, 5 outgoing MCCB feeders, 50kA fault withstand busbars, and Form 4B compartmentation.',
        enclosureHeight: 2200,
        enclosureWidth: 1600,
        enclosureDepth: 800,
        ipRating: 'IP54',
        formRating: 'Form 4B',
        bomMaterialCost: bomSum,
        fabricationCost: 110000,
        busbarCost: 115000,
        wiringCost: 35000,
        netManufacturingCost: bomSum,
        fatTestingCost: 22000,
        designEngineeringCost: 28000,
        overheadCost: 35000,
        profitMarginPercent: 15,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: pccBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Main ACB Incomer Make',
              options: {
                create: [
                  { optionName: 'ABB Emax2 E1.2N 1250A 4P Drawout ACB', isDefault: true, priceDelta: 0 },
                  { optionName: 'Schneider Masterpact MTZ1 1250A 4P ACB', isDefault: false, priceDelta: 24000 },
                  { optionName: 'Siemens 3WL 1250A 4P Drawout ACB', isDefault: false, priceDelta: 18000 },
                ],
              },
            },
            {
              dimensionName: 'Main Busbar Conductor',
              options: {
                create: [
                  { optionName: 'Electrolytic EC Grade Aluminum Busbar (Standard)', isDefault: true, priceDelta: 0 },
                  { optionName: '99.9% Pure ETP Copper Busbar (Tin Plated)', isDefault: false, priceDelta: 125000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 6. Metering Panel: SVG-MET-8CH-PDB
  const metCatId = catMap.get('CAT-MET');
  if (metCatId) {
    console.log('Seeding Metering Panel: SVG-MET-8CH-PDB...');
    const metBom = [
      { sNo: 1, sectionName: 'Main Supply', description: '250A 3P MCCB Incomer with Rotary Handle', rating: '250A 25kA', typeCode: 'XT3N 250', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 24000 },
      { sNo: 2, sectionName: 'Energy Meters', description: 'Multi-Function Digital Energy Meters with Modbus RS485 (8 Nos)', rating: '96x96 mm Cl 0.5S', typeCode: 'RISH EM1340', make: 'Rishabh', unit: 'Nos', quantity: 8, unitPrice: 7200 },
      { sNo: 3, sectionName: 'Current Transformers', description: 'Measuring CTs Class 0.5 5VA (24 Nos for 8 Channels)', rating: '100/5A to 250/5A', typeCode: 'MCT-0.5', make: 'Automatic Electric', unit: 'Nos', quantity: 24, unitPrice: 850 },
      { sNo: 4, sectionName: 'Data Acquisition', description: 'Industrial RS485 to Ethernet Modbus TCP Gateway', rating: 'Dual Ethernet / Modbus', typeCode: 'MGate MB3180', make: 'Moxa', unit: 'Nos', quantity: 1, unitPrice: 16500 },
      { sNo: 5, sectionName: 'Terminals & Wiring', description: 'Disconnecting Test Terminal Blocks (CTTB)', rating: '6 sq.mm CTTB', typeCode: 'CTTB6', make: 'Elmex', unit: 'Nos', quantity: 24, unitPrice: 140 },
      { sNo: 6, sectionName: 'Enclosure', description: 'Wall Mounting IP52 Powder Coated Metering Box with Glass Window', rating: '1400x800x300 mm', typeCode: 'ENC-MET-8CH', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 28000 },
    ];

    const bomSum = metBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.18);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-MET-8CH-PDB' },
      update: {},
      create: {
        modelNumber: 'SVG-MET-8CH-PDB',
        name: 'Multi-Channel Energy Sub-Metering Panel (8 Channels)',
        categoryId: metCatId,
        description: 'Centralized sub-metering switchboard with 8 independent digital multi-function meters, Class 0.5S CTs, CTTBs, and Moxa Modbus TCP gateway for cloud energy monitoring.',
        enclosureHeight: 1400,
        enclosureWidth: 800,
        enclosureDepth: 300,
        ipRating: 'IP52',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 28000,
        busbarCost: 12000,
        wiringCost: 18000,
        netManufacturingCost: bomSum,
        fatTestingCost: 8000,
        designEngineeringCost: 10000,
        overheadCost: 12000,
        profitMarginPercent: 16,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: metBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Energy Meter Accuracy Class',
              options: {
                create: [
                  { optionName: 'Class 0.5S High Precision Energy Meters', isDefault: true, priceDelta: 0 },
                  { optionName: 'Class 1.0 Standard Commercial Grade Meters', isDefault: false, priceDelta: -14000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 7. Changeover Panel: SVG-CHG-630A-AMF
  const chgCatId = catMap.get('CAT-CHG');
  if (chgCatId) {
    console.log('Seeding Changeover Panel: SVG-CHG-630A-AMF...');
    const chgBom = [
      { sNo: 1, sectionName: 'Transfer Switch', description: '630A 4P Motorized Changeover Switch with Mechanical Interlock', rating: '630A 4P 415V', typeCode: 'OTM630E4M230C', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 78000 },
      { sNo: 2, sectionName: 'Auto Control', description: 'Auto Mains Failure (AMF) Generator Controller with Auto-Start', rating: '12/24V DC Engine Control', typeCode: 'DSE 7320 MKII', make: 'Deep Sea Electronics', unit: 'Nos', quantity: 1, unitPrice: 32000 },
      { sNo: 3, sectionName: 'Battery Charging', description: 'Automatic Float / Boost Battery Charger for DG Battery', rating: '24V 6A Smps', typeCode: 'DSE 9470', make: 'Deep Sea Electronics', unit: 'Nos', quantity: 1, unitPrice: 12500 },
      { sNo: 4, sectionName: 'Busbar & Power', description: 'Electrolytic Aluminum Busbars (50x10 mm Dual)', rating: '630A 3P+N', typeCode: 'AL-50X10', make: 'Reputed', unit: 'Mtrs', quantity: 14, unitPrice: 2500 },
      { sNo: 5, sectionName: 'Protection & Relays', description: 'Phase Failure, Under/Over Voltage & Neutral Supervision Relay', rating: '415V AC 3P+N', typeCode: 'CM-PVS.41S', make: 'ABB', unit: 'Nos', quantity: 2, unitPrice: 4200 },
      { sNo: 6, sectionName: 'Enclosure', description: 'Floor Mounting IP54 Dual Source Changeover Enclosure', rating: '1800x900x500 mm', typeCode: 'ENC-AMF-630', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 52000 },
    ];

    const bomSum = chgBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.18);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-CHG-630A-AMF' },
      update: {},
      create: {
        modelNumber: 'SVG-CHG-630A-AMF',
        name: 'Auto Mains Failure (AMF) & 630A Motorized Changeover Panel',
        categoryId: chgCatId,
        description: 'Automatic DG/EB changeover switchboard with ABB 630A 4P motorized transfer switch, Deep Sea DSE 7320 auto-start controller, dual phase sequence relays, and automatic float battery charger.',
        enclosureHeight: 1800,
        enclosureWidth: 900,
        enclosureDepth: 500,
        ipRating: 'IP54',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 52000,
        busbarCost: 38000,
        wiringCost: 20000,
        netManufacturingCost: bomSum,
        fatTestingCost: 10000,
        designEngineeringCost: 12000,
        overheadCost: 16000,
        profitMarginPercent: 15,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: chgBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Transfer Switch Mechanism',
              options: {
                create: [
                  { optionName: 'Motorized Auto Changeover with Mechanical Interlock', isDefault: true, priceDelta: 0 },
                  { optionName: 'Manual 4P Rotary Changeover Switch (Economy)', isDefault: false, priceDelta: -38000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 8. Distribution Panel: SVG-DIST-400A-12W
  const distCatId = catMap.get('CAT-DIST');
  if (distCatId) {
    console.log('Seeding Distribution Panel: SVG-DIST-400A-12W...');
    const distBom = [
      { sNo: 1, sectionName: 'Main Incomer', description: '400A 3P 36kA Thermal-Magnetic MCCB with Spreader Links', rating: '400A 36kA', typeCode: 'XT4N 400', make: 'ABB', unit: 'Nos', quantity: 1, unitPrice: 38000 },
      { sNo: 2, sectionName: 'Outgoing Feeders (12 Ways)', description: '100A 3P 25kA MCCB Outgoing Feeders (4 Nos)', rating: '100A 25kA', typeCode: 'XT1N 100', make: 'ABB', unit: 'Nos', quantity: 4, unitPrice: 9500 },
      { sNo: 3, sectionName: 'Outgoing Feeders (12 Ways)', description: '63A 3P 25kA MCCB Outgoing Feeders (8 Nos)', rating: '63A 25kA', typeCode: 'XT1N 63', make: 'ABB', unit: 'Nos', quantity: 8, unitPrice: 7800 },
      { sNo: 4, sectionName: 'Metering & Indication', description: 'LED Voltmeter & Ammeter with Selector Switches', rating: '96x96 mm Analog/Dig', typeCode: 'RISH DPM', make: 'Rishabh', unit: 'Set', quantity: 1, unitPrice: 4200 },
      { sNo: 5, sectionName: 'Busbar Distribution', description: 'Electrolytic Aluminum Busbars 400A (50x6 mm)', rating: '400A 3P+N', typeCode: 'AL-50X6', make: 'Reputed', unit: 'Mtrs', quantity: 16, unitPrice: 2200 },
      { sNo: 6, sectionName: 'Enclosure', description: 'Floor Mounting IP52 Power Distribution Board with Cable Alley', rating: '1800x1000x400 mm', typeCode: 'ENC-PDB-12W', make: 'Reputed', unit: 'Nos', quantity: 1, unitPrice: 48000 },
    ];

    const bomSum = distBom.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const exWorks = Math.round(bomSum * 1.16);
    const gst = Math.round(exWorks * 0.18);

    await prisma.finishedGood.upsert({
      where: { modelNumber: 'SVG-DIST-400A-12W' },
      update: {},
      create: {
        modelNumber: 'SVG-DIST-400A-12W',
        name: 'Main Power Distribution Board 400A (12 Outgoing MCCB Ways)',
        categoryId: distCatId,
        description: 'Floor mounted power distribution board with 400A MCCB incomer, 12 outgoing MCCB feeders (100A & 63A), dedicated central busbar chamber, and side cable alley.',
        enclosureHeight: 1800,
        enclosureWidth: 1000,
        enclosureDepth: 400,
        ipRating: 'IP52',
        formRating: 'Form 2B',
        bomMaterialCost: bomSum,
        fabricationCost: 48000,
        busbarCost: 35000,
        wiringCost: 22000,
        netManufacturingCost: bomSum,
        fatTestingCost: 8000,
        designEngineeringCost: 10000,
        overheadCost: 14000,
        profitMarginPercent: 14,
        finalExWorksPrice: exWorks,
        gstAmount: gst,
        finalGrossPrice: exWorks + gst,
        bomItems: {
          create: distBom.map((b) => ({
            ...b,
            totalAmount: b.quantity * b.unitPrice,
            gstAmount: Math.round(b.quantity * b.unitPrice * 0.18),
            grandTotal: Math.round(b.quantity * b.unitPrice * 1.18),
          })),
        },
        variants: {
          create: [
            {
              dimensionName: 'Switchgear & MCCB Make',
              options: {
                create: [
                  { optionName: 'ABB SACE Tmax XT MCCB Range (Standard)', isDefault: true, priceDelta: 0 },
                  { optionName: 'Schneider Electric Compact NSX MCCB Range', isDefault: false, priceDelta: 16000 },
                  { optionName: 'L&T DSine MCCB Range', isDefault: false, priceDelta: -8000 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  const finalTotalFg = await prisma.finishedGood.count();
  console.log(`\n=== Seeding Finished Goods Completed! ===`);
  console.log(`Total Finished Goods across all 9 categories: ${finalTotalFg}`);
}

main()
  .catch((e) => {
    console.error('Error seeding categories FG:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
