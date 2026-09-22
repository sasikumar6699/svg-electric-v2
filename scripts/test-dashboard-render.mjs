const BASE_URL = 'http://127.0.0.1:3000';

async function main() {
  console.log('Testing /dashboard page rendering for both Admin and Sales...');

  // Wait for server ready
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/settings`);
      if (res.status === 200 || res.status === 401) break;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // 1. Test Admin Dashboard
  console.log('1. Testing Admin Dashboard render...');
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@svgelectric.com', password: 'Admin@12345' }),
  });
  if (!adminLogin.ok) throw new Error('Admin login failed');
  const adminCookie = adminLogin.headers.get('set-cookie');

  const adminDash = await fetch(`${BASE_URL}/dashboard`, {
    headers: { cookie: adminCookie || '' },
  });
  console.log(`   Admin /dashboard status: ${adminDash.status}`);
  if (adminDash.status !== 200) {
    const text = await adminDash.text();
    console.error('Admin dash error snippet:', text.slice(0, 500));
    throw new Error('Admin /dashboard failed with status ' + adminDash.status);
  }
  console.log('   ✅ Admin dashboard rendered with 200 OK!');

  // 2. Test Sales Dashboard
  console.log('2. Testing Sales Dashboard render...');
  const salesLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'sales@svgelectric.com', password: 'Sales@12345' }),
  });
  if (!salesLogin.ok) throw new Error('Sales login failed');
  const salesCookie = salesLogin.headers.get('set-cookie');

  const salesDash = await fetch(`${BASE_URL}/dashboard`, {
    headers: { cookie: salesCookie || '' },
  });
  console.log(`   Sales /dashboard status: ${salesDash.status}`);
  if (salesDash.status !== 200) {
    const text = await salesDash.text();
    console.error('Sales dash error snippet:', text.slice(0, 500));
    throw new Error('Sales /dashboard failed with status ' + salesDash.status);
  }
  console.log('   ✅ Sales dashboard rendered with 200 OK!');

  console.log('\n🎉 ALL DASHBOARD RENDERING CHECKS PASSED PERFECTLY!\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
