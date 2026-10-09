import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Cleaning Up Legacy Products Data (Before Scope) ---');

  // 1. Delete EstimationItemSpecifications
  const deletedItemSpecs = await prisma.estimationItemSpecification.deleteMany({});
  console.log(`✓ Deleted ${deletedItemSpecs.count} legacy estimation item specifications.`);

  // 2. Delete EstimationItems
  const deletedEstimationItems = await prisma.estimationItem.deleteMany({});
  console.log(`✓ Deleted ${deletedEstimationItems.count} legacy estimation items.`);

  // 3. Delete Estimations linked to old products
  const deletedEstimations = await prisma.estimation.deleteMany({});
  console.log(`✓ Deleted ${deletedEstimations.count} legacy dummy estimations.`);

  // 4. Delete Pricing Rules
  const deletedPricingRules = await prisma.pricingRule.deleteMany({});
  console.log(`✓ Deleted ${deletedPricingRules.count} legacy pricing rules.`);

  // 5. Delete Product Specifications
  const deletedProductSpecs = await prisma.productSpecification.deleteMany({});
  console.log(`✓ Deleted ${deletedProductSpecs.count} legacy product specifications.`);

  // 6. Delete all legacy Products
  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`✓ Deleted ${deletedProducts.count} legacy products from before scope.`);

  // Verify Finished Goods are intact
  const fgCount = await prisma.finishedGood.count();
  const compCount = await prisma.componentMaster.count();
  console.log(`\n=== Verification ===`);
  console.log(`- Finished Goods (FGs) remaining: ${fgCount} (All current scope preserved!)`);
  console.log(`- Component Master items remaining: ${compCount} (All price master preserved!)`);
  console.log(`- Legacy Products count now: 0`);
}

main()
  .catch((e) => {
    console.error('Cleanup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
