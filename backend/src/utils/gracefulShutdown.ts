import { Server } from 'http';
import { logger } from './logger';
import { closeDatabaseConnections } from '../db';
import { closeRedisConnection } from '../cache/redis';
import { stopCronJobs } from '../cron/auctionCron';

export function setupGracefulShutdown(server: Server) {
  const handler = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // 1. Force close after 10s if graceful shutdown hangs
    const timeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing process exit.');
      process.exit(1);
    }, 10000);

    // 2. Stop accepting new connections
    server.close(() => {
      logger.info('Express server closed.');
    });

    try {
      // 3. Stop cron jobs
      stopCronJobs();
      logger.info('Cron jobs stopped successfully.');

      // 4. Close Redis connection
      await closeRedisConnection();
      logger.info('Redis connection closed.');

      // 5. Close Database connections
      await closeDatabaseConnections();
      logger.info('Database connections closed.');

      clearTimeout(timeout);
      logger.info('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (err) {
      logger.error('Error occurred during graceful shutdown', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => handler('SIGTERM'));
  process.on('SIGINT', () => handler('SIGINT'));
}
