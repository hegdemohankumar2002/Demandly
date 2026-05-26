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

  // Find the latest Turmeric product
  const prod = await c.query(
    `SELECT id FROM "Product" WHERE name LIKE '%Turmeric%' ORDER BY "createdAt" DESC LIMIT 1`
  );
  const productId = prod.rows[0]?.id;
  if (!productId) { console.log('No product found'); c.release(); await pool.end(); return; }
  console.log('Product ID:', productId);

  // Create a demand pool in auction_active status
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + 60); // 1 hour from now
  const dpResult = await c.query(
    `INSERT INTO "DemandPool" (id, "productId", "totalDemand", threshold, geography, pincode, deadline, status, "averageMaxPrice", "bidsCount", "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), $1, 3, 3, 'Bengaluru', '560001', $2, 'auction_active', 350, 0, NOW(), NOW())
     RETURNING id`,
    [productId, deadline.toISOString()]
  );
  const demandPoolId = dpResult.rows[0].id;
  console.log('Demand Pool ID:', demandPoolId);
  console.log('Status: auction_active');
  console.log('Done! Manufacturers can now bid on this pool.');

  c.release();
  await pool.end();
}

run().catch(e => console.error(e));
