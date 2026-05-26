import { readFileSync } from 'fs';
import pg from 'pg';

const env = readFileSync('.env', 'utf-8');
for (const l of env.split('\n')) {
  const m = l.match(/^(\w+)=["']?(.+?)["']?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const c = await pool.connect();

  // Find the active demand pool
  const dpRes = await c.query(`SELECT dp.*, p.name as product_name, p.unit FROM "DemandPool" dp JOIN "Product" p ON dp."productId" = p.id WHERE dp.status = 'auction_active' ORDER BY dp."createdAt" DESC LIMIT 1`);
  if (dpRes.rows.length === 0) { console.log('No active demand pool found'); c.release(); await pool.end(); return; }
  const dp = dpRes.rows[0];
  console.log(`Pool: ${dp.id} — "${dp.product_name}"`);

  // Get bids ordered by price (lowest first = winner)
  const bidsRes = await c.query(`SELECT * FROM "Bid" WHERE "demandPoolId" = $1 ORDER BY "pricePerUnit" ASC`, [dp.id]);
  if (bidsRes.rows.length === 0) { console.log('No bids found'); c.release(); await pool.end(); return; }
  console.log(`Bids: ${bidsRes.rows.length}`);

  const winner = bidsRes.rows[0];
  console.log(`Winner: manufacturer ${winner.manufacturerId} at ₹${winner.pricePerUnit}`);

  // Mark bid statuses
  await c.query(`UPDATE "Bid" SET status = 'won' WHERE id = $1`, [winner.id]);
  for (const bid of bidsRes.rows.slice(1)) {
    await c.query(`UPDATE "Bid" SET status = 'lost' WHERE id = $1`, [bid.id]);
  }

  // Find consumers who registered interest for this product
  const interests = await c.query(
    `SELECT * FROM "Interest" WHERE "productId" = $1 AND status IN ('aggregating', 'auction_active', 'pending')`,
    [dp.productId]
  );
  console.log(`Consumer interests: ${interests.rows.length}`);

  const estDelivery = new Date();
  estDelivery.setDate(estDelivery.getDate() + 14);

  // Create orders for each consumer
  for (const interest of interests.rows) {
    const total = winner.pricePerUnit * interest.quantity;
    const commission = total * 0.05;

    await c.query(
      `INSERT INTO "Order" (id, "consumerId", "productId", "manufacturerId", "demandPoolId", quantity, "pricePerUnit", "totalPrice", "commissionAmount", status, "paymentMethod", "paymentStatus", "estimatedDelivery", "orderedAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'pending_payment', 'cod', 'pending', $9, NOW(), NOW(), NOW())`,
      [interest.userId, dp.productId, winner.manufacturerId, dp.id, interest.quantity, winner.pricePerUnit, total, commission, estDelivery.toISOString()]
    );

    // Send notification to consumer
    await c.query(
      `INSERT INTO "Notification" (id, "userId", type, title, message, "actionUrl", "createdAt")
       VALUES (gen_random_uuid(), $1, 'auction_closed', '🎉 Auction Complete! Confirm Your Order', $2, '/consumer/orders', NOW())`,
      [interest.userId, `"${dp.product_name}" secured at ₹${winner.pricePerUnit}/${dp.unit}. Your ${interest.quantity} units total ₹${total}. Confirm payment.`]
    );
    console.log(`Created order for consumer ${interest.userId}: ${interest.quantity} units × ₹${winner.pricePerUnit} = ₹${total}`);
  }

  // Notify the winning manufacturer
  await c.query(
    `INSERT INTO "Notification" (id, "userId", type, title, message, "actionUrl", "createdAt")
     VALUES (gen_random_uuid(), $1, 'auction_closed', '🎉 You Won the Auction!', $2, '/manufacturer/orders', NOW())`,
    [winner.manufacturerId, `Your bid of ₹${winner.pricePerUnit}/${dp.unit} for "${dp.product_name}" won! ${interests.rows.length} orders to fulfil.`]
  );

  // Update pool + interests
  await c.query(`UPDATE "DemandPool" SET status = 'fulfilled', "bestBidPrice" = $1, "updatedAt" = NOW() WHERE id = $2`, [winner.pricePerUnit, dp.id]);
  await c.query(`UPDATE "Interest" SET status = 'fulfilled', "updatedAt" = NOW() WHERE "productId" = $1 AND status IN ('aggregating', 'auction_active', 'pending')`, [dp.productId]);

  console.log('\n✅ Auction closed! Orders created. Consumer can now confirm COD on the Orders page.');
  c.release();
  await pool.end();
}

run().catch(e => console.error(e));
