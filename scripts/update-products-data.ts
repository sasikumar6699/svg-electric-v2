import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Updating Products with Specifications, Final Prices & Files ---');

  const productsUpdate = [
    {
      productCode: 'MCC-IND-01',
      price: 385000,
      specifications: [
        { name: 'Rated Current', value: '800A' },
        { name: 'Operating Voltage', value: '415V AC (+/- 10%)' },
        { name: 'Phase / Frequency', value: '3 Phase 4 Wire, 50Hz' },
        { name: 'Form of Separation', value: 'Form 4B Type 7' },
        { name: 'Busbar Material', value: 'Electrolytic Grade Copper (E91E)' },
        { name: 'Ingress Protection', value: 'IP54 Dust & Splash Resistant' },
        { name: 'Incomer Device', value: '800A 4P 50kA EDO Air Circuit Breaker' },
        { name: 'Starter Feeders', value: '8 Outgoing Starters (DOL & Star-Delta)' },
        { name: 'Enclosure Material', value: '2.0mm CRCA Sheet Steel, RAL 7035' },
      ],
      fileUrl: '/uploads/sample-mcc-panel.jpg',
      fileName: 'mcc-panel-technical-datasheet.jpg',
      fileType: 'IMAGE',
      fileSize: 48500,
    },
    {
      productCode: 'PLC-HMI-01',
      price: 245000,
      specifications: [
        { name: 'Controller Brand', value: 'Siemens S7-1200 / AB Micro850' },
        { name: 'HMI Display', value: '7-inch High-Resolution Color TFT Touch' },
        { name: 'Operating Voltage', value: '230V AC Single Phase / 24V DC' },
        { name: 'I/O Count', value: '32 DI, 24 DO, 8 AI (4-20mA)' },
        { name: 'Communication Ports', value: 'Dual Port RJ45 Ethernet, RS-485 Modbus' },
        { name: 'Ingress Protection', value: 'IP55 Sealed Industrial Enclosure' },
        { name: 'Power Supply', value: '24V DC 10A Redundant SMPS with UPS' },
      ],
      fileUrl: '/uploads/sample-plc-hmi.jpg',
      fileName: 'plc-hmi-panel-datasheet.jpg',
      fileType: 'IMAGE',
      fileSize: 48500,
    },
    {
      productCode: 'APFC-PANEL-01',
      price: 195000,
      specifications: [
        { name: 'Rated Capacity', value: '150 kVAR Automatic Bank' },
        { name: 'Operating Voltage', value: '440V AC, 3 Phase 50Hz' },
        { name: 'Control Stages', value: '8-Stage Microprocessor APFC Relay' },
        { name: 'Harmonics Filter', value: '7% Detuned Copper Wound Reactors' },
        { name: 'Capacitor Type', value: 'Heavy Duty MPP Gas Filled Cylindrical Cells' },
        { name: 'Incomer Switchgear', value: '400A 4P 36kA MCCB with Shunt Trip' },
        { name: 'Ingress Protection', value: 'IP42 Louvered Enclosure with Exhaust Fans' },
      ],
      fileUrl: '/uploads/sample-apfc-datasheet.pdf',
      fileName: 'apfc-panel-specifications.pdf',
      fileType: 'PDF',
      fileSize: 32000,
    },
    {
      productCode: 'VFD-ACD-01',
      price: 320000,
      specifications: [
        { name: 'Motor Drive Power', value: '75 kW / 100 HP Heavy Duty' },
        { name: 'Rated Voltage', value: '415V AC (+/- 10%), 3 Phase 50Hz' },
        { name: 'Drive Manufacturer', value: 'Danfoss VLT / ABB ACS880' },
        { name: 'Line Reactor', value: '3% Input AC Reactor & Output dV/dt Filter' },
        { name: 'Bypass System', value: 'Dual Contactor Auto Bypass with Overload Relay' },
        { name: 'Cooling Enclosure', value: 'Forced Air with Thermostatically Controlled Fans' },
        { name: 'Ingress Protection', value: 'IP54 Floor Standing Cubicle' },
      ],
      fileUrl: '/uploads/sample-vfd-drive.jpg',
      fileName: 'vfd-panel-datasheet.jpg',
      fileType: 'IMAGE',
      fileSize: 48500,
    },
    {
      productCode: 'PCC-MSB-01',
      price: 650000,
      specifications: [
        { name: 'Rated Current', value: '2500A Main Switchboard' },
        { name: 'Short Circuit Rating', value: '50 kA for 1 Second (Type Tested)' },
        { name: 'Incomer Breaker', value: '2500A 4P Drawout ACB with Microprocessor Trip' },
        { name: 'Busbar System', value: 'Tinned Copper Busbars (2500A continuous)' },
        { name: 'Form of Separation', value: 'Form 4B Compartmentalized' },
        { name: 'Metering Unit', value: 'Class 0.5s Multifunction Energy Meter RS485' },
        { name: 'Ingress Protection', value: 'IP54 with Neoprene Gaskets' },
      ],
      fileUrl: '/uploads/sample-pcc-datasheet.pdf',
      fileName: 'pcc-switchboard-drawing.pdf',
      fileType: 'PDF',
      fileSize: 35000,
    },
    {
      productCode: 'PDB-DIST-01',
      price: 125000,
      specifications: [
        { name: 'Rated Current', value: '400A Distribution Board' },
        { name: 'Operating Voltage', value: '415V AC, 3 Phase 4 Wire' },
        { name: 'Incomer Device', value: '400A 4P 36kA MCCB' },
        { name: 'Outgoing Feeders', value: '6 x 100A 3P MCCBs + 4 x 63A 3P MCCBs' },
        { name: 'Busbars', value: 'Electrolytic Copper Busbars with heat-shrink sleeves' },
        { name: 'Ingress Protection', value: 'IP54 Wall/Floor Mounting' },
      ],
      fileUrl: '/uploads/sample-pdb-datasheet.pdf',
      fileName: 'pdb-distribution-datasheet.pdf',
      fileType: 'PDF',
      fileSize: 28000,
    },
  ];

  for (const item of productsUpdate) {
    const existing = await prisma.product.findUnique({ where: { productCode: item.productCode } });
    if (existing) {
      await prisma.product.update({
        where: { productCode: item.productCode },
        data: {
          price: item.price,
          specifications: item.specifications,
          fileUrl: item.fileUrl,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
        },
      });
      console.log(`✓ Updated ${item.productCode} with price ₹${item.price} and ${item.specifications.length} specs`);
    }
  }

  console.log('--- All products successfully updated! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
