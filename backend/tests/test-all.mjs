/**
 * Demandly — Full Platform Test Suite
 * 
 * Run: node tests/test-all.mjs
 * 
 * Tests all API endpoints, logs results to tests/test-report.json
 * and prints a summary table to the console.
 */

import fs from 'fs';

const BASE = 'http://localhost:5000/api';
let token = '';
const results = [];

async function request(method, path, body = null, useToken = true) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (useToken && token) headers['Authorization'] = `Bearer ${token}`;

  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const time = Date.now() - start;
    let data = null;
    try { data = await res.json(); } catch { data = null; }

    const result = {
      endpoint: `${method} ${path}`,
      method,
      status: res.status,
      ok: res.ok,
      time,
      error: res.ok ? undefined : (data?.error || `HTTP ${res.status}`),
    };
    results.push(result);

    const icon = res.ok ? '✅' : '❌';
    const timeStr = `${time}ms`.padStart(6);
    console.log(`  ${icon} ${method.padEnd(6)} ${path.padEnd(45)} ${String(res.status).padEnd(5)} ${timeStr}${result.error ? `  ⚠ ${result.error}` : ''}`);

    return { status: res.status, data, ok: res.ok };
  } catch (err) {
    const time = Date.now() - start;
    const result = {
      endpoint: `${method} ${path}`,
      method,
      status: 0,
      ok: false,
      time,
      error: err.message || 'Network error',
    };
    results.push(result);
    console.log(`  ❌ ${method.padEnd(6)} ${path.padEnd(45)} ERR   ${`${time}ms`.padStart(6)}  ⚠ ${result.error}`);
    return { status: 0, data: null, ok: false };
  }
}

async function runTests() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║              DEMANDLY — FULL PLATFORM TEST SUITE                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  // ─── 1. Health Check ───
  console.log('🏥 HEALTH CHECK');
  await request('GET', '/../lb-health', null, false);

  // ─── 2. Auth ───
  console.log('\n🔐 AUTH');
  const loginRes = await request('POST', '/auth/login', { email: 'admin@demandly.com', password: 'admin123' }, false);
  if (loginRes.ok && loginRes.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: 'admin@demandly.com', code: '888888' }, false);
    if (verifyRes.ok) {
      token = verifyRes.data.token;
      console.log(`     → Token acquired: ${token.slice(0, 20)}...`);
    } else {
      console.log('     ⚠ 2FA verification failed');
    }
  } else if (loginRes.ok && loginRes.data.token) {
    token = loginRes.data.token;
    console.log(`     → Token acquired directly: ${token.slice(0, 20)}...`);
  } else {
    console.log('     ⚠ Login failed — subsequent authenticated tests will fail');
  }

  // Test registration with unique email
  await request('POST', '/auth/register', { name: 'Test User', email: `test-${Date.now()}@demo.com`, password: 'test123', role: 'consumer' }, false);

  // ─── 3. Admin Routes ───
  console.log('\n👑 ADMIN ROUTES');
  await request('GET', '/admin/stats');
  await request('GET', '/admin/verifications/pending');
  await request('GET', '/admin/users');
  await request('GET', '/admin/demand-pools');
  await request('GET', '/admin/settings');
  await request('PUT', '/admin/settings', { commissionPercent: 5.0 });

  // ─── 4. Consumer Routes ───
  console.log('\n🛒 CONSUMER ROUTES');
  const consumerLogin = await request('POST', '/auth/login', { email: 'aarav@example.com', password: 'test123' }, false);
  if (consumerLogin.ok && consumerLogin.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: 'aarav@example.com', code: '888888' }, false);
    if (verifyRes.ok) token = verifyRes.data.token;
  } else if (consumerLogin.ok && consumerLogin.data.token) {
    token = consumerLogin.data.token;
  }
  await request('GET', '/consumer/stats');
  await request('GET', '/consumer/interests');
  await request('GET', '/consumer/products');
  const productsRes = await request('GET', '/consumer/products');
  let productId = '';
  if (productsRes.ok && productsRes.data?.length > 0) {
    productId = productsRes.data[0].id;
    await request('GET', `/consumer/products/${productId}`);
  }
  await request('GET', '/consumer/demand-pools/active');
  await request('GET', '/consumer/orders');
  await request('GET', '/consumer/subscriptions');
  await request('GET', '/consumer/flash-events');
  await request('GET', '/consumer/campaigns');

  // ─── 5. Manufacturer Routes (login as manufacturer) ───
  console.log('\n🏭 MANUFACTURER ROUTES');
  const mfgLogin = await request('POST', '/auth/login', { email: 'rajesh@keralanaturals.com', password: 'test123' }, false);
  if (mfgLogin.ok && mfgLogin.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: 'rajesh@keralanaturals.com', code: '888888' }, false);
    if (verifyRes.ok) {
      token = verifyRes.data.token;
      console.log('     → Manufacturer token acquired via 2FA');
    } else {
      console.log('     ⚠ Manufacturer 2FA verification failed');
    }
  } else if (mfgLogin.ok && mfgLogin.data.token) {
    token = mfgLogin.data.token;
    console.log('     → Manufacturer token acquired directly');
  } else {
    console.log('     ⚠ Manufacturer login failed — using admin token');
  }

  await request('GET', '/manufacturer/stats');
  await request('GET', '/manufacturer/bids');
  await request('GET', '/manufacturer/demand-pools/active');
  await request('GET', '/manufacturer/demand-pools');
  await request('GET', '/manufacturer/profile');
  await request('GET', '/manufacturer/fulfilment');
  await request('GET', '/manufacturer/analytics');

  // ─── 6. Notification Routes ───
  console.log('\n🔔 NOTIFICATION ROUTES');
  const adminRelogin = await request('POST', '/auth/login', { email: 'admin@demandly.com', password: 'admin123' }, false);
  if (adminRelogin.ok && adminRelogin.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: 'admin@demandly.com', code: '888888' }, false);
    if (verifyRes.ok) token = verifyRes.data.token;
  } else if (adminRelogin.ok && adminRelogin.data.token) {
    token = adminRelogin.data.token;
  }

  await request('GET', '/notifications');
  await request('GET', '/notifications/unread-count');
  await request('PUT', '/notifications/mark-all-read');

  // ─── 7. Payment Routes ───
  console.log('\n💰 PAYMENT ROUTES');
  const consumerRelogin = await request('POST', '/auth/login', { email: 'aarav@example.com', password: 'test123' }, false);
  if (consumerRelogin.ok && consumerRelogin.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: 'aarav@example.com', code: '888888' }, false);
    if (verifyRes.ok) token = verifyRes.data.token;
  } else if (consumerRelogin.ok && consumerRelogin.data.token) {
    token = consumerRelogin.data.token;
  }
  await request('GET', '/payment/status/o1');
  await request('POST', '/payment/create-order', { orderId: 'o1' });

  // ─── 8. Public Routes ───
  console.log('\n🌐 PUBLIC ROUTES');
  await request('GET', '/public/landing', null, false);

  // ─── SUMMARY ───
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║                          TEST SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  const total = results.length;
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.time, 0) / total);

  console.log(`  Total:    ${total} endpoints tested`);
  console.log(`  Passed:   ${passed} ✅`);
  console.log(`  Failed:   ${failed} ❌`);
  console.log(`  Avg Time: ${avgTime}ms`);
  console.log(`  Score:    ${Math.round((passed / total) * 100)}%\n`);

  if (failed > 0) {
    console.log('  ─── FAILURES ───');
    results.filter(r => !r.ok).forEach(r => {
      console.log(`  ❌ ${r.endpoint} → ${r.error}`);
    });
    console.log('');
  }

  // Write full report
  const report = {
    timestamp: new Date().toISOString(),
    summary: { total, passed, failed, avgTime, score: `${Math.round((passed / total) * 100)}%` },
    results,
    failures: results.filter(r => !r.ok),
  };
  fs.writeFileSync('tests/test-report.json', JSON.stringify(report, null, 2));
  console.log(`  📄 Full report saved to: tests/test-report.json\n`);
}

runTests().catch(console.error);
