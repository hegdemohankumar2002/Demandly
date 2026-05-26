/**
 * Demandly — Database Reset Script
 * 
 * Wipes ALL data from every table. Clean slate.
 * Run: node tests/reset-db.mjs
 */

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Use raw SQL for a clean wipe — Prisma adapter not needed
async function resetDatabase() {
  const client = await pool.connect();
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║       DEMANDLY — DATABASE RESET (FULL WIPE)     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  try {
    // Order matters — delete children before parents (foreign keys)
    const tables = [
      'Notification',
      'Bid',
      'Order',
      'Interest',
      'Subscription',
      'FlashEvent',
      'Campaign',
      'DemandPool',
      'Product',
      'PlatformSettings',
      'User',
    ];

    for (const table of tables) {
      const result = await client.query(`DELETE FROM "${table}"`);
      console.log(`  🗑  ${table.padEnd(20)} — ${result.rowCount} rows deleted`);
    }

    console.log('\n  ✅ Database is completely empty. Clean slate!\n');
    console.log('  Next steps:');
    console.log('  1. Go to http://localhost:3000/register');
    console.log('  2. Create accounts (consumer, manufacturer, admin)');
    console.log('  3. Test each module manually\n');

  } catch (err) {
    console.error('  ❌ Reset failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
