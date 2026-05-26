import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { verifyAuth } from '../middlewares/auth';
import crypto from 'crypto';

const router = Router();

// Razorpay config (use env vars in production)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_placeholder';

/**
 * Create a payment order for a given order ID.
 * In production this calls Razorpay's Orders API.
 * In dev/sandbox mode, it creates a mock order.
 */
router.post('/create-order', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Fetch commission rate from platform settings
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
    const commissionAmount = order.totalPrice * (settings.commissionPercent / 100);
    const amountInPaise = Math.round(order.totalPrice * 100);

    // In sandbox mode, generate a mock Razorpay order ID
    const isProduction = RAZORPAY_KEY_ID.startsWith('rzp_live');
    let razorpayOrderId: string;

    if (isProduction) {
      // Production: call Razorpay API
      const Razorpay = require('razorpay');
      const instance = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
      const rpOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: { productName: order.product.name, quantity: order.quantity }
      });
      razorpayOrderId = rpOrder.id;
    } else {
      // Sandbox: mock order ID
      razorpayOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
    }

    // Update order with payment details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentOrderId: razorpayOrderId,
        commissionAmount,
        paymentStatus: 'pending'
      }
    });

    return res.json({
      orderId: razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      name: 'Demandly',
      description: `${order.product.name} × ${order.quantity}`,
      sandbox: !isProduction,
      commissionPercent: settings.commissionPercent,
      commissionAmount,
    });
  } catch (error) {
    console.error('Payment create-order error:', error);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
});

/**
 * Verify payment after Razorpay checkout completes.
 * In production, verifies signature. In sandbox, auto-approves.
 */
router.post('/verify', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const order = await prisma.order.findFirst({
      where: { paymentOrderId: orderId }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isProduction = RAZORPAY_KEY_ID.startsWith('rzp_live');
    let verified = false;

    if (isProduction && signature && paymentId) {
      // Production: verify Razorpay signature
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
      verified = expectedSignature === signature;
    } else {
      // Sandbox: auto-verify
      verified = true;
    }

    if (!verified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update order payment status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        paymentId: paymentId || `pay_mock_${crypto.randomBytes(8).toString('hex')}`
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: order.manufacturerId,
        type: 'general',
        title: '💰 Payment Received',
        message: `Payment of ₹${order.totalPrice} confirmed for order ${order.id.slice(0, 8)}. Proceed with fulfilment.`,
        actionUrl: '/manufacturer/fulfilment'
      }
    });

    return res.json({ success: true, message: 'Payment verified and recorded' });
  } catch (error) {
    console.error('Payment verify error:', error);
    return res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/**
 * Get payment status for an order
 */
router.get('/status/:orderId', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId as string },
      select: {
        id: true, paymentStatus: true, paymentId: true, paymentOrderId: true,
        totalPrice: true, commissionAmount: true
      }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default router;
