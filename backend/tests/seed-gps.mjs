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

  // Set GPS coordinates on shipped/delivered orders for testing
  // Manufacturer origin: Bengaluru (12.9716, 77.5946)
  // Consumer destination: Mumbai (19.0760, 72.8777)
  // Current position: Somewhere mid-route (Hubli: 15.3647, 75.1240)

  const orders = await c.query(`SELECT id, status FROM "Order" ORDER BY "createdAt" DESC`);
  console.log(`Found ${orders.rows.length} orders`);

  for (const order of orders.rows) {
    await c.query(`UPDATE "Order" SET
      "originLat" = 12.9716, "originLng" = 77.5946,
      "destLat" = 19.0760, "destLng" = 72.8777,
      "currentLat" = 15.3647, "currentLng" = 75.1240,
      "trackingId" = $1
      WHERE id = $2`,
      [`DEM-${order.id.slice(0, 8).toUpperCase()}`, order.id]
    );
    console.log(`Updated order ${order.id} (${order.status}) with GPS + tracking ID`);
  }

  // Also set one order back to 'shipped' so we can see the live truck
  if (orders.rows.length > 0) {
    await c.query(`UPDATE "Order" SET status = 'shipped' WHERE id = $1`, [orders.rows[0].id]);
    console.log(`Set order ${orders.rows[0].id} to 'shipped' for live tracking demo`);
  }

  console.log('\n✅ GPS data set. Visit /consumer/tracking or /manufacturer/tracking to see the map.');
  c.release();
  await pool.end();
}

run().catch(e => console.error(e));
