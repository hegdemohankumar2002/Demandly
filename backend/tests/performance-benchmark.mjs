/**
 * Demandly — Performance Benchmark
 * 
 * Runs performance tests against key API endpoints.
 * Run: node tests/performance-benchmark.mjs
 */

import fs from 'fs';

const BASE = 'http://localhost:5000/api/v1';
const MASTER_API_KEY = 'your-super-secret-master-api-key';

const ENDPOINTS = [
  { method: 'GET', path: '/../../lb-health', name: 'Health Check', auth: false },
  { method: 'GET', path: '/public/landing', name: 'Public Landing', auth: false },
  { method: 'POST', path: '/auth/login', name: 'Admin Login', auth: false, body: { email: 'admin@demandly.com', password: 'admin123' } },
];

const USER_CREDENTIALS = {
  admin: { email: 'admin@demandly.com', password: 'admin123' },
  consumer: { email: 'aarav@example.com', password: 'test123' },
  manufacturer: { email: 'rajesh@keralanaturals.com', password: 'test123' },
};

const ITERATIONS = 50;
const CONCURRENCY = 10;

async function request(method, path, body = null, headers = {}) {
  const url = `${BASE}${path}`;
  const reqHeaders = { 'Content-Type': 'application/json', 'x-api-key': MASTER_API_KEY, ...headers };
  
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const time = Date.now() - start;
    let data = null;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, ok: res.ok, time, data };
  } catch (err) {
    return { status: 0, ok: false, time: Date.now() - start, error: err.message };
  }
}

async function getToken(role) {
  const creds = USER_CREDENTIALS[role];
  const loginRes = await request('POST', '/auth/login', creds, false);
  if (loginRes.ok && loginRes.data.twoFactorRequired) {
    const verifyRes = await request('POST', '/auth/login/verify', { email: creds.email, code: '888888' }, false);
    if (verifyRes.ok) return verifyRes.data.token;
  } else if (loginRes.ok && loginRes.data.token) {
    return loginRes.data.token;
  }
  return null;
}

async function runBenchmark(endpoint, iterations) {
  const times = [];
  const errors = [];
  
  for (let i = 0; i < iterations; i++) {
    const result = await request(endpoint.method, endpoint.path, endpoint.body, endpoint.auth ? { Authorization: `Bearer ${endpoint.token}` } : {});
    if (result.ok) {
      times.push(result.time);
    } else {
      errors.push({ iteration: i, error: result.error || `HTTP ${result.status}` });
    }
  }
  
  times.sort((a, b) => a - b);
  
  return {
    name: endpoint.name,
    iterations,
    successful: times.length,
    failed: errors.length,
    min: times[0] || 0,
    max: times[times.length - 1] || 0,
    avg: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0,
    p50: times[Math.floor(times.length * 0.5)] || 0,
    p95: times[Math.floor(times.length * 0.95)] || 0,
    p99: times[Math.floor(times.length * 0.99)] || 0,
    errors: errors.slice(0, 5),
  };
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           DEMANDLY — PERFORMANCE BENCHMARK                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  console.log(`Configuration: ${ITERATIONS} iterations per endpoint\n`);
  
  // Get tokens for all roles
  console.log('🔐 Acquiring tokens for all roles...');
  const adminToken = await getToken('admin');
  const consumerToken = await getToken('consumer');
  const manufacturerToken = await getToken('manufacturer');
  
  if (!adminToken || !consumerToken || !manufacturerToken) {
    console.log('❌ Failed to acquire one or more tokens');
    console.log(`   Admin: ${adminToken ? '✅' : '❌'}`);
    console.log(`   Consumer: ${consumerToken ? '✅' : '❌'}`);
    console.log(`   Manufacturer: ${manufacturerToken ? '✅' : '❌'}`);
    process.exit(1);
  }
  console.log(`✅ All tokens acquired\n`);
  
  const authenticatedEndpoints = [
    { method: 'GET', path: '/admin/stats', name: 'Admin Stats', auth: true, token: adminToken },
    { method: 'GET', path: '/consumer/products', name: 'Consumer Products', auth: true, token: consumerToken },
    { method: 'GET', path: '/notifications', name: 'Notifications', auth: true, token: adminToken },
    { method: 'GET', path: '/manufacturer/bids', name: 'Manufacturer Bids', auth: true, token: manufacturerToken },
  ];
  
  const allEndpoints = [...ENDPOINTS, ...authenticatedEndpoints];
  const results = [];
  
  for (const endpoint of allEndpoints) {
    console.log(`🏃 Benchmarking: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    const result = await runBenchmark(endpoint, ITERATIONS);
    results.push(result);
    
    console.log(`   ✅ Successful: ${result.successful}/${result.iterations}`);
    console.log(`   ⏱  Avg: ${result.avg}ms | P50: ${result.p50}ms | P95: ${result.p95}ms | P99: ${result.p99}ms`);
    if (result.failed > 0) {
      console.log(`   ❌ Failed: ${result.failed}`);
      result.errors.forEach(e => console.log(`      - Iteration ${e.iteration}: ${e.error}`));
    }
    console.log('');
  }
  
  // Summary
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  
  console.log(`${'Endpoint'.padEnd(25)} ${'Avg (ms)'.padStart(10)} ${'P50 (ms)'.padStart(10)} ${'P95 (ms)'.padStart(10)} ${'P99 (ms)'.padStart(10)} ${'Success'.padStart(10)}`);
  console.log('─'.repeat(80));
  
  results.forEach(r => {
    console.log(
      `${r.name.padEnd(25)} ${String(r.avg).padStart(10)} ${String(r.p50).padStart(10)} ${String(r.p95).padStart(10)} ${String(r.p99).padStart(10)} ${`${r.successful}/${r.iterations}`.padStart(10)}`
    );
  });
  
  const totalRequests = results.reduce((sum, r) => sum + r.iterations, 0);
  const totalSuccessful = results.reduce((sum, r) => sum + r.successful, 0);
  const overallAvg = totalSuccessful > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.avg * r.successful, 0) / totalSuccessful)
    : 0;
  
  console.log('\n' + '─'.repeat(80));
  console.log(`Total Requests: ${totalRequests} | Successful: ${totalSuccessful} | Success Rate: ${((totalSuccessful/totalRequests)*100).toFixed(1)}%`);
  console.log(`Overall Average Latency: ${overallAvg}ms`);
  
  // Write report
  const report = {
    timestamp: new Date().toISOString(),
    config: { iterations: ITERATIONS, concurrency: CONCURRENCY },
    summary: { totalRequests, totalSuccessful, successRate: (totalSuccessful/totalRequests)*100, overallAvg },
    results,
  };
  
  fs.writeFileSync('tests/performance-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Performance report saved to: tests/performance-report.json\n');
}

run().catch(console.error);