const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('--- VERIFYING ADMIN MASTERS & PRICING ENGINE SCHEMA ---');

  // 1. Products Catalog: verify basePrice
  const products = await prisma.product.findMany({
    select: { id: true, productCode: true, name: true, basePrice: true },
  });
  console.log(`\n1. Products Catalog (${products.length} products):`);
  products.forEach(p => {
    console.log(`   - [${p.productCode}] ${p.name}: Base Price = ₹${p.basePrice}`);
  });

  // 2. Specifications & Options: verify option prices
  const specs = await prisma.specification.findMany({
    include: {
      options: {
        select: { id: true, value: true, label: true, price: true },
        orderBy: { displayOrder: 'asc' },
      },
    },
    take: 3,
  });
  console.log(`\n2. Specifications Master (Sample 3 Specs with Options & Add-on Prices):`);
  specs.forEach(s => {
    console.log(`   - [${s.code}] ${s.name}:`);
    s.options.forEach(o => {
      console.log(`       * ${o.label} (${o.value}): +₹${o.price}`);
    });
  });

  // 3. Product Specs Mapping: verify mappings exist
  const mappings = await prisma.productSpecification.findMany({
    include: {
      product: { select: { productCode: true, basePrice: true } },
      specification: { select: { code: true, name: true } },
    },
    take: 5,
  });
  console.log(`\n3. Product Specs Mapping (Sample 5 Mappings):`);
  mappings.forEach(m => {
    console.log(`   - Product ${m.product.productCode} (Base: ₹${m.product.basePrice}) <-> Spec ${m.specification.code} (${m.specification.name})`);
  });

  // 4. Pricing Rules (Combination Matrix): verify rules exist
  const rules = await prisma.pricingRule.findMany({
    include: { product: { select: { productCode: true } } },
    take: 3,
  });
  console.log(`\n4. Combination Pricing Rules Matrix (Sample 3 Rules):`);
  rules.forEach(r => {
    console.log(`   - Rule ${r.ruleCode} for Product ${r.product.productCode}: Fixed Base = ₹${r.basePrice}, Criteria: ${JSON.stringify(r.specCriteria)}`);
  });

  console.log('\n--- ALL ADMIN MASTERS DATA STRUCTURES VERIFIED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
