import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  masterApiKey: process.env.MASTER_API_KEY || 'your-super-secret-master-api-key',
};
