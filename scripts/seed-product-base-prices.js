const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PRODUCT_BASE_PRICES = {
  'MCC-IND-01': 45000,
  'PLC-HMI-01': 55000,
  'APFC-PANEL-01': 35000,
  'VFD-ACD-01': 40000,
  'PCC-MSB-01': 50000,
  'PDB-DIST-01': 30000,
};

async function main() {
  console.log('--- Updating Product Base Prices ---');
  const products = await prisma.product.findMany();
  for (const prod of products) {
    const basePrice = PRODUCT_BASE_PRICES[prod.productCode] ?? 35000;
    const updated = await prisma.product.update({
      where: { id: prod.id },
      data: { basePrice },
    });
    console.log(`Updated ${updated.productCode} (${updated.name}): basePrice = Rs. ${updated.basePrice}`);
  }
  console.log('Successfully updated product base prices.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
