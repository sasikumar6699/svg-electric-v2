import assert from 'assert';

const BASE_URL = 'http://127.0.0.1:3000';

async function run() {
  console.log('========================================================================');
  console.log('SVG ELECTRIC - SIMPLIFIED SCOPE & PRODUCT SPEC VERIFICATION');
  console.log('========================================================================\n');

  // 1. Authenticate as Admin
  console.log('1. Authenticating as Admin (admin@svgelectric.com)...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@svgelectric.com', password: 'Admin@12345' }),
  });
  assert.strictEqual(adminLoginRes.status, 200, 'Admin login should succeed');
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  console.log('   ✅ Admin logged in successfully.');

  // 2. Test File Upload API (PDF)
  console.log('\n2. Testing File Upload API (/api/upload)...');
  const pdfBlob = new Blob(['%PDF-1.4 mock technical datasheet content for testing'], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', pdfBlob, 'pcc-sync-datasheet.pdf');

  const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: { cookie: adminCookie },
    body: formData,
  });
  assert.strictEqual(uploadRes.status, 200, 'File upload should succeed');
  const uploadData = await uploadRes.json();
  assert.strictEqual(uploadData.fileType, 'PDF');
  assert.ok(uploadData.fileUrl.startsWith('/uploads/'));
  console.log(`   ✅ File uploaded successfully: ${uploadData.fileUrl} (${uploadData.fileType})`);

  // 3. Test Categories Fetch
  console.log('\n3. Fetching Product Categories...');
  const catRes = await fetch(`${BASE_URL}/api/admin/categories`, {
    headers: { cookie: adminCookie },
  });
  const catData = await catRes.json();
  const pccCat = catData.categories.find((c) => c.code === 'CAT-PCC') || catData.categories[0];
  console.log(`   ✅ Selected Category: ${pccCat.name} (${pccCat.id})`);

  // 4. Test Admin Product Creation with Specs, Price & Uploaded File
  console.log('\n4. Creating New Product Entry as Admin...');
  const testProductCode = 'TEST-PCC-1250A';
  const newProductPayload = {
    productCode: testProductCode,
    name: '1250A Intelligent Auto-Synchronizing PCC Panel',
    price: 580000,
    categoryId: pccCat.id,
    description: 'Main incoming switchboard with dual ACB bus-coupler, AMF synchronization and Form 4B segregation.',
    specifications: [
      { name: 'Rated Current', value: '1250A' },
      { name: 'Operating Voltage', value: '415V AC, 50Hz' },
      { name: 'Form of Separation', value: 'Form 4B Type 7' },
      { name: 'Ingress Protection', value: 'IP54 Dust & Splash Resistant' },
      { name: 'Busbar Material', value: 'Electrolytic Copper E91E Tinned' },
      { name: 'Short Circuit Rating', value: '50 kA for 1 sec' },
    ],
    fileUrl: uploadData.fileUrl,
    fileName: uploadData.fileName,
    fileType: uploadData.fileType,
    fileSize: uploadData.fileSize,
    active: true,
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie,
    },
    body: JSON.stringify(newProductPayload),
  });

  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 200, `Product creation failed: ${createData.error}`);
  assert.strictEqual(createData.product.productCode, testProductCode);
  assert.strictEqual(createData.product.price, 580000);
  assert.strictEqual(createData.product.specifications.length, 6);
  assert.strictEqual(createData.product.fileUrl, uploadData.fileUrl);
  console.log(`   ✅ Product created: ${createData.product.productCode} - ₹${createData.product.price}`);

  // 5. Authenticate as Sales User
  console.log('\n5. Authenticating as Sales User (sales@svgelectric.com)...');
  const salesLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@svgelectric.com', password: 'Sales@12345' }),
  });
  assert.strictEqual(salesLoginRes.status, 200, 'Sales login should succeed');
  const salesCookie = salesLoginRes.headers.get('set-cookie');
  console.log('   ✅ Sales logged in successfully.');

  // 6. Test Sales Search API with keyword
  console.log('\n6. Testing Sales Search API with keyword "1250A"...');
  const searchKeywordRes = await fetch(`${BASE_URL}/api/products/search?q=1250A`, {
    headers: { cookie: salesCookie },
  });
  const searchKeywordData = await searchKeywordRes.json();
  assert.strictEqual(searchKeywordRes.status, 200);
  const foundByKeyword = searchKeywordData.products.find((p) => p.productCode === testProductCode);
  assert.ok(foundByKeyword, 'Product should be found by keyword 1250A');
  assert.strictEqual(foundByKeyword.price, 580000, 'Final price should match ₹5,80,000');
  assert.strictEqual(foundByKeyword.specifications.length, 6);
  assert.strictEqual(foundByKeyword.fileUrl, uploadData.fileUrl);
  console.log(`   ✅ Search by keyword returned matching product with price ₹${foundByKeyword.price}`);

  // 7. Test Sales Search API with Specification filter
  console.log('\n7. Testing Sales Search API with Spec filter "Current Rating: 1250A"...');
  const searchSpecRes = await fetch(`${BASE_URL}/api/products/search?specName=Rated%20Current&specValue=1250A`, {
    headers: { cookie: salesCookie },
  });
  const searchSpecData = await searchSpecRes.json();
  assert.strictEqual(searchSpecRes.status, 200);
  const foundBySpec = searchSpecData.products.find((p) => p.productCode === testProductCode);
  assert.ok(foundBySpec, 'Product should be found by Rated Current: 1250A');
  console.log(`   ✅ Filter by spec successfully returned ${searchSpecData.products.length} product(s)`);

  // 8. Clean up test product
  console.log('\n8. Cleaning up test product...');
  const deleteRes = await fetch(`${BASE_URL}/api/admin/products?id=${createData.product.id}`, {
    method: 'DELETE',
    headers: { cookie: adminCookie },
  });
  assert.strictEqual(deleteRes.status, 200);
  console.log('   ✅ Test product cleaned up successfully.');

  console.log('\n========================================================================');
  console.log('ALL VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('========================================================================');
}

run().catch((e) => {
  console.error('\n❌ Verification failed:', e);
  process.exit(1);
});
