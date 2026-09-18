import { PrismaClient, Role, InputType, EstimationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function buildCriteriaHash(specs: Record<string, any>): string {
  const keys = Object.keys(specs).sort();
  const pairs: string[] = [];
  for (const k of keys) {
    const val = specs[k];
    if (val !== undefined && val !== null && val !== '') {
      pairs.push(`${k.trim().toUpperCase()}:${String(val).trim().toUpperCase()}`);
    }
  }
  return pairs.join('|');
}

async function main() {
  console.log('--- Starting SVG Electric Database Seed ---');

  // 1. Company Settings
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'SVG Electric & Control Products',
      tagline: 'Control Panels, Automation & Switchgear Specialists',
      address: 'SF No. 342/1, Trichy Road, Singanallur, Coimbatore - 641005, Tamil Nadu, India',
      phone: '+91 94432 55678 / +91 422 2578901',
      email: 'sales@svgelectric.com',
      website: 'https://svgelectric.com',
      gstin: '33AAAFS1234F1ZP',
      currencySymbol: '₹',
      currencyCode: 'INR',
      gstEnabled: true,
      defaultGSTRate: 18.0,
      defaultCGSTRate: 9.0,
      defaultSGSTRate: 9.0,
      defaultIGSTRate: 18.0,
      estimationPrefix: 'EST-',
      estimationNextNum: 1001,
      yearBasedNumbering: true,
      termsAndConditions: `1. Price Validity: This estimation is valid for 30 days from the date of issue.
2. Payment Terms: 40% advance along with purchase order, 60% against pro-forma invoice before dispatch.
3. Delivery Period: 4 to 6 weeks from the date of technically and commercially clear order.
4. Taxes & Duties: GST extra as applicable at the time of delivery (currently 18%).
5. Inspection: Customer inspection welcome at our works prior to dispatch with 5 days advance notice.
6. Warranty: 12 months from the date of commissioning or 18 months from supply, whichever is earlier, against manufacturing defects.
7. Freight & Insurance: Borne by customer at actuals unless explicitly agreed in writing.`,
      bankDetails: `Account Name: SVG Electric & Control Products
Bank: State Bank of India
Branch: Singanallur Branch, Coimbatore
A/C No: 38920194820
IFSC Code: SBIN0001234`,
    },
  });
  console.log('✓ Company settings seeded');

  // 2. Users
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@12345', 10);
  const salesPassword = await bcrypt.hash(process.env.SALES_PASSWORD || 'Sales@12345', 10);

  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@svgelectric.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@svgelectric.com',
      name: 'SVG Administrator',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      phone: '+91 98765 00001',
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: process.env.SALES_EMAIL || 'sales@svgelectric.com' },
    update: {},
    create: {
      email: process.env.SALES_EMAIL || 'sales@svgelectric.com',
      name: 'Ramesh Kumar (Sales Engineer)',
      passwordHash: salesPassword,
      role: Role.SALES_USER,
      phone: '+91 98765 00002',
    },
  });
  console.log('✓ Users seeded (admin & sales engineer)');

  // 3. Product Categories
  const categoriesData = [
    { code: 'CAT-MCC', name: 'MCC Panel', description: 'Motor Control Center panels for centralized motor operations', displayOrder: 1 },
    { code: 'CAT-PLC', name: 'PLC & HMI Panel', description: 'Industrial automation, SCADA, PLC and HMI control enclosures', displayOrder: 2 },
    { code: 'CAT-APFC', name: 'APFC Panel', description: 'Automatic Power Factor Correction capacitor switchboards', displayOrder: 3 },
    { code: 'CAT-ACD', name: 'AC Drive Panel', description: 'Variable Frequency Drive (VFD) panels for process and pump speed control', displayOrder: 4 },
    { code: 'CAT-DCD', name: 'DC Drive Panel', description: 'DC motor drive and regenerative thyristor converter panels', displayOrder: 5 },
    { code: 'CAT-PCC', name: 'PCC Panel', description: 'Power Control Center main incoming and distribution switchboards', displayOrder: 6 },
    { code: 'CAT-MET', name: 'Metering Panel', description: 'EB metering, sub-metering, and power monitoring panels', displayOrder: 7 },
    { code: 'CAT-CHG', name: 'Changeover Panel', description: 'Auto/Manual changeover & AMF synchronization panels', displayOrder: 8 },
    { code: 'CAT-DIST', name: 'Distribution Panel', description: 'Power distribution boards (PDB) & lighting distribution boards (LDB)', displayOrder: 9 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const record = await prisma.productCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
    categories[cat.code] = record;
  }
  console.log(`✓ ${categoriesData.length} Product categories seeded`);

  // 4. Products
  const productsData = [
    {
      productCode: 'MCC-IND-01',
      name: 'Industrial Motor Control Center (MCC Panel)',
      categoryId: categories['CAT-MCC'].id,
      description: 'Compartmentalized form-separated MCC panel with drawout/non-drawout motor starter feeders, protection relays, and busbars.',
    },
    {
      productCode: 'PLC-HMI-01',
      name: 'PLC & HMI Automation Control Panel',
      categoryId: categories['CAT-PLC'].id,
      description: 'Engineered control panel housing Siemens / Allen-Bradley / Delta PLC, touch HMI screen, 24V DC power supply, and isolated relays.',
    },
    {
      productCode: 'APFC-PANEL-01',
      name: 'Automatic Power Factor Correction (APFC Panel)',
      categoryId: categories['CAT-APFC'].id,
      description: 'Heavy duty MPP capacitor banks with detuned reactors, microprocessor APFC relay, and thyristor / contactor switching.',
    },
    {
      productCode: 'VFD-ACD-01',
      name: 'AC Variable Frequency Drive (VFD Panel)',
      categoryId: categories['CAT-ACD'].id,
      description: 'Dedicated drive panel engineered with Danfoss / ABB / Schneider VFDs, line chokes, cooling fans, and bypass controls.',
    },
    {
      productCode: 'PCC-MSB-01',
      name: 'Power Control Center (PCC Main Switchboard)',
      categoryId: categories['CAT-PCC'].id,
      description: 'Main incoming switchboard with Air Circuit Breakers (ACB), bus coupler, energy meters, and high-capacity copper busbars.',
    },
    {
      productCode: 'PDB-DIST-01',
      name: 'Power Distribution Board (PDB Panel)',
      categoryId: categories['CAT-DIST'].id,
      description: 'Feeder distribution panel with MCCBs/MCBs, metering, and dust-resistant powder coated enclosure.',
    },
  ];

  const products: Record<string, any> = {};
  for (const prod of productsData) {
    const record = await prisma.product.upsert({
      where: { productCode: prod.productCode },
      update: {},
      create: prod,
    });
    products[prod.productCode] = record;
  }
  console.log(`✓ ${productsData.length} Products seeded`);

  // 5. Specifications & Options
  const specsData = [
    {
      code: 'CURRENT_RATING',
      name: 'Current Rating',
      inputType: InputType.DROPDOWN,
      unit: 'A',
      displayOrder: 1,
      options: [
        { value: '100A', label: '100 Amps' },
        { value: '250A', label: '250 Amps' },
        { value: '400A', label: '400 Amps' },
        { value: '630A', label: '630 Amps' },
        { value: '800A', label: '800 Amps' },
        { value: '1000A', label: '1000 Amps' },
        { value: '1250A', label: '1250 Amps' },
        { value: '1600A', label: '1600 Amps' },
        { value: '2000A', label: '2000 Amps' },
        { value: '2500A', label: '2500 Amps' },
        { value: '3200A', label: '3200 Amps' },
      ],
    },
    {
      code: 'VOLTAGE',
      name: 'Rated Voltage',
      inputType: InputType.DROPDOWN,
      unit: 'V',
      displayOrder: 2,
      options: [
        { value: '415V', label: '415V AC, 3-Phase, 50Hz' },
        { value: '440V', label: '440V AC, 3-Phase, 50Hz' },
        { value: '230V', label: '230V AC, 1-Phase, 50Hz' },
      ],
    },
    {
      code: 'FORM',
      name: 'Internal Separation Form',
      inputType: InputType.DROPDOWN,
      displayOrder: 3,
      options: [
        { value: 'FORM_1', label: 'Form 1 (No separation)' },
        { value: 'FORM_2B', label: 'Form 2B (Separation of busbars from functional units)' },
        { value: 'FORM_3B', label: 'Form 3B (Separation of functional units & terminals)' },
        { value: 'FORM_4B', label: 'Form 4B (Total segregation of all units, busbars & terminals)' },
      ],
    },
    {
      code: 'IP_RATING',
      name: 'Ingress Protection (IP Rating)',
      inputType: InputType.DROPDOWN,
      displayOrder: 4,
      options: [
        { value: 'IP42', label: 'IP42 (Indoor general industrial)' },
        { value: 'IP52', label: 'IP52 (Drip-proof)' },
        { value: 'IP54', label: 'IP54 (Dust & water splash protected)' },
        { value: 'IP55', label: 'IP55 (Outdoor Weatherproof)' },
        { value: 'IP65', label: 'IP65 (Heavy industrial wash-down)' },
      ],
    },
    {
      code: 'STARTER_TYPE',
      name: 'Starter / Control Type',
      inputType: InputType.DROPDOWN,
      displayOrder: 5,
      options: [
        { value: 'DOL', label: 'Direct-On-Line (DOL)' },
        { value: 'STAR_DELTA', label: 'Star-Delta Starter' },
        { value: 'SOFT_STARTER', label: 'Solid State Soft Starter' },
        { value: 'VFD', label: 'Variable Frequency Drive (VFD)' },
      ],
    },
    {
      code: 'DRIVE_CAPACITY',
      name: 'Drive / Motor Capacity',
      inputType: InputType.DROPDOWN,
      unit: 'kW',
      displayOrder: 6,
      options: [
        { value: '5.5KW', label: '5.5 kW (7.5 HP)' },
        { value: '11KW', label: '11 kW (15 HP)' },
        { value: '22KW', label: '22 kW (30 HP)' },
        { value: '37KW', label: '37 kW (50 HP)' },
        { value: '55KW', label: '55 kW (75 HP)' },
        { value: '75KW', label: '75 kW (100 HP)' },
        { value: '90KW', label: '90 kW (120 HP)' },
      ],
    },
    {
      code: 'HMI_SIZE',
      name: 'HMI Display Size',
      inputType: InputType.DROPDOWN,
      displayOrder: 7,
      options: [
        { value: '7_INCH', label: '7-inch Color TFT Touchscreen' },
        { value: '10_INCH', label: '10-inch High-Resolution Touchscreen' },
        { value: '15_INCH', label: '15-inch Industrial Touch PC / Panel' },
      ],
    },
    {
      code: 'IO_COUNT',
      name: 'Digital & Analog I/O Points',
      inputType: InputType.DROPDOWN,
      displayOrder: 8,
      options: [
        { value: '16_IO', label: '16 Points (8 DI / 8 DO)' },
        { value: '32_IO', label: '32 Points (16 DI / 16 DO / 4 AI)' },
        { value: '64_IO', label: '64 Points (32 DI / 24 DO / 8 AI)' },
        { value: '128_IO', label: '128 Points Modular Expanded I/O' },
      ],
    },
    {
      code: 'BUSBAR_MATERIAL',
      name: 'Busbar Material',
      inputType: InputType.DROPDOWN,
      displayOrder: 9,
      options: [
        { value: 'ALUMINIUM', label: 'High Conductivity EC Grade Aluminium' },
        { value: 'COPPER', label: 'Electrolytic Tough Pitch (ETP) Pure Copper' },
      ],
    },
    {
      code: 'ENCLOSURE_MATERIAL',
      name: 'Enclosure Material',
      inputType: InputType.DROPDOWN,
      displayOrder: 10,
      options: [
        { value: 'CRCA_SHEET', label: 'CRCA 2mm Sheet Steel (RAL 7035 Powder Coated)' },
        { value: 'SS304', label: 'Stainless Steel SS304 Matt Brushed' },
      ],
    },
  ];

  const specs: Record<string, any> = {};
  for (const s of specsData) {
    const spec = await prisma.specification.upsert({
      where: { code: s.code },
      update: { name: s.name, inputType: s.inputType, unit: s.unit, displayOrder: s.displayOrder },
      create: {
        code: s.code,
        name: s.name,
        inputType: s.inputType,
        unit: s.unit,
        displayOrder: s.displayOrder,
      },
    });
    specs[s.code] = spec;

    for (let i = 0; i < s.options.length; i++) {
      const opt = s.options[i];
      await prisma.specificationOption.upsert({
        where: {
          specificationId_value: {
            specificationId: spec.id,
            value: opt.value,
          },
        },
        update: { label: opt.label, displayOrder: i },
        create: {
          specificationId: spec.id,
          value: opt.value,
          label: opt.label,
          displayOrder: i,
        },
      });
    }
  }
  console.log(`✓ ${specsData.length} Specifications and associated options seeded`);

  // 6. Product-Specification Dynamic Mappings
  const mappings = [
    // MCC Panel
    { prod: 'MCC-IND-01', specs: ['CURRENT_RATING', 'VOLTAGE', 'FORM', 'IP_RATING', 'STARTER_TYPE', 'BUSBAR_MATERIAL'] },
    // PLC & HMI Panel
    { prod: 'PLC-HMI-01', specs: ['HMI_SIZE', 'IO_COUNT', 'VOLTAGE', 'IP_RATING', 'ENCLOSURE_MATERIAL'] },
    // APFC Panel
    { prod: 'APFC-PANEL-01', specs: ['CURRENT_RATING', 'VOLTAGE', 'IP_RATING', 'BUSBAR_MATERIAL'] },
    // AC Drive Panel
    { prod: 'VFD-ACD-01', specs: ['DRIVE_CAPACITY', 'VOLTAGE', 'IP_RATING', 'STARTER_TYPE'] },
    // PCC Panel
    { prod: 'PCC-MSB-01', specs: ['CURRENT_RATING', 'VOLTAGE', 'FORM', 'BUSBAR_MATERIAL', 'IP_RATING'] },
    // Distribution Panel
    { prod: 'PDB-DIST-01', specs: ['CURRENT_RATING', 'VOLTAGE', 'IP_RATING', 'ENCLOSURE_MATERIAL'] },
  ];

  for (const m of mappings) {
    const prod = products[m.prod];
    for (let i = 0; i < m.specs.length; i++) {
      const specCode = m.specs[i];
      const spec = specs[specCode];
      await prisma.productSpecification.upsert({
        where: {
          productId_specificationId: {
            productId: prod.id,
            specificationId: spec.id,
          },
        },
        update: { displayOrder: i, isRequired: true },
        create: {
          productId: prod.id,
          specificationId: spec.id,
          isRequired: true,
          displayOrder: i,
        },
      });
    }
  }
  console.log('✓ Product-Specification mappings seeded');

  // 7. Pricing Rules (Clearly marked as DEMO DATA)
  const rules = [
    // MCC Panel combinations
    {
      ruleCode: 'PR-MCC-001',
      productCode: 'MCC-IND-01',
      specs: {
        CURRENT_RATING: '1000A',
        VOLTAGE: '415V',
        FORM: 'FORM_2B',
        IP_RATING: 'IP54',
        STARTER_TYPE: 'STAR_DELTA',
        BUSBAR_MATERIAL: 'ALUMINIUM',
      },
      price: 250000.0,
      notes: '[DEMO DATA] Standard 1000A Form 2B MCC Panel with Aluminium Busbars',
    },
    {
      ruleCode: 'PR-MCC-002',
      productCode: 'MCC-IND-01',
      specs: {
        CURRENT_RATING: '1000A',
        VOLTAGE: '415V',
        FORM: 'FORM_3B',
        IP_RATING: 'IP54',
        STARTER_TYPE: 'VFD',
        BUSBAR_MATERIAL: 'COPPER',
      },
      price: 345000.0,
      notes: '[DEMO DATA] Premium 1000A Form 3B MCC Panel with Copper Busbars and VFD starter',
    },
    {
      ruleCode: 'PR-MCC-003',
      productCode: 'MCC-IND-01',
      specs: {
        CURRENT_RATING: '630A',
        VOLTAGE: '415V',
        FORM: 'FORM_2B',
        IP_RATING: 'IP54',
        STARTER_TYPE: 'STAR_DELTA',
        BUSBAR_MATERIAL: 'ALUMINIUM',
      },
      price: 185000.0,
      notes: '[DEMO DATA] 630A Form 2B MCC Panel with Aluminium Busbars',
    },
    {
      ruleCode: 'PR-MCC-004',
      productCode: 'MCC-IND-01',
      specs: {
        CURRENT_RATING: '1600A',
        VOLTAGE: '415V',
        FORM: 'FORM_4B',
        IP_RATING: 'IP55',
        STARTER_TYPE: 'VFD',
        BUSBAR_MATERIAL: 'COPPER',
      },
      price: 580000.0,
      notes: '[DEMO DATA] Heavy Duty 1600A Form 4B MCC Panel Weatherproof with Copper Busbars',
    },

    // PLC & HMI Panel combinations
    {
      ruleCode: 'PR-PLC-001',
      productCode: 'PLC-HMI-01',
      specs: {
        HMI_SIZE: '10_INCH',
        IO_COUNT: '32_IO',
        VOLTAGE: '415V',
        IP_RATING: 'IP54',
        ENCLOSURE_MATERIAL: 'CRCA_SHEET',
      },
      price: 210000.0,
      notes: '[DEMO DATA] 10" HMI with 32 I/O Automation Panel in CRCA powder coated enclosure',
    },
    {
      ruleCode: 'PR-PLC-002',
      productCode: 'PLC-HMI-01',
      specs: {
        HMI_SIZE: '7_INCH',
        IO_COUNT: '16_IO',
        VOLTAGE: '230V',
        IP_RATING: 'IP52',
        ENCLOSURE_MATERIAL: 'CRCA_SHEET',
      },
      price: 125000.0,
      notes: '[DEMO DATA] Compact 7" HMI 16 I/O Control Enclosure',
    },
    {
      ruleCode: 'PR-PLC-003',
      productCode: 'PLC-HMI-01',
      specs: {
        HMI_SIZE: '15_INCH',
        IO_COUNT: '64_IO',
        VOLTAGE: '415V',
        IP_RATING: 'IP55',
        ENCLOSURE_MATERIAL: 'SS304',
      },
      price: 420000.0,
      notes: '[DEMO DATA] SS304 Food/Pharma Grade 15" Touchscreen Automation Panel with 64 I/O',
    },

    // APFC Panel combinations
    {
      ruleCode: 'PR-APFC-001',
      productCode: 'APFC-PANEL-01',
      specs: {
        CURRENT_RATING: '400A',
        VOLTAGE: '415V',
        IP_RATING: 'IP54',
        BUSBAR_MATERIAL: 'ALUMINIUM',
      },
      price: 160000.0,
      notes: '[DEMO DATA] 400A APFC Capacitor Switchboard with Detuned Filter',
    },
    {
      ruleCode: 'PR-APFC-002',
      productCode: 'APFC-PANEL-01',
      specs: {
        CURRENT_RATING: '800A',
        VOLTAGE: '415V',
        IP_RATING: 'IP54',
        BUSBAR_MATERIAL: 'COPPER',
      },
      price: 290000.0,
      notes: '[DEMO DATA] 800A APFC Panel with Copper Busbars and Microprocessor Controller',
    },

    // AC Drive Panel combinations
    {
      ruleCode: 'PR-VFD-001',
      productCode: 'VFD-ACD-01',
      specs: {
        DRIVE_CAPACITY: '37KW',
        VOLTAGE: '415V',
        IP_RATING: 'IP54',
        STARTER_TYPE: 'VFD',
      },
      price: 195000.0,
      notes: '[DEMO DATA] 37 kW (50 HP) VFD Panel with Line Choke and Cooling Fans',
    },
    {
      ruleCode: 'PR-VFD-002',
      productCode: 'VFD-ACD-01',
      specs: {
        DRIVE_CAPACITY: '75KW',
        VOLTAGE: '415V',
        IP_RATING: 'IP55',
        STARTER_TYPE: 'VFD',
      },
      price: 360000.0,
      notes: '[DEMO DATA] 75 kW (100 HP) Weatherproof VFD Panel',
    },

    // PCC Panel combination
    {
      ruleCode: 'PR-PCC-001',
      productCode: 'PCC-MSB-01',
      specs: {
        CURRENT_RATING: '1600A',
        VOLTAGE: '415V',
        FORM: 'FORM_4B',
        BUSBAR_MATERIAL: 'COPPER',
        IP_RATING: 'IP54',
      },
      price: 680000.0,
      notes: '[DEMO DATA] 1600A PCC Panel with 4-pole ACB, Copper busbars and Form 4B isolation',
    },

    // Distribution Panel combination
    {
      ruleCode: 'PR-PDB-001',
      productCode: 'PDB-DIST-01',
      specs: {
        CURRENT_RATING: '400A',
        VOLTAGE: '415V',
        IP_RATING: 'IP54',
        ENCLOSURE_MATERIAL: 'CRCA_SHEET',
      },
      price: 95000.0,
      notes: '[DEMO DATA] 400A Main PDB with 8 outgoing MCCB feeders',
    },
  ];

  for (const r of rules) {
    const prod = products[r.productCode];
    const hash = buildCriteriaHash(r.specs);
    await prisma.pricingRule.upsert({
      where: { ruleCode: r.ruleCode },
      update: {
        basePrice: r.price,
        specCriteria: r.specs,
        criteriaHash: hash,
        notes: r.notes,
        active: true,
      },
      create: {
        ruleCode: r.ruleCode,
        productId: prod.id,
        specCriteria: r.specs,
        criteriaHash: hash,
        basePrice: r.price,
        notes: r.notes,
        active: true,
      },
    });
  }
  console.log(`✓ ${rules.length} Pricing rules seeded (DEMO DATA)`);

  // 8. Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      customerName: 'Lakshmi Machine Works Ltd',
      companyName: 'Lakshmi Machine Works Ltd (LMW)',
      contactPerson: 'K. Balasubramanian (Chief Engineer - Electrical)',
      phone: '+91 94421 11223',
      email: 'electrical@lmw.co.in',
      address: 'Periyanaickenpalayam, Coimbatore - 641020, Tamil Nadu',
      gstin: '33AAACL1234E1ZQ',
      state: 'Tamil Nadu',
      notes: 'Key industrial OEM account for spinning mill electrical panels.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      customerName: 'Roots Industries India Ltd',
      companyName: 'Roots Industries India Ltd',
      contactPerson: 'S. Anand (General Manager - Projects)',
      phone: '+91 98422 33445',
      email: 'projects@roots.co.in',
      address: 'R.K.G. Industrial Estate, Ganapathy, Coimbatore - 641006, Tamil Nadu',
      gstin: '33AAACR5678B1ZP',
      state: 'Tamil Nadu',
      notes: 'Automotive horn and electronics manufacturing plant expansion.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      customerName: 'Texmo Industries',
      companyName: 'Texmo Industries',
      contactPerson: 'V. Murugan (Maintenance Head)',
      phone: '+91 97509 55667',
      email: 'maintenance@texmo.com',
      address: 'Mettupalayam Road, G.N. Mills Post, Coimbatore - 641029, Tamil Nadu',
      gstin: '33AAACT9012A1ZR',
      state: 'Tamil Nadu',
      notes: 'Agricultural and domestic pumps manufacturing division.',
    },
  });
  console.log('✓ 3 Sample customers seeded');

  // 9. Sample Saved Estimations
  // Estimation 1: Multi-product Finalized estimation
  const est1 = await prisma.estimation.create({
    data: {
      estimationNumber: 'EST-2026-00001',
      date: new Date(),
      validityDays: 30,
      status: EstimationStatus.FINALIZED,
      customerId: customer1.id,
      customerName: customer1.customerName,
      companyName: customer1.companyName,
      contactPerson: customer1.contactPerson,
      phone: customer1.phone,
      email: customer1.email,
      address: customer1.address,
      gstin: customer1.gstin,
      state: customer1.state,
      referenceNumber: 'RFQ-LMW-2026/EL-042',
      subtotal: 710000.0,
      discountPercent: 5.0,
      discountAmount: 35500.0,
      taxableAmount: 674500.0,
      taxType: 'INTRA_STATE',
      cgstRate: 9.0,
      cgstAmount: 60705.0,
      sgstRate: 9.0,
      sgstAmount: 60705.0,
      igstRate: 0.0,
      igstAmount: 0.0,
      totalTaxAmount: 121410.0,
      grandTotal: 795910.0,
      amountInWords: 'Seven Lakh Ninety-Five Thousand Nine Hundred and Ten Rupees Only',
      remarks: 'Standard powder coated industrial enclosure with Siemens switchgear. Delivery within 4 weeks.',
      termsConditions: 'Standard SVG Electric quotation terms and conditions apply.',
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products['MCC-IND-01'].id,
            productCodeSnapshot: 'MCC-IND-01',
            productNameSnapshot: 'Industrial Motor Control Center (MCC Panel)',
            categorySnapshot: 'MCC Panel',
            quantity: 2,
            unitPrice: 250000.0,
            lineTotal: 500000.0,
            priceRuleId: 'PR-MCC-001',
            specificationsSnapshot: {
              CURRENT_RATING: '1000A',
              VOLTAGE: '415V',
              FORM: 'FORM_2B',
              IP_RATING: 'IP54',
              STARTER_TYPE: 'STAR_DELTA',
              BUSBAR_MATERIAL: 'ALUMINIUM',
            },
            itemSpecs: {
              create: [
                { specCode: 'CURRENT_RATING', specName: 'Current Rating', optionValue: '1000A', optionLabel: '1000 Amps' },
                { specCode: 'VOLTAGE', specName: 'Rated Voltage', optionValue: '415V', optionLabel: '415V AC, 3-Phase, 50Hz' },
                { specCode: 'FORM', specName: 'Internal Separation Form', optionValue: 'FORM_2B', optionLabel: 'Form 2B (Separation of busbars from functional units)' },
                { specCode: 'IP_RATING', specName: 'Ingress Protection', optionValue: 'IP54', optionLabel: 'IP54 (Dust & water splash protected)' },
                { specCode: 'STARTER_TYPE', specName: 'Starter / Control Type', optionValue: 'STAR_DELTA', optionLabel: 'Star-Delta Starter' },
                { specCode: 'BUSBAR_MATERIAL', specName: 'Busbar Material', optionValue: 'ALUMINIUM', optionLabel: 'High Conductivity EC Grade Aluminium' },
              ],
            },
          },
          {
            productId: products['PLC-HMI-01'].id,
            productCodeSnapshot: 'PLC-HMI-01',
            productNameSnapshot: 'PLC & HMI Automation Control Panel',
            categorySnapshot: 'PLC & HMI Panel',
            quantity: 1,
            unitPrice: 210000.0,
            lineTotal: 210000.0,
            priceRuleId: 'PR-PLC-001',
            specificationsSnapshot: {
              HMI_SIZE: '10_INCH',
              IO_COUNT: '32_IO',
              VOLTAGE: '415V',
              IP_RATING: 'IP54',
              ENCLOSURE_MATERIAL: 'CRCA_SHEET',
            },
            itemSpecs: {
              create: [
                { specCode: 'HMI_SIZE', specName: 'HMI Display Size', optionValue: '10_INCH', optionLabel: '10-inch High-Resolution Touchscreen' },
                { specCode: 'IO_COUNT', specName: 'Digital & Analog I/O Points', optionValue: '32_IO', optionLabel: '32 Points (16 DI / 16 DO / 4 AI)' },
                { specCode: 'VOLTAGE', specName: 'Rated Voltage', optionValue: '415V', optionLabel: '415V AC, 3-Phase, 50Hz' },
                { specCode: 'IP_RATING', specName: 'Ingress Protection', optionValue: 'IP54', optionLabel: 'IP54 (Dust & water splash protected)' },
                { specCode: 'ENCLOSURE_MATERIAL', specName: 'Enclosure Material', optionValue: 'CRCA_SHEET', optionLabel: 'CRCA 2mm Sheet Steel (RAL 7035 Powder Coated)' },
              ],
            },
          },
        ],
      },
    },
  });

  // Estimation 2: Draft estimation
  const est2 = await prisma.estimation.create({
    data: {
      estimationNumber: 'EST-2026-00002',
      date: new Date(),
      validityDays: 30,
      status: EstimationStatus.DRAFT,
      customerId: customer2.id,
      customerName: customer2.customerName,
      companyName: customer2.companyName,
      contactPerson: customer2.contactPerson,
      phone: customer2.phone,
      email: customer2.email,
      address: customer2.address,
      gstin: customer2.gstin,
      state: customer2.state,
      referenceNumber: 'ENQ-ROOTS-9921',
      subtotal: 195000.0,
      discountPercent: 0.0,
      discountAmount: 0.0,
      taxableAmount: 195000.0,
      taxType: 'INTRA_STATE',
      cgstRate: 9.0,
      cgstAmount: 17550.0,
      sgstRate: 9.0,
      sgstAmount: 17550.0,
      igstRate: 0.0,
      igstAmount: 0.0,
      totalTaxAmount: 35100.0,
      grandTotal: 230100.0,
      amountInWords: 'Two Lakh Thirty Thousand One Hundred Rupees Only',
      remarks: 'Initial draft for 37kW VFD ventilation fan control.',
      termsConditions: 'Standard terms apply.',
      createdById: sales.id,
      items: {
        create: [
          {
            productId: products['VFD-ACD-01'].id,
            productCodeSnapshot: 'VFD-ACD-01',
            productNameSnapshot: 'AC Variable Frequency Drive (VFD Panel)',
            categorySnapshot: 'AC Drive Panel',
            quantity: 1,
            unitPrice: 195000.0,
            lineTotal: 195000.0,
            priceRuleId: 'PR-VFD-001',
            specificationsSnapshot: {
              DRIVE_CAPACITY: '37KW',
              VOLTAGE: '415V',
              IP_RATING: 'IP54',
              STARTER_TYPE: 'VFD',
            },
            itemSpecs: {
              create: [
                { specCode: 'DRIVE_CAPACITY', specName: 'Drive / Motor Capacity', optionValue: '37KW', optionLabel: '37 kW (50 HP)' },
                { specCode: 'VOLTAGE', specName: 'Rated Voltage', optionValue: '415V', optionLabel: '415V AC, 3-Phase, 50Hz' },
                { specCode: 'IP_RATING', specName: 'Ingress Protection', optionValue: 'IP54', optionLabel: 'IP54 (Dust & water splash protected)' },
                { specCode: 'STARTER_TYPE', specName: 'Starter / Control Type', optionValue: 'VFD', optionLabel: 'Variable Frequency Drive (VFD)' },
              ],
            },
          },
        ],
      },
    },
  });

  // Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_INITIALIZATION',
        entity: 'System',
        entityId: 'SYSTEM',
        details: { message: 'Database initialized and seeded with SVG Electric catalog and demo prices.' },
      },
      {
        userId: sales.id,
        action: 'ESTIMATION_FINALIZED',
        entity: 'Estimation',
        entityId: est1.id,
        details: { estimationNumber: est1.estimationNumber, grandTotal: est1.grandTotal },
      },
      {
        userId: sales.id,
        action: 'ESTIMATION_DRAFT_CREATED',
        entity: 'Estimation',
        entityId: est2.id,
        details: { estimationNumber: est2.estimationNumber, grandTotal: est2.grandTotal },
      },
    ],
  });

  console.log('✓ Sample estimations and audit logs seeded');
  console.log('--- Database Seed Complete! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
