import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma Client with the pg adapter
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const basePrisma = new PrismaClient({ adapter });

export const prisma = basePrisma.$extends({
  query: {
    notification: {
      async create({ args, query }) {
        const result = await query(args);
        if (result && result.userId) {
          const { sendPushNotification } = require('./services/pushNotificationService');
          sendPushNotification(result.userId, result.title, result.message, {
            type: result.type,
            actionUrl: result.actionUrl || ''
          }).catch((err: any) => console.error('Error sending push notification:', err));
        }
        return result;
      }
    }
  }
});
