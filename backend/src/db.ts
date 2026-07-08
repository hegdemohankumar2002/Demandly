import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { emitNotificationCreated } from './utils/events';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ 
  connectionString,
  max: parseInt(process.env.DATABASE_POOL_SIZE || '20', 10),
});
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    notification: {
      async create({ args, query }) {
        const result = await query(args);
        if (result && result.userId) {
          emitNotificationCreated({
            userId: result.userId,
            title: result.title || '',
            message: result.message || '',
            type: result.type || '',
            actionUrl: result.actionUrl || '',
          });
        }
        return result;
      }
    }
  }
});

export async function closeDatabaseConnections() {
  await prisma.$disconnect();
  await pool.end();
}