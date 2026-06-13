import { prisma } from '../db';

/**
 * Subscription Lifecycle Manager
 * Checks for active subscriptions due for their next delivery.
 * For each, it:
 * 1. Spawns a new monthly Order.
 * 2. Increments completed deliveries.
 * 3. Schedules the next delivery date (30 days out).
 * 4. Completes/expires the subscription if milestones are met.
 * 5. Sends notifications to both consumer and manufacturer.
 */
export async function processActiveSubscriptions() {
  try {
    const now = new Date();

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        nextDelivery: { lte: now }
      },
      include: {
        product: true
      }
    });

    if (dueSubscriptions.length === 0) return;

    console.log(`[CRON] Processing ${dueSubscriptions.length} active subscription delivery/deliveries...`);

    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7); // 1 week delivery

    for (const sub of dueSubscriptions) {
      const nextCompleted = sub.deliveriesCompleted + 1;
      const isFinished = nextCompleted >= sub.totalDeliveries;

      // Calculate unit price
      const pricePerUnit = sub.monthlyQuantity > 0 ? (sub.pricePerMonth / sub.monthlyQuantity) : 0;
      const commissionAmount = sub.pricePerMonth * 0.05;

      // 1. Create monthly order
      await prisma.order.create({
        data: {
          consumerId: sub.userId,
          productId: sub.productId,
          manufacturerId: sub.manufacturerId,
          quantity: sub.monthlyQuantity,
          pricePerUnit,
          totalPrice: sub.pricePerMonth,
          commissionAmount,
          status: 'confirmed',
          paymentMethod: 'razorpay', // mock card auto-billing
          paymentStatus: 'paid',
          estimatedDelivery
        }
      });

      // 2. Update subscription state
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          deliveriesCompleted: nextCompleted,
          nextDelivery: new Date(sub.nextDelivery.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days rollover
          status: isFinished ? 'completed' : 'active'
        }
      });

      // 3. Notify Consumer
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          type: 'delivery_update',
          title: '🔄 Subscription Order Placed!',
          message: `Your monthly subscription order for "${sub.product.name}" (${sub.monthlyQuantity} units) has been processed.`,
          actionUrl: '/consumer/orders'
        }
      });

      // 4. Notify Manufacturer
      await prisma.notification.create({
        data: {
          userId: sub.manufacturerId,
          type: 'delivery_update',
          title: '📦 New Subscription Delivery Request',
          message: `A monthly delivery of ${sub.monthlyQuantity} units of "${sub.product.name}" is scheduled. Proceed with fulfilment.`,
          actionUrl: '/manufacturer/orders'
        }
      });

      console.log(`[CRON] Processed subscription ${sub.id}: delivery ${nextCompleted}/${sub.totalDeliveries} recorded`);
    }
  } catch (error) {
    console.error('[CRON] Subscription processing error:', error);
  }
}
