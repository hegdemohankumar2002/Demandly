const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
console.log('DATABASE_URL:', connectionString);

const pool = new Pool({ connectionString, max: 20 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => console.log('DB connected'))
  .catch(e => console.error('DB error:', e));