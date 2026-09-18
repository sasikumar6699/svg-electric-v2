const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== PRODUCTS ===');
  const prods = await p.product.findMany({
    include: {
      category: true,
      productSpecs: {
        include: {
          specification: {
            include: { options: { orderBy: { displayOrder: 'asc' } } }
          }
        },
        orderBy: { displayOrder: 'asc' }
      },
      pricingRules: true
    },
    orderBy: { productCode: 'asc' }
  });

  for (const pr of prods) {
    console.log(`\nPRODUCT [${pr.productCode}]: ${pr.name}`);
    console.log(`  Category: ${pr.category.name}`);
    console.log(`  Base Price: ₹${pr.basePrice}`);
    console.log(`  Specs (${pr.productSpecs.length}):`);
    for (const ps of pr.productSpecs) {
      console.log(`    - ${ps.specification.name} (${ps.specification.code}) [Required: ${ps.isRequired}, Order: ${ps.displayOrder}]`);
      console.log(`      Options (${ps.specification.options.length}): ` + ps.specification.options.map(o => `${o.label}=+₹${o.price}`).join(', '));
    }
    console.log(`  Pricing Rules (${pr.pricingRules.length}): ` + pr.pricingRules.map(r => `${r.ruleCode}: ₹${r.basePrice}`).join(', '));
  }

  console.log('\n=== ALL SPECIFICATIONS ===');
  const allSpecs = await p.specification.findMany({
    include: { options: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { displayOrder: 'asc' }
  });
  for (const s of allSpecs) {
    console.log(`\nSPEC [${s.code}]: ${s.name} (${s.inputType}, Unit: ${s.unit || 'none'})`);
    for (const opt of s.options) {
      console.log(`  - ${opt.label} (${opt.value}): +₹${opt.price} [Active: ${opt.active}]`);
    }
  }

  console.log('\n=== ALL PRICING RULES (PRICING MATRIX) ===');
  const allRules = await p.pricingRule.findMany({
    include: { product: true }
  });
  for (const r of allRules) {
    console.log(`RULE [${r.ruleCode}]: Product=${r.product.productCode}, BasePrice=₹${r.basePrice}, Criteria=${r.criteriaHash}, Notes=${r.notes}`);
  }
}

main().catch(console.error).finally(() => p.$disconnect());
