import cron from 'node-cron';
import { prisma } from '../db';
import { resolveAuction } from '../utils/auction';

/**
 * Auction Auto-Close Cron Job
 * Runs every 5 minutes to:
 * 1. Close auctions past their deadline
 * 2. Auto-select the winning bid (lowest price)
 * 3. Create orders for fulfilled demand
 * 4. Send notifications
 */
export function startCronJobs() {
  console.log('[CRON] Auction auto-close job scheduled (every 5 minutes)');

  // ── Every 5 minutes: close expired auctions and failed aggregations ──
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();

      // 0. Find all aggregating pools whose deadline has passed (failed to meet threshold)
      const failedPools = await prisma.demandPool.findMany({
        where: {
          status: 'aggregating',
          deadline: { lte: now }
        },
        include: {
          product: true
        }
      });

      if (failedPools.length > 0) {
        console.log(`[CRON] Found ${failedPools.length} failed aggregation pool(s)`);
        for (const pool of failedPools) {
          // Close the pool
          await prisma.demandPool.update({
            where: { id: pool.id },
            data: { status: 'closed' }
          });

          // Cancel associated interests
          const interests = await prisma.interest.findMany({
            where: { productId: pool.productId, status: { in: ['pending', 'aggregating'] } }
          });

          if (interests.length > 0) {
            await prisma.interest.updateMany({
              where: { id: { in: interests.map(i => i.id) } },
              data: { status: 'cancelled' }
            });

            // Notify consumers
            for (const interest of interests) {
              await prisma.notification.create({
                data: {
                  userId: interest.userId,
                  type: 'general',
                  title: 'Demand Pool Closed',
                  message: `Unfortunately, the demand pool for "${pool.product.name}" did not reach the minimum threshold by the deadline and has been closed.`,
                  actionUrl: `/consumer/products/${pool.productId}`
                }
              });
            }
          }
        }
      }

      // 1. Find all pools with auction_active status whose deadline has passed
      const expiredPools = await prisma.demandPool.findMany({
        where: {
          status: 'auction_active',
          deadline: { lte: now }
        },
        select: { id: true }
      });

      if (expiredPools.length === 0) return;

      console.log(`[CRON] Found ${expiredPools.length} expired auction(s) to close`);

      for (const pool of expiredPools) {
        await resolveAuction(pool.id);
      }
    } catch (error) {
      console.error('[CRON] Auction auto-close error:', error);
    }
  });

  // ── Every hour: expire old flash events ──
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const expired = await prisma.flashEvent.updateMany({
        where: {
          status: 'active',
          endsAt: { lte: now }
        },
        data: { status: 'expired' }
      });

      if (expired.count > 0) {
        console.log(`[CRON] Expired ${expired.count} flash event(s)`);
      }
    } catch (error) {
      console.error('[CRON] Flash event expiry error:', error);
    }
  });

  // ── Every hour: auto-promote pools that hit threshold ──
  cron.schedule('5 * * * *', async () => {
    try {
      const promoted = await prisma.demandPool.findMany({
        where: {
          status: 'aggregating',
          totalDemand: { gte: prisma.demandPool.fields.threshold as any }
        }
      });

      // Prisma doesn't support field-to-field comparison in where, so we fetch and filter
      const allAggregating = await prisma.demandPool.findMany({
        where: { status: 'aggregating' },
        include: { product: true }
      });

      for (const pool of allAggregating) {
        if (pool.totalDemand >= pool.threshold) {
          await prisma.demandPool.update({
            where: { id: pool.id },
            data: { status: 'threshold_met' }
          });

          await prisma.notification.create({
            data: {
              type: 'threshold_met',
              title: '🎯 Demand Threshold Met!',
              message: `"${pool.product.name}" in ${pool.geography} reached ${pool.totalDemand}/${pool.threshold} units. Ready for auction!`,
              actionUrl: `/admin/demand-pools`
            }
          });

          console.log(`[CRON] Pool ${pool.id} promoted to threshold_met`);
        }
      }
    } catch (error) {
      console.error('[CRON] Threshold promotion error:', error);
    }
  });
}
