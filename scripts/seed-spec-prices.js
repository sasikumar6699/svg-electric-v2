const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRICE_MAP = {
  // Voltage
  '415V': 15000,
  '440V': 20000,
  '230V': 10000,

  // Current Rating
  '63A': 18000,
  '100A': 28000,
  '250A': 55000,
  '400A': 85000,
  '630A': 125000,
  '800A': 165000,
  '1000A': 210000,
  '1600A': 320000,
  '2500A': 480000,

  // Form of Separation
  'FORM_1': 5000,
  'FORM_2B': 15000,
  'FORM_3B': 25000,
  'FORM_4B': 45000,

  // IP Rating
  'IP42': 5000,
  'IP52': 10000,
  'IP54': 18000,
  'IP55': 25000,
  'IP65': 40000,

  // Starter Type
  'DOL': 8000,
  'STAR_DELTA': 18000,
  'SOFT_STARTER': 45000,
  'VFD': 75000,

  // Drive Capacity
  '5.5KW': 22000,
  '11KW': 38000,
  '22KW': 65000,
  '37KW': 95000,
  '55KW': 140000,
  '75KW': 185000,
  '90KW': 230000,

  // Enclosure Material
  'CRCA_1_6': 12000,
  'CRCA_2_0': 20000,
  'SS304': 65000,
  'SS316': 95000,

  // Busbar Material
  'ALUMINIUM': 15000,
  'COPPER': 65000,

  // PLC Brand
  'SIEMENS': 45000,
  'SCHNEIDER': 42000,
  'ROCKWELL': 68000,
  'DELTA': 22000,

  // HMI Size
  'HMI_4_3': 15000,
  'HMI_7_0': 28000,
  'HMI_10_1': 48000,
  'HMI_15_0': 85000,
};

const PRODUCT_BASE_PRICES = {
  'MCC-PNL-001': 45000,
  'PLC-HMI-001': 55000,
  'APFC-PNL-001': 35000,
  'VFD-DRV-001': 40000,
  'PCC-PNL-001': 50000,
  'PDB-PNL-001': 30000,
};

async function main() {
  console.log('--- Seeding Individual Specification Prices & Product Base Prices ---');

  // 1. Update Product Base Prices
  for (const [code, basePrice] of Object.entries(PRODUCT_BASE_PRICES)) {
    const updated = await prisma.product.updateMany({
      where: { productCode: code },
      data: { basePrice },
    });
    console.log(`Product ${code} basePrice set to ₹${basePrice} (updated ${updated.count})`);
  }

  // 2. Update SpecificationOption Prices
  const allOptions = await prisma.specificationOption.findMany({
    include: { specification: true },
  });
  console.log(`Found ${allOptions.length} specification options in database.`);

  let updatedCount = 0;
  for (const opt of allOptions) {
    let price = PRICE_MAP[opt.value];
    if (price === undefined) {
      // Fuzzy matching by value or label
      const upperVal = opt.value.toUpperCase();
      for (const [k, v] of Object.entries(PRICE_MAP)) {
        if (upperVal.includes(k) || k.includes(upperVal)) {
          price = v;
          break;
        }
      }
    }
    if (price === undefined) {
      price = 10000; // Default baseline price
    }

    await prisma.specificationOption.update({
      where: { id: opt.id },
      data: { price },
    });
    updatedCount++;
    console.log(`  [${opt.specification.name}] ${opt.label} (${opt.value}) -> ₹${price.toLocaleString('en-IN')}`);
  }

  console.log(`\nSuccessfully seeded prices for ${updatedCount} specification options.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());