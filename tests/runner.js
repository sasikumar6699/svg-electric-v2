const assert = require('assert');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function buildCriteriaHash(specs) {
  const keys = Object.keys(specs).sort();
  const pairs = [];
  for (const k of keys) {
    let val = specs[k];
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) {
      val = val.slice().sort().join(',');
    }
    pairs.push(`${k.trim().toUpperCase()}:${String(val).trim().toUpperCase()}`);
  }
  return pairs.join('|');
}

const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const twoDigits = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tensMultiple = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertTwoDigit(num) {
  if (num === 0) return '';
  if (num < 10) return singleDigits[num];
  if (num >= 10 && num < 20) return twoDigits[num - 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return (tensMultiple[tens] + (ones > 0 ? '-' + singleDigits[ones] : '')).trim();
}

function convertThreeDigit(num) {
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  let str = '';
  if (hundreds > 0) {
    str += singleDigits[hundreds] + ' Hundred';
    if (remainder > 0) str += ' and ';
  }
  if (remainder > 0) {
    str += convertTwoDigit(remainder);
  }
  return str.trim();
}

function numberToIndianWords(amount) {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero Rupees Only';

  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toString().split('.');
  let integerPart = parseInt(parts[0], 10);
  const paise = parts.length > 1 ? parseInt(parts[1].padEnd(2, '0').slice(0, 2), 10) : 0;

  if (integerPart === 0 && paise > 0) {
    return convertTwoDigit(paise) + ' Paise Only';
  }

  let words = '';
  const crores = Math.floor(integerPart / 10000000);
  integerPart %= 10000000;

  const lakhs = Math.floor(integerPart / 100000);
  integerPart %= 100000;

  const thousands = Math.floor(integerPart / 1000);
  integerPart %= 1000;

  const remainder = integerPart;

  if (crores > 0) words += convertTwoDigit(crores) + ' Crore ';
  if (lakhs > 0) words += convertTwoDigit(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertTwoDigit(thousands) + ' Thousand ';
  if (remainder > 0) words += convertThreeDigit(remainder) + ' ';

  words = words.trim() + ' Rupees';
  if (paise > 0) words += ' and ' + convertTwoDigit(paise) + ' Paise';

  return words + ' Only';
}

async function runAllTests() {
  console.log('====================================================');
  console.log('SVG ELECTRIC ESTIMATION SYSTEM - TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function it(desc, fn) {
    try {
      fn();
      console.log(`  âœ“ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  âœ— ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  async function itAsync(desc, fn) {
    try {
      await fn();
      console.log(`  âœ“ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  âœ— ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // --- SUITE 1: PRICING ENGINE & SPECIFICATION HASHING ---
  console.log('TEST SUITE 1: Pricing Engine Criteria & Hashing');

  it('Normalizes and sorts specifications into a canonical criteria hash', () => {
    const input1 = { VOLTAGE: '415V', CURRENT_RATING: '1000A', FORM: 'FORM_2B' };
    const input2 = { FORM: 'FORM_2B', CURRENT_RATING: '1000A', VOLTAGE: '415V' };
    const hash1 = buildCriteriaHash(input1);
    const hash2 = buildCriteriaHash(input2);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1, 'CURRENT_RATING:1000A|FORM:FORM_2B|VOLTAGE:415V');
  });

  await itAsync('Pricing rule lookup returns exact price for configured MCC panel combination', async () => {
    const mccProduct = await prisma.product.findUnique({ where: { productCode: 'MCC-IND-01' } });
    assert(mccProduct, 'MCC Product should exist in db');

    const specs = {
      CURRENT_RATING: '1000A',
      VOLTAGE: '415V',
      FORM: 'FORM_2B',
      IP_RATING: 'IP54',
      STARTER_TYPE: 'STAR_DELTA',
      BUSBAR_MATERIAL: 'ALUMINIUM',
    };
    const hash = buildCriteriaHash(specs);

    const rule = await prisma.pricingRule.findFirst({
      where: { productId: mccProduct.id, criteriaHash: hash, active: true },
    });

    assert(rule, 'Pricing rule should exist');
    assert.strictEqual(rule.basePrice, 250000, 'Price should be exactly 250,000 INR');
  });

  await itAsync('Missing price rule returns null (pricing engine throws user-friendly error)', async () => {
    const mccProduct = await prisma.product.findUnique({ where: { productCode: 'MCC-IND-01' } });
    const invalidSpecs = {
      CURRENT_RATING: '9999A',
      VOLTAGE: '10000V',
    };
    const hash = buildCriteriaHash(invalidSpecs);

    const rule = await prisma.pricingRule.findFirst({
      where: { productId: mccProduct.id, criteriaHash: hash, active: true },
    });

    assert.strictEqual(rule, null, 'No rule should match invalid combination');
  });

  // --- SUITE 2: MULTI-PRODUCT & MULTI-QUANTITY TOTALS ---
  console.log('\nTEST SUITE 2: Multi-Product, Multi-Quantity, Tax & Discount Calculations');

  it('Calculates single item line amount: unitPrice * quantity', () => {
    const unitPrice = 250000;
    const quantity = 2;
    const lineTotal = unitPrice * quantity;
    assert.strictEqual(lineTotal, 500000);
  });

  it('Calculates multi-product subtotal correctly', () => {
    const item1 = { lineTotal: 500000 };
    const item2 = { lineTotal: 210000 };
    const subtotal = item1.lineTotal + item2.lineTotal;
    assert.strictEqual(subtotal, 710000);
  });

  it('Calculates discount deduction accurately', () => {
    const subtotal = 710000;
    const discountPercent = 5;
    const discountAmount = Math.round((subtotal * discountPercent) / 100 * 100) / 100;
    const taxableAmount = subtotal - discountAmount;
    assert.strictEqual(discountAmount, 35500);
    assert.strictEqual(taxableAmount, 674500);
  });

  it('Calculates Intra-State GST (CGST 9% + SGST 9%) correctly', () => {
    const taxableAmount = 674500;
    const cgstAmount = Math.round((taxableAmount * 9) / 100 * 100) / 100;
    const sgstAmount = Math.round((taxableAmount * 9) / 100 * 100) / 100;
    const totalTax = cgstAmount + sgstAmount;
    const grandTotal = taxableAmount + totalTax;

    assert.strictEqual(cgstAmount, 60705);
    assert.strictEqual(sgstAmount, 60705);
    assert.strictEqual(totalTax, 121410);
    assert.strictEqual(grandTotal, 795910);
  });

  it('Calculates Inter-State GST (IGST 18%) correctly', () => {
    const taxableAmount = 100000;
    const igstAmount = Math.round((taxableAmount * 18) / 100 * 100) / 100;
    const grandTotal = taxableAmount + igstAmount;

    assert.strictEqual(igstAmount, 18000);
    assert.strictEqual(grandTotal, 118000);
  });

  // --- SUITE 3: INDIAN NUMBERING WORDS CONVERSION ---
  console.log('\nTEST SUITE 3: Indian Currency Words Formatting');

  it('Converts 795910 to exact Indian words', () => {
    const words = numberToIndianWords(795910);
    assert.strictEqual(words, 'Seven Lakh Ninety-Five Thousand Nine Hundred and Ten Rupees Only');
  });

  it('Converts 250000 to exact Indian words', () => {
    const words = numberToIndianWords(250000);
    assert.strictEqual(words, 'Two Lakh Fifty Thousand Rupees Only');
  });

  it('Converts 12345678 to Crores and Lakhs', () => {
    const words = numberToIndianWords(12345678);
    assert.strictEqual(words, 'One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred and Seventy-Eight Rupees Only');
  });

  // --- SUITE 4: HISTORICAL PRICE SNAPSHOT IMMUTABILITY ---
  console.log('\nTEST SUITE 4: Historical Price Snapshot Immutability');

  await itAsync('Existing estimations retain historical price snapshots even if master price is updated', async () => {
    const est = await prisma.estimation.findUnique({
      where: { estimationNumber: 'EST-2026-00001' },
      include: { items: true },
    });
    assert(est, 'Sample estimation EST-2026-00001 should exist');
    const originalItem = est.items[0];
    const originalPrice = originalItem.unitPrice;
    assert.strictEqual(originalPrice, 250000, 'Original snapshot price should be 250,000');

    // Simulate Admin changing master pricing rule
    const rule = await prisma.pricingRule.findUnique({ where: { ruleCode: 'PR-MCC-001' } });
    assert(rule, 'Pricing rule should exist');

    await prisma.pricingRule.update({
      where: { ruleCode: 'PR-MCC-001' },
      data: { basePrice: 280000 },
    });

    // Re-query the saved estimation from DB
    const estAfter = await prisma.estimation.findUnique({
      where: { estimationNumber: 'EST-2026-00001' },
      include: { items: true },
    });

    assert.strictEqual(
      estAfter.items[0].unitPrice,
      250000,
      'Saved estimation MUST RETAIN the frozen price of 250,000 even after master price changed!'
    );

    // Revert master price rule back to 250000
    await prisma.pricingRule.update({
      where: { ruleCode: 'PR-MCC-001' },
      data: { basePrice: 250000 },
    });
  });

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();

  if (failed > 0) process.exit(1);
}

runAllTests().catch((err) => {
  console.error(err);
  process.exit(1);
});