import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Get Consumer Stats
router.get('/stats', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;

    const activeInterestsCount = await prisma.interest.count({
      where: { userId: consumerId }
    });

    // Active Orders (represented by fulfilled interests currently in delivery process)
    const fulfilledInterests = await prisma.interest.findMany({
      where: { userId: consumerId, status: 'fulfilled' },
      include: { product: true }
    });
    const activeOrdersCount = fulfilledInterests.length;

    // Calculate actual savings: (Retail Price - Deal Price) * Quantity
    let totalRetail = 0;
    let totalPaid = 0;

    const totalSavings = fulfilledInterests.reduce((sum, interest) => {
      totalRetail += interest.product.retailPrice * interest.quantity;
      totalPaid += interest.maxPrice * interest.quantity;
      
      const savedPerUnit = interest.product.retailPrice - interest.maxPrice;
      return sum + (savedPerUnit > 0 ? savedPerUnit * interest.quantity : 0);
    }, 0);

    const savingsPercentage = totalRetail > 0 ? Math.round(((totalRetail - totalPaid) / totalRetail) * 100) : 0;

    return res.json({
      activeInterests: activeInterestsCount,
      activeOrders: activeOrdersCount,
      totalSavings,
      savingsPercentage
    });
  } catch (error) {
    console.error('Error fetching consumer stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Consumer Interests
router.get('/interests', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const interests = await prisma.interest.findMany({
      where: { userId: consumerId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(interests);
  } catch (error) {
    console.error('Error fetching interests:', error);
    return res.status(500).json({ error: 'Failed to fetch interests' });
  }
});

// Register an Interest
router.post('/interests', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const { productId, quantity, maxPrice, timeline } = req.body;

    if (!productId || !quantity || !maxPrice) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const interest = await prisma.interest.create({
      data: {
        userId: consumerId,
        productId,
        quantity,
        maxPrice,
        timeline: timeline || '2weeks',
        status: 'aggregating'
      }
    });

    // Also update product demand count
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { demandCount: { increment: quantity } }
    });

    // --- Demand Pool Aggregation Logic ---
    const consumer = await prisma.user.findUnique({
      where: { id: consumerId },
      select: { city: true, pincode: true }
    });
    const city = consumer?.city || 'Mumbai';
    const pincode = consumer?.pincode || '400001';

    let pool = await prisma.demandPool.findFirst({
      where: {
        productId,
        pincode,
        status: 'aggregating'
      }
    });

    if (pool) {
      const newTotalDemand = pool.totalDemand + quantity;
      const newAvgMaxPrice = ((pool.averageMaxPrice * pool.totalDemand) + (maxPrice * quantity)) / newTotalDemand;
      const isMet = newTotalDemand >= pool.threshold;

      pool = await prisma.demandPool.update({
        where: { id: pool.id },
        data: {
          totalDemand: newTotalDemand,
          averageMaxPrice: newAvgMaxPrice,
          status: isMet ? 'threshold_met' : 'aggregating'
        }
      });

      if (isMet) {
        // Find all consumers in this pincode to update their interest statuses
        const consumersInPincode = await prisma.user.findMany({
          where: { pincode, role: 'consumer' },
          select: { id: true }
        });
        const consumerIds = consumersInPincode.map(c => c.id);

        await prisma.interest.updateMany({
          where: {
            productId,
            userId: { in: consumerIds },
            status: 'aggregating'
          },
          data: { status: 'threshold_met' }
        });

        await prisma.notification.create({
          data: {
            type: 'threshold_met',
            title: '🎯 Demand Threshold Met!',
            message: `"${updatedProduct.name}" in ${pool.geography} reached ${newTotalDemand}/${pool.threshold} units. Ready for auction!`,
            actionUrl: `/admin/demand-pools`
          }
        });
      }
    } else {
      const timelineDays: Record<string, number> = {
        'urgent': 3,
        '1week': 7,
        '2weeks': 14,
        '1month': 30
      };
      const days = timelineDays[timeline] || 14;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + days);

      const isMet = quantity >= updatedProduct.demandThreshold;

      pool = await prisma.demandPool.create({
        data: {
          productId,
          totalDemand: quantity,
          threshold: updatedProduct.demandThreshold,
          geography: city ? `${city}, India` : 'Mumbai, India',
          pincode,
          deadline,
          status: isMet ? 'threshold_met' : 'aggregating',
          averageMaxPrice: maxPrice
        }
      });

      if (isMet) {
        const consumersInPincode = await prisma.user.findMany({
          where: { pincode, role: 'consumer' },
          select: { id: true }
        });
        const consumerIds = consumersInPincode.map(c => c.id);

        await prisma.interest.updateMany({
          where: {
            productId,
            userId: { in: consumerIds },
            status: 'aggregating'
          },
          data: { status: 'threshold_met' }
        });

        await prisma.notification.create({
          data: {
            type: 'threshold_met',
            title: '🎯 Demand Threshold Met!',
            message: `"${updatedProduct.name}" in ${pool.geography} reached ${quantity}/${pool.threshold} units. Ready for auction!`,
            actionUrl: `/admin/demand-pools`
          }
        });
      }
    }

    return res.json(interest);
  } catch (error) {
    console.error('Error registering interest:', error);
    return res.status(500).json({ error: 'Failed to register interest' });
  }
});

// Get Products
router.get('/products', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' }
    });
    return res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get Single Product
router.get('/products/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const productId = req.params.id as string;
    const consumerId = (req as any).user.id;

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });

    const existingInterest = await prisma.interest.findFirst({
      where: { productId, userId: consumerId }
    });

    return res.json({ product, interest: existingInterest });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Get Active Demand Pools
router.get('/demand-pools/active', async (req: Request, res: Response): Promise<any> => {
  try {
    const pools = await prisma.demandPool.findMany({
      where: { status: 'auction_active' },
      include: { product: true },
      orderBy: { deadline: 'asc' },
      take: 5
    });
    return res.json(pools);
  } catch (error) {
    console.error('Error fetching demand pools:', error);
    return res.status(500).json({ error: 'Failed to fetch demand pools' });
  }
});

// Get Consumer Orders (real Order records)
router.get('/orders', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    
    const orders = await prisma.order.findMany({
      where: { consumerId },
      include: { 
        product: true,
        manufacturer: { select: { id: true, name: true, companyName: true, city: true, phone: true } }
      },
      orderBy: { orderedAt: 'desc' }
    });

    // Also get subscriptions as "recurring orders"
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: consumerId },
      include: { product: true, manufacturer: { select: { name: true, companyName: true } } }
    });

    return res.json({ orders, subscriptions });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Confirm COD payment for an order
router.post('/orders/:id/confirm', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const orderId = req.params.id as string;

    const order = await prisma.order.findUnique({ 
      where: { id: orderId },
      include: { product: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.consumerId !== consumerId) return res.status(403).json({ error: 'Not your order' });
    if (order.status !== 'pending_payment') return res.status(400).json({ error: 'Order already confirmed' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'confirmed',
        paymentMethod: 'cod'
      }
    });

    // Notify the manufacturer
    await prisma.notification.create({
      data: {
        userId: order.manufacturerId,
        type: 'delivery_update',
        title: '📦 New Order Confirmed!',
        message: `A consumer confirmed COD for "${order.product.name}" (${order.quantity} units, ₹${order.totalPrice.toFixed(0)}). Start manufacturing!`,
        actionUrl: `/manufacturer/orders`
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error confirming order:', error);
    return res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// ──────────────────────────────────────────────
// SUBSCRIPTIONS
// ──────────────────────────────────────────────

// Get Consumer Subscriptions
router.get('/subscriptions', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: consumerId },
      include: {
        product: true,
        manufacturer: { select: { id: true, name: true, companyName: true, city: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Create a Subscription
router.post('/subscriptions', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const { productId, manufacturerId, monthlyQuantity, pricePerMonth, totalDeliveries } = req.body;

    if (!productId || !manufacturerId || !monthlyQuantity || !pricePerMonth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const subscription = await prisma.subscription.create({
      data: {
        userId: consumerId,
        productId,
        manufacturerId,
        monthlyQuantity,
        pricePerMonth,
        retailPricePerMonth: product.retailPrice * monthlyQuantity,
        status: 'active',
        startDate: new Date(),
        nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalDeliveries: totalDeliveries || 12,
      }
    });
    return res.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update Subscription Status (pause/resume/cancel)
router.put('/subscriptions/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const consumerId = (req as any).user.id;
    const { status } = req.body;

    const subscription = await prisma.subscription.findUnique({ where: { id: req.params.id as string } });
    if (!subscription || subscription.userId !== consumerId) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updated = await prisma.subscription.update({
      where: { id: req.params.id as string },
      data: { status }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ──────────────────────────────────────────────
// FLASH EVENTS
// ──────────────────────────────────────────────

// Get Active Flash Events
router.get('/flash-events', async (req: Request, res: Response): Promise<any> => {
  try {
    const events = await prisma.flashEvent.findMany({
      where: { status: 'active' },
      include: { product: true },
      orderBy: { endsAt: 'asc' }
    });
    return res.json(events);
  } catch (error) {
    console.error('Error fetching flash events:', error);
    return res.status(500).json({ error: 'Failed to fetch flash events' });
  }
});

// Join a Flash Event (increment units)
router.post('/flash-events/:id/join', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { quantity } = req.body;
    const qty = quantity || 1;

    const event = await prisma.flashEvent.findUnique({ where: { id: req.params.id as string } });
    if (!event) return res.status(404).json({ error: 'Flash event not found' });
    if (event.status !== 'active') return res.status(400).json({ error: 'Event is no longer active' });

    const newUnits = event.currentUnits + qty;
    const updated = await prisma.flashEvent.update({
      where: { id: req.params.id as string },
      data: {
        currentUnits: newUnits,
        status: newUnits >= event.targetUnits ? 'completed' : 'active'
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error joining flash event:', error);
    return res.status(500).json({ error: 'Failed to join flash event' });
  }
});

// ──────────────────────────────────────────────
// COMMUNITY CAMPAIGNS
// ──────────────────────────────────────────────

// Get All Campaigns
router.get('/campaigns', async (req: Request, res: Response): Promise<any> => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: { author: { select: { id: true, name: true, city: true } } },
      orderBy: { votes: 'desc' }
    });
    return res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create a Campaign
router.post('/campaigns', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const authorId = (req as any).user.id;
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        category,
        authorId,
        totalVotes: 100, // goal
        status: 'voting'
      }
    });
    return res.json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Vote on a Campaign
router.post('/campaigns/:id/vote', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id as string } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const newVotes = campaign.votes + 1;
    const updated = await prisma.campaign.update({
      where: { id: req.params.id as string },
      data: {
        votes: newVotes,
        status: newVotes >= campaign.totalVotes ? 'approved' : 'voting'
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error voting on campaign:', error);
    return res.status(500).json({ error: 'Failed to vote' });
  }
});

export default router;

