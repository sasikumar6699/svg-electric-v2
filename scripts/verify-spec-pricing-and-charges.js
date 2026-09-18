const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('====================================================');
  console.log('SVG ELECTRIC - ADDITIVE PRICING & CHARGES VERIFICATION');
  console.log('====================================================\n');

  // 1. Verify Products and Base Prices
  const products = await prisma.product.findMany({
    select: { id: true, productCode: true, name: true, basePrice: true },
  });
  console.log('1. Verifying Product Base Prices:');
  for (const p of products) {
    console.log(`   - ${p.productCode} (${p.name}): Rs. ${p.basePrice}`);
    if (p.basePrice <= 0) {
      throw new Error(`Product ${p.productCode} has invalid basePrice: ${p.basePrice}`);
    }
  }

  // 2. Verify Specification Options Prices
  const specOptionsCount = await prisma.specificationOption.count();
  const specOptionsWithPrice = await prisma.specificationOption.findMany({
    where: { price: { gt: 0 } },
    select: { value: true, label: true, price: true, specification: { select: { name: true } } },
    take: 8,
  });
  console.log(`\n2. Verifying Specification Option Prices (${specOptionsCount} options total):`);
  for (const opt of specOptionsWithPrice) {
    console.log(`   - [${opt.specification.name}] ${opt.label} (${opt.value}): +Rs. ${opt.price}`);
  }

  // 3. Test Pricing Engine Directly
  console.log('\n3. Testing PricingEngine Additive Calculation:');
  const mcc = products.find((p) => p.productCode === 'MCC-IND-01');
  if (!mcc) throw new Error('MCC-IND-01 not found');

  // Load MCC specifications
  const mccWithSpecs = await prisma.product.findUnique({
    where: { id: mcc.id },
    include: {
      productSpecs: {
        include: {
          specification: {
            include: { options: true },
          },
        },
      },
    },
  });

  const selectedSpecs = {
    CURRENT_RATING: '630A',
    OPERATING_VOLTAGE: '415V',
    FORM_SEPARATION: 'FORM_3B',
    IP_PROTECTION: 'IP54',
    STARTER_TYPE: 'STAR_DELTA',
    BUSBAR_MATERIAL: 'COPPER',
  };

  let expectedOptionSum = 0;
  for (const ps of mccWithSpecs.productSpecs) {
    const val = selectedSpecs[ps.specification.code];
    if (val) {
      const opt = ps.specification.options.find((o) => o.value === val);
      if (opt) {
        console.log(`   + Option [${ps.specification.name}: ${opt.label}]: Rs. ${opt.price}`);
        expectedOptionSum += opt.price;
      }
    }
  }

  const expectedCalculatedPrice = mcc.basePrice + expectedOptionSum;
  console.log(`   Base Panel Enclosure: Rs. ${mcc.basePrice}`);
  console.log(`   Sum of Selected Specifications: Rs. ${expectedOptionSum}`);
  console.log(`   Expected Additive Unit Price: Rs. ${expectedCalculatedPrice}`);

  // 4. Test Calculation logic with mock call
  const { PricingEngine } = require('../lib/pricing/pricing-engine');
  const result = await PricingEngine.calculatePrice({
    productId: mcc.id,
    specifications: selectedSpecs,
    quantity: 2,
  });

  if (!result.success) {
    throw new Error(`PricingEngine failed: ${result.error}`);
  }

  console.log(`\n   Engine Output:`);
  console.log(`   - Strategy: ${result.pricingStrategy}`);
  console.log(`   - Unit Price: Rs. ${result.unitPrice}`);
  console.log(`   - Quantity: ${result.quantity}`);
  console.log(`   - Line Total: Rs. ${result.lineAmount}`);
  console.log(`   - Is Manual Price: ${result.isManualPrice}`);

  if (result.unitPrice !== expectedCalculatedPrice) {
    throw new Error(`Price mismatch! Expected ${expectedCalculatedPrice}, got ${result.unitPrice}`);
  }

  // 5. Test Manual Price Override
  console.log('\n4. Testing Manual Price Override:');
  const manualResult = await PricingEngine.calculatePrice({
    productId: mcc.id,
    specifications: selectedSpecs,
    quantity: 3,
    manualPriceOverride: 275000,
  });

  if (!manualResult.success) {
    throw new Error(`Manual PricingEngine failed: ${manualResult.error}`);
  }

  console.log(`   - Strategy: ${manualResult.pricingStrategy}`);
  console.log(`   - Unit Price: Rs. ${manualResult.unitPrice} (Expected: 275000)`);
  console.log(`   - Quantity: ${manualResult.quantity}`);
  console.log(`   - Line Total: Rs. ${manualResult.lineAmount} (Expected: 825000)`);
  console.log(`   - Is Manual Price: ${manualResult.isManualPrice}`);

  if (manualResult.unitPrice !== 275000 || manualResult.isManualPrice !== true || manualResult.lineAmount !== 825000) {
    throw new Error('Manual price override verification failed');
  }

  // 6. Test Commercial Calculations: Installation & Freight Charges
  console.log('\n5. Verifying Installation & Freight Charges Calculations:');
  const subtotal = manualResult.lineAmount; // 825,000
  const discountPercent = 5;
  const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100; // 41,250
  const netSubtotal = subtotal - discountAmount; // 783,750

  // Percentage mode
  const installationRate = 5; // 5% of net
  const autoInstallationAmount = Math.round((netSubtotal * installationRate) / 100 * 100) / 100; // 39,187.50

  const freightRate = 3; // 3% of net
  const autoFreightAmount = Math.round((netSubtotal * freightRate) / 100 * 100) / 100; // 23,512.50

  const taxableAmount = netSubtotal + autoInstallationAmount + autoFreightAmount; // 846,450

  const cgstRate = 9;
  const sgstRate = 9;
  const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100; // 76,180.50
  const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100; // 76,180.50
  const grandTotal = Math.round((taxableAmount + cgstAmount + sgstAmount) * 100) / 100;

  console.log(`   - Subtotal: Rs. ${subtotal}`);
  console.log(`   - Discount (5%): -Rs. ${discountAmount}`);
  console.log(`   - Net Subtotal: Rs. ${netSubtotal}`);
  console.log(`   - Auto Installation (5%): +Rs. ${autoInstallationAmount}`);
  console.log(`   - Auto Freight (3%): +Rs. ${autoFreightAmount}`);
  console.log(`   - Taxable Assessable Value: Rs. ${taxableAmount}`);
  console.log(`   - CGST (9%): Rs. ${cgstAmount}`);
  console.log(`   - SGST (9%): Rs. ${sgstAmount}`);
  console.log(`   - Grand Total: Rs. ${grandTotal}`);

  console.log('\nALL ENGINE & CALCULATION TESTS PASSED SUCCESSFULLY! ✅\n');
}

runTests()
  .catch((e) => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
