const { readFileSync } = require('fs');
const pg = require('pg');
const env = readFileSync('.env', 'utf-8');
for (const l of env.split('\n')) {
  const m = l.match(/^(\w+)=["']?(.+?)["']?\s*$/);
  if (m) process.env[m[1]] = m[2];
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const c = await pool.connect();
  const r = await c.query('SELECT id,name,email,role,"companyName",phone,city,pincode,"createdAt" FROM "User" ORDER BY role,"createdAt"');
  console.log(JSON.stringify(r.rows, null, 2));
  c.release();
  await pool.end();
})();
