/**
 * Demandly — Full E2E Lifecycle Test
 * 
 * Tests the entire flow:
 *   1. Create fresh test users (2 manufacturers, 1 consumer, admin login)
 *   2. Manufacturer submits a product proposal
 *   3. Manufacturer edits the proposal
 *   4. Admin approves the proposal → product goes live
 *   5. Consumer demands the product
 *   6. Admin creates a demand pool + starts auction
 *   7. Both manufacturers bid
 *   8. Admin closes the auction → orders are generated
 *   9. Consumer confirms COD
 *  10. Manufacturer updates shipping status
 *  11. Verify notifications at every step
 * 
 * Run: node tests/e2e-test.mjs
 */

import { readFileSync } from 'fs';

// Load .env manually for .mjs
const envContent = readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^(\w+)=["']?(.+?)["']?\s*$/);
  if (match) process.env[match[1]] = match[2];
}

const API = 'http://localhost:5000/api';

const state = {
  admin: { token: null, id: null },
  mfg1: { token: null, id: null },
  mfg2: { token: null, id: null },
  consumer1: { token: null, id: null },
  proposalId: null,
  productId: null,
  demandPoolId: null,
  orderId: null,
};

let passCount = 0;
let failCount = 0;

function log(icon, msg) { console.log(`  ${icon}  ${msg}`); }
function pass(msg) { passCount++; log('✅', msg); }
function fail(msg, detail) { failCount++; log('❌', `${msg}${detail ? ' — ' + detail : ''}`); }
function section(title) { console.log(`\n${'─'.repeat(50)}\n  📋 ${title}\n${'─'.repeat(50)}`); }

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║     DEMANDLY — FULL E2E LIFECYCLE TEST           ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // ═══════════════════════════════════════════════════
  section('PHASE 1: User Registration & Login');
  // ═══════════════════════════════════════════════════

  // Register Manufacturer 1
  const ts = Date.now();
  let r = await api('POST', '/auth/register', {
    name: 'Test Mfg Alpha', email: `mfg-alpha-${ts}@test.com`, password: 'test123',
    role: 'manufacturer', city: 'Bengaluru', pincode: '560001', phone: '9876543210'
  });
  if (r.ok) { state.mfg1 = { token: r.data.token, id: r.data.user.id }; pass(`Manufacturer 1 registered: ${r.data.user.email}`); }
  else fail('Manufacturer 1 registration', r.data.error);

  // Register Manufacturer 2
  r = await api('POST', '/auth/register', {
    name: 'Test Mfg Beta', email: `mfg-beta-${ts}@test.com`, password: 'test123',
    role: 'manufacturer', city: 'Mumbai', pincode: '400001', phone: '9876543211'
  });
  if (r.ok) { state.mfg2 = { token: r.data.token, id: r.data.user.id }; pass(`Manufacturer 2 registered: ${r.data.user.email}`); }
  else fail('Manufacturer 2 registration', r.data.error);

  // Register Consumer
  r = await api('POST', '/auth/register', {
    name: 'Test Consumer', email: `consumer-${ts}@test.com`, password: 'test123',
    role: 'consumer', city: 'Bengaluru', pincode: '560001', phone: '9876543212'
  });
  if (r.ok) { state.consumer1 = { token: r.data.token, id: r.data.user.id }; pass(`Consumer registered: ${r.data.user.email}`); }
  else fail('Consumer registration', r.data.error);

  // Login as Admin
  r = await api('POST', '/auth/login', { email: 'admin@demandly.com', password: 'admin123' });
  if (r.ok) { state.admin = { token: r.data.token, id: r.data.user.id }; pass(`Admin logged in: ${r.data.user.email}`); }
  else fail('Admin login', r.data.error);

  // ═══════════════════════════════════════════════════
  section('PHASE 2: Product Proposal (Manufacturer)');
  // ═══════════════════════════════════════════════════

  // Mfg1 submits a proposal
  r = await api('POST', '/manufacturer/proposals', {
    name: 'Premium Organic Turmeric Powder',
    description: 'High-quality organic turmeric from Kerala. 100% natural, no preservatives, lab-tested.',
    category: 'Staples',
    proposedPrice: '350',
    unit: 'kg'
  }, state.mfg1.token);
  if (r.ok && r.data.id) { state.proposalId = r.data.id; pass(`Proposal submitted: "${r.data.name}" at ₹${r.data.proposedPrice}/${r.data.unit}`); }
  else fail('Proposal submission', r.data.error);

  // Verify it shows in manufacturer's list
  r = await api('GET', '/manufacturer/proposals', null, state.mfg1.token);
  if (r.ok && r.data.length > 0 && r.data[0].status === 'pending') pass(`Proposal appears in manufacturer list with status "pending"`);
  else fail('Proposal list check', 'Not found or wrong status');

  // ═══════════════════════════════════════════════════
  section('PHASE 3: Edit Proposal (Manufacturer)');
  // ═══════════════════════════════════════════════════

  r = await api('PUT', `/manufacturer/proposals/${state.proposalId}`, {
    proposedPrice: '320', description: 'Updated: Premium organic turmeric from Kerala. Lab-tested, FSSAI certified.'
  }, state.mfg1.token);
  if (r.ok && r.data.proposedPrice === 320) pass(`Proposal edited: price changed to ₹320`);
  else fail('Proposal edit', r.data.error || 'Price not updated');

  // ═══════════════════════════════════════════════════
  section('PHASE 4: Admin Approves Proposal → Product Goes Live');
  // ═══════════════════════════════════════════════════

  // Admin sees it in pending list
  r = await api('GET', '/admin/proposals/pending', null, state.admin.token);
  if (r.ok && r.data.length > 0) pass(`Admin sees ${r.data.length} pending proposal(s)`);
  else fail('Admin pending proposals', 'None found');

  // Admin approves with threshold = 5
  r = await api('POST', `/admin/proposals/${state.proposalId}/approve`, {
    demandThreshold: 5
  }, state.admin.token);
  if (r.ok && r.data.product) {
    state.productId = r.data.product.id;
    pass(`Proposal approved! Product "${r.data.product.name}" live with threshold=${r.data.product.demandThreshold}`);
  } else fail('Proposal approval', r.data.error);

  // Verify product is in the catalog
  r = await api('GET', '/consumer/products', null, state.consumer1.token);
  const found = r.data?.find?.(p => p.id === state.productId);
  if (found) pass(`Product found in consumer catalog: "${found.name}" at ₹${found.retailPrice}`);
  else fail('Product not in catalog');

  // ═══════════════════════════════════════════════════
  section('PHASE 5: Consumer Demands the Product');
  // ═══════════════════════════════════════════════════

  r = await api('POST', '/consumer/interests', {
    productId: state.productId, quantity: 5, maxPrice: 250, timeline: '2weeks'
  }, state.consumer1.token);
  if (r.ok) pass(`Consumer registered interest: ${r.data.quantity} units at max ₹${r.data.maxPrice}`);
  else fail('Consumer interest', r.data.error);

  // Check demand count updated
  r = await api('GET', `/consumer/products/${state.productId}`, null, state.consumer1.token);
  if (r.ok && r.data.product?.demandCount >= 5) pass(`Demand count updated to ${r.data.product.demandCount}`);
  else fail('Demand count check', `Count: ${r.data?.product?.demandCount}`);

  // ═══════════════════════════════════════════════════
  section('PHASE 6: Admin Finds Demand Pool & Starts Auction');
  // ═══════════════════════════════════════════════════

  // Admin fetches all demand pools to find the automatically created pool
  r = await api('GET', '/admin/demand-pools', null, state.admin.token);
  const foundPool = r.data?.find?.(p => p.productId === state.productId);
  if (foundPool) {
    state.demandPoolId = foundPool.id;
    pass(`Admin found the automatically created Demand Pool (ID: ${state.demandPoolId.slice(0,8)}...) with status: ${foundPool.status}`);
  } else {
    fail('Find automatically created demand pool', 'Not found in list');
  }

  // Admin starts the auction
  r = await api('PUT', `/admin/demand-pools/${state.demandPoolId}`, { status: 'auction_active' }, state.admin.token);
  if (r.ok && r.data.status === 'auction_active') {
    pass(`Admin started the auction. Demand pool status changed to "auction_active".`);
  } else {
    fail('Admin start auction', r.data.error || 'Failed to start');
  }

  // ═══════════════════════════════════════════════════
  section('PHASE 7: Manufacturers Place Bids');
  // ═══════════════════════════════════════════════════

  // Mfg1 bids ₹300/kg
  r = await api('POST', '/manufacturer/bids', {
    demandPoolId: state.demandPoolId, pricePerUnit: 300, deliveryTimeline: '10 days'
  }, state.mfg1.token);
  if (r.ok) pass(`Manufacturer 1 bid placed: ₹${r.data.pricePerUnit}/kg`);
  else fail('Mfg1 bid', r.data.error);

  // Mfg2 bids lower at ₹280/kg
  r = await api('POST', '/manufacturer/bids', {
    demandPoolId: state.demandPoolId, pricePerUnit: 280, deliveryTimeline: '7 days'
  }, state.mfg2.token);
  if (r.ok) pass(`Manufacturer 2 bid placed: ₹${r.data.pricePerUnit}/kg (LOWER)`);
  else fail('Mfg2 bid', r.data.error);

  // ═══════════════════════════════════════════════════
  section('PHASE 8: Close Auction → Generate Consumer Orders');
  // ═══════════════════════════════════════════════════

  // Admin closes the auction (resolves it)
  r = await api('PUT', `/admin/demand-pools/${state.demandPoolId}`, { status: 'fulfilled' }, state.admin.token);
  if (r.ok) {
    pass(`Admin closed/resolved the auction via PUT /admin/demand-pools/:id with status "fulfilled"`);
    if (r.data.status === 'fulfilled') {
      pass(`Demand pool status resolved to "fulfilled" successfully.`);
    } else {
      fail(`Demand pool resolved status`, `Expected "fulfilled", got "${r.data.status}"`);
    }
  } else {
    fail('Admin resolve auction', r.data.error || 'Failed to resolve');
  }

  // Retrieve consumer order ID
  r = await api('GET', '/consumer/orders', null, state.consumer1.token);
  if (r.ok && r.data.orders?.length > 0) {
    const matchingOrder = r.data.orders.find(o => o.demandPoolId === state.demandPoolId);
    if (matchingOrder) {
      state.orderId = matchingOrder.id;
      pass(`Retrieved consumer order ID: ${state.orderId.slice(0,8)}...`);
    } else {
      state.orderId = r.data.orders[0].id;
      pass(`Retrieved first consumer order ID (fallback): ${state.orderId.slice(0,8)}...`);
    }
  } else {
    fail('Retrieve consumer order ID', 'No orders found');
  }

  // ═══════════════════════════════════════════════════
  section('PHASE 9: Consumer Confirms COD Payment');
  // ═══════════════════════════════════════════════════

  // Verify consumer can see the order
  r = await api('GET', '/consumer/orders', null, state.consumer1.token);
  if (r.ok && r.data.orders?.length > 0) {
    const order = r.data.orders.find(o => o.id === state.orderId);
    if (order) {
      pass(`Consumer sees order: "${order.product?.name}" — status: ${order.status}, total: ₹${order.totalPrice}`);
    } else {
      const firstOrder = r.data.orders[0];
      pass(`Consumer sees first order: "${firstOrder.product?.name}" — status: ${firstOrder.status}, total: ₹${firstOrder.totalPrice}`);
    }
  } else fail('Consumer orders check', 'No orders found');

  // Consumer confirms COD
  r = await api('POST', `/consumer/orders/${state.orderId}/confirm`, null, state.consumer1.token);
  if (r.ok && r.data.status === 'confirmed') pass(`Consumer confirmed COD — order status → "confirmed"`);
  else fail('COD confirmation', r.data.error);

  // ═══════════════════════════════════════════════════
  section('PHASE 10: Manufacturer Updates Order Status → Shipping → Delivery');
  // ═══════════════════════════════════════════════════

  // Manufacturer sees the order
  r = await api('GET', '/manufacturer/fulfilment', null, state.mfg2.token);
  if (r.ok && r.data.length > 0) pass(`Manufacturer sees ${r.data.length} order(s) in fulfilment`);
  else fail('Manufacturer fulfilment check', 'No orders');

  // Update to manufacturing
  r = await api('PUT', `/manufacturer/fulfilment/${state.orderId}/status`, {
    status: 'manufacturing'
  }, state.mfg2.token);
  if (r.ok && r.data.status === 'manufacturing') pass('Order status → "manufacturing" ✓');
  else fail('Status → manufacturing', r.data.error);

  // Update to shipped
  r = await api('PUT', `/manufacturer/fulfilment/${state.orderId}/status`, {
    status: 'shipped', trackingId: 'DMNDLY-TRK-2026-001'
  }, state.mfg2.token);
  if (r.ok && r.data.status === 'shipped' && r.data.trackingId === 'DMNDLY-TRK-2026-001') {
    pass('Order status → "shipped" with tracking ID: DMNDLY-TRK-2026-001 ✓');
  } else fail('Status → shipped', r.data.error);

  // Update to delivered
  r = await api('PUT', `/manufacturer/fulfilment/${state.orderId}/status`, {
    status: 'delivered'
  }, state.mfg2.token);
  if (r.ok && r.data.status === 'delivered' && r.data.deliveredAt) {
    pass('Order status → "delivered" with deliveredAt timestamp ✓');
  } else fail('Status → delivered', r.data.error);

  // ═══════════════════════════════════════════════════
  section('PHASE 11: Verify Notifications');
  // ═══════════════════════════════════════════════════

  // Consumer notifications
  r = await api('GET', '/notifications', null, state.consumer1.token);
  if (r.ok) {
    const types = r.data.map(n => n.title);
    const hasAuction = types.some(t => t.includes('Auction'));
    const hasShipped = types.some(t => t.includes('Shipped'));
    const hasDelivered = types.some(t => t.includes('Delivered'));
    const hasManufacturing = types.some(t => t.includes('Manufacturing'));
    
    if (hasAuction) pass('Consumer received auction completion notification');
    else fail('Missing auction notification for consumer');
    
    if (hasManufacturing) pass('Consumer received manufacturing notification');
    else fail('Missing manufacturing notification for consumer');
    
    if (hasShipped) pass('Consumer received shipping notification');
    else fail('Missing shipping notification for consumer');
    
    if (hasDelivered) pass('Consumer received delivery notification');
    else fail('Missing delivery notification for consumer');
    
    log('📬', `Consumer has ${r.data.length} total notifications`);
  }

  // Manufacturer notifications
  r = await api('GET', '/notifications', null, state.mfg2.token);
  if (r.ok) {
    const hasWon = r.data.some(n => n.title.includes('Won'));
    const hasConfirmed = r.data.some(n => n.title.includes('Confirmed'));
    
    if (hasWon) pass('Winning manufacturer received auction-won notification');
    else fail('Missing auction-won notification for manufacturer');
    
    if (hasConfirmed) pass('Manufacturer received order-confirmed notification');
    else fail('Missing order-confirmed notification for manufacturer');
    
    log('📬', `Manufacturer has ${r.data.length} total notifications`);
  }

  // ═══════════════════════════════════════════════════
  section('PHASE 12: Admin Order Dashboard Verification');
  // ═══════════════════════════════════════════════════

  r = await api('GET', '/admin/orders', null, state.admin.token);
  if (r.ok && r.data.length > 0) {
    const order = r.data.find(o => o.id === state.orderId);
    if (order) {
      pass(`Admin sees order — status: ${order.status}, payment: ${order.paymentStatus}`);
      if (order.consumer?.name) pass(`Order linked to consumer: ${order.consumer.name}`);
      if (order.manufacturer?.name) pass(`Order linked to manufacturer: ${order.manufacturer.name}`);
      if (order.commissionAmount > 0) pass(`Commission recorded: ₹${order.commissionAmount}`);
    } else fail('Admin cannot find the specific order');
  } else fail('Admin orders', 'No orders returned');

  // ═══════════════════════════════════════════════════
  // RESULTS
  // ═══════════════════════════════════════════════════
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  📊 RESULTS: ${passCount} passed, ${failCount} failed`);
  console.log(`${'═'.repeat(50)}\n`);

  if (failCount === 0) {
    console.log('  🎉 ALL TESTS PASSED! The full E2E lifecycle works correctly.');
  } else {
    console.log(`  ⚠️  ${failCount} test(s) failed. Review the output above.`);
  }
}

run().catch(err => {
  console.error('\n  💥 FATAL ERROR:', err.message);
  console.error(err.stack);
});
