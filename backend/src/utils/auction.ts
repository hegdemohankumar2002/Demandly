import { prisma } from '../db';

/**
 * Resolves an active auction/demand pool by:
 * 1. Selecting the lowest-price bid as the winner.
 * 2. Creating individual consumer orders for all consumers in that pincode who expressed interest.
 * 3. Updating the demand pool and interest statuses.
 * 4. Dispatching notifications to the winning manufacturer, losing manufacturers, consumers, and admin.
 */
export async function resolveAuction(poolId: string) {
  const pool = await prisma.demandPool.findUnique({
    where: { id: poolId },
    include: {
      bids: { orderBy: { pricePerUnit: 'asc' } },
      product: true
    }
  });

  if (!pool) {
    console.error(`[Auction] Pool not found for resolution: ${poolId}`);
    return;
  }

  const bids = pool.bids;

  if (bids.length === 0) {
    // No bids → just close it
    await prisma.demandPool.update({
      where: { id: pool.id },
      data: { status: 'closed' }
    });

    await prisma.notification.create({
      data: {
        type: 'auction_closed',
        title: 'Auction Closed — No Bids',
        message: `The auction for "${pool.product.name}" in ${pool.geography} closed with no bids.`,
        actionUrl: `/admin/demand-pools`
      }
    });

    console.log(`[Auction] Pool ${pool.id} closed with no bids`);
    return;
  }

  // 2. Select winning bid (lowest price)
  const winningBid = bids[0];

  // 3. Mark bid statuses
  await prisma.bid.update({
    where: { id: winningBid.id },
    data: { status: 'won' }
  });

  // Mark all other bids as lost
  const loserIds = bids.slice(1).map(b => b.id);
  if (loserIds.length > 0) {
    await prisma.bid.updateMany({
      where: { id: { in: loserIds } },
      data: { status: 'lost' }
    });
  }

  // 4. Get all consumers who registered interest for this product in this pincode
  const consumers = await prisma.user.findMany({
    where: { pincode: pool.pincode, role: 'consumer' },
    select: { id: true }
  });
  const consumerIds = consumers.map(c => c.id);

  const consumerInterests = await prisma.interest.findMany({
    where: {
      productId: pool.productId,
      userId: { in: consumerIds },
      status: { in: ['aggregating', 'auction_active', 'threshold_met'] }
    },
    include: { user: true }
  });

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 14); // 2 weeks

  // 5. Create individual orders for each consumer
  for (const interest of consumerInterests) {
    const orderTotal = winningBid.pricePerUnit * interest.quantity;
    const commission = orderTotal * 0.05; // 5% platform commission

    await prisma.order.create({
      data: {
        consumerId: interest.userId,
        productId: pool.productId,
        manufacturerId: winningBid.manufacturerId,
        demandPoolId: pool.id,
        quantity: interest.quantity,
        pricePerUnit: winningBid.pricePerUnit,
        totalPrice: orderTotal,
        commissionAmount: commission,
        status: 'pending_payment',
        paymentMethod: 'cod',
        estimatedDelivery
      }
    });

    // Send notification to each consumer
    await prisma.notification.create({
      data: {
        userId: interest.userId,
        type: 'auction_closed',
        title: '🎉 Auction Complete! Confirm Your Order',
        message: `Great news! "${pool.product.name}" has been secured at ₹${winningBid.pricePerUnit}/${pool.product.unit}. Your order of ${interest.quantity} units totals ₹${orderTotal.toFixed(0)}. Please confirm payment.`,
        actionUrl: `/consumer/orders`
      }
    });
  }

  // 6. Update pool status to fulfilled
  await prisma.demandPool.update({
    where: { id: pool.id },
    data: {
      status: 'fulfilled',
      bestBidPrice: winningBid.pricePerUnit
    }
  });

  // 7. Update related interests to fulfilled
  if (consumerIds.length > 0) {
    await prisma.interest.updateMany({
      where: {
        productId: pool.productId,
        userId: { in: consumerIds },
        status: { in: ['aggregating', 'auction_active', 'threshold_met'] }
      },
      data: { status: 'fulfilled' }
    });
  }

  // 8. Create notifications
  // Notification for winning manufacturer
  await prisma.notification.create({
    data: {
      userId: winningBid.manufacturerId,
      type: 'auction_closed',
      title: '🎉 You Won the Auction!',
      message: `Your bid of ₹${winningBid.pricePerUnit}/unit for "${pool.product.name}" won! ${consumerInterests.length} consumer orders (${pool.totalDemand} total units) to fulfil.`,
      actionUrl: `/manufacturer/orders`
    }
  });

  // Notification for admin
  await prisma.notification.create({
    data: {
      type: 'auction_closed',
      title: 'Auction Closed',
      message: `"${pool.product.name}" in ${pool.geography} — won by bid at ₹${winningBid.pricePerUnit}/unit (${pool.totalDemand} units, ${consumerInterests.length} orders).`,
      actionUrl: `/admin/orders`
    }
  });

  // Notifications for losing bidders
  for (const loser of bids.slice(1)) {
    await prisma.notification.create({
      data: {
        userId: loser.manufacturerId,
        type: 'auction_closed',
        title: 'Auction Ended — Outbid',
        message: `Your bid for "${pool.product.name}" was not selected. The winning bid was ₹${winningBid.pricePerUnit}/unit.`,
        actionUrl: `/manufacturer/my-bids`
      }
    });
  }

  console.log(`[Auction] Pool ${pool.id} fulfilled → winner: ${winningBid.manufacturerId} at ₹${winningBid.pricePerUnit}/unit → ${consumerInterests.length} consumer orders created`);
}
