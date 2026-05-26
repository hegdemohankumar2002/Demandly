import { readFileSync } from 'fs';
import pg from 'pg';
import { createHash } from 'crypto';

const env = readFileSync('.env', 'utf-8');
for (const l of env.split('\n')) {
  const m = l.match(/^(\w+)=["']?(.+?)["']?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const c = await pool.connect();

  // Find manufacturer who owns the shipped order
  const orderRes = await c.query(`SELECT o.id, o.status, o."manufacturerId", o."consumerId", m.email as mfg_email, co.email as consumer_email FROM "Order" o JOIN "User" m ON o."manufacturerId" = m.id JOIN "User" co ON o."consumerId" = co.id ORDER BY o."createdAt" DESC`);
  
  console.log('Orders:');
  for (const o of orderRes.rows) {
    console.log(`  ${o.id} — status: ${o.status} — mfg: ${o.mfg_email} — consumer: ${o.consumer_email}`);
  }

  // Create a fresh known-good manufacturer account  
  const bcrypt = await import('bcryptjs');
  const hashed = await bcrypt.hash('tracking123', 10);
  
  // Reset password for the manufacturer who owns the order
  if (orderRes.rows.length > 0) {
    const mfgId = orderRes.rows[0].manufacturerId;
    const consumerId = orderRes.rows[0].consumerId;
    
    await c.query(`UPDATE "User" SET password = $1 WHERE id = $2`, [hashed, mfgId]);
    console.log(`\nReset password for manufacturer ${orderRes.rows[0].mfg_email} → tracking123`);
    
    await c.query(`UPDATE "User" SET password = $1 WHERE id = $2`, [hashed, consumerId]);
    console.log(`Reset password for consumer ${orderRes.rows[0].consumer_email} → tracking123`);
  }
  
  c.release();
  await pool.end();
}

run().catch(e => console.error(e));
