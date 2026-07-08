import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { verifyAuth, requireRole } from '../middlewares/auth';
import { cacheGet, cacheInvalidate, setAuctionState } from '../cache/redis';
import { geocodeFromPincode } from '../utils/geocode';
import { validate } from '../middlewares/validation';
import { createBidSchema, proposeProductSchema } from '../schemas/routes.schema';

const router = Router();

// Protect all manufacturer routes
router.use(verifyAuth, requireRole('manufacturer'));

// Get Manufacturer Stats
router.get('/stats', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;

    const activeBidsCount = await prisma.bid.count({
      where: { manufacturerId, status: { in: ['leading', 'submitted'] } }
    });

    const wonBidsCount = await prisma.bid.count({
      where: { manufacturerId, status: 'won' }
    });

    const totalBidsCount = await prisma.bid.count({
      where: { manufacturerId }
    });

    // Calculate total revenue from orders
    const orders = await prisma.order.findMany({
      where: { manufacturerId }
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const bidWinRate = totalBidsCount > 0 ? Math.round((wonBidsCount / totalBidsCount) * 100) : 0;
    
    const pendingOrders = orders.filter(o => o.status !== 'delivered').length;

    const demandPoolsAvailable = await prisma.demandPool.count({
      where: { status: 'auction_active' }
    });

    return res.json({
      activeBids: activeBidsCount,
      wonBids: wonBidsCount,
      totalRevenue,
      bidWinRate,
      pendingOrders,
      avgRating: 4.7,
      demandPoolsAvailable,
    });
  } catch (error) {
    console.error('Error fetching manufacturer stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get Recent Bids (with optional pagination)
router.get('/bids', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '10');
      const skip = (page - 1) * limit;

      const [bids, total] = await Promise.all([
        prisma.bid.findMany({
          where: { manufacturerId },
          include: {
            demandPool: {
              include: {
                product: true
              }
            }
          },
          orderBy: { submittedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.bid.count({ where: { manufacturerId } })
      ]);

      return res.json({
        data: bids,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      const bids = await prisma.bid.findMany({
        where: { manufacturerId },
        include: {
          demandPool: {
            include: {
              product: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 10
      });
      return res.json(bids);
    }
  } catch (error) {
    console.error('Error fetching bids:', error);
    return res.status(500).json({ error: 'Failed to fetch bids' });
  }
});

// Get Active Demand Pools (cached 30s)
router.get('/demand-pools/active', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const pools = await cacheGet('manufacturer:pools:active', 30, async () => {
      return prisma.demandPool.findMany({
        where: { status: 'auction_active' },
        include: { product: true },
        orderBy: { deadline: 'asc' },
        take: 10
      });
    });
    return res.json(pools);
  } catch (error) {
    console.error('Error fetching active demand pools:', error);
    return res.status(500).json({ error: 'Failed to fetch demand pools' });
  }
});

// Get All Demand Pools (with optional pagination)
router.get('/demand-pools', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      const skip = (page - 1) * limit;

      const [pools, total] = await Promise.all([
        prisma.demandPool.findMany({
          include: { product: true },
          orderBy: { deadline: 'asc' },
          skip,
          take: limit
        }),
        prisma.demandPool.count()
      ]);

      return res.json({
        data: pools,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      const pools = await prisma.demandPool.findMany({
        include: { product: true },
        orderBy: { deadline: 'asc' },
      });
      return res.json(pools);
    }
  } catch (error) {
    console.error('Error fetching demand pools:', error);
    return res.status(500).json({ error: 'Failed to fetch demand pools' });
  }
});

// Get Single Demand Pool details
router.get('/demand-pools/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const poolId = req.params.id as string;
    const manufacturerId = (req as any).user.id;

    const pool = await prisma.demandPool.findUnique({
      where: { id: poolId },
      include: { product: true }
    });

    if (!pool) return res.status(404).json({ error: 'Demand pool not found' });

    const existingBid = await prisma.bid.findFirst({
      where: { demandPoolId: poolId, manufacturerId }
    });

    return res.json({ pool, bid: existingBid });
  } catch (error) {
    console.error('Error fetching demand pool details:', error);
    return res.status(500).json({ error: 'Failed to fetch demand pool details' });
  }
});

// Submit a Bid
router.post('/bids', verifyAuth, validate(createBidSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const { demandPoolId, pricePerUnit, deliveryTimeline } = req.body;

    const mfg = await prisma.user.findUnique({ where: { id: manufacturerId } });
    if (!mfg || !mfg.verified) {
      return res.status(403).json({ error: 'Forbidden: Your manufacturer account is pending admin verification.' });
    }

    const pool = await prisma.demandPool.findUnique({
      where: { id: demandPoolId },
      include: { product: true }
    });
    if (!pool) return res.status(404).json({ error: 'Demand pool not found' });

    // Relax constraint: allow bidding up to product retail price (or fallback to averageMaxPrice * 1.5)
    const maxAllowed = pool.product ? pool.product.retailPrice : pool.averageMaxPrice * 1.5;
    if (pricePerUnit > maxAllowed) {
      return res.status(400).json({ error: `Bid price cannot exceed the retail price of ₹${maxAllowed.toFixed(0)}` });
    }

    // Find existing bid
    const existingBid = await prisma.bid.findFirst({
      where: { manufacturerId, demandPoolId }
    });

    let bid;
    if (existingBid) {
      bid = await prisma.bid.update({
        where: { id: existingBid.id },
        data: { pricePerUnit, deliveryTimeline }
      });
    } else {
      bid = await prisma.bid.create({
        data: {
          manufacturerId,
          demandPoolId,
          pricePerUnit,
          deliveryTimeline,
          status: 'submitted'
        }
      });
    }

    // Update auction state
    const bidCount = await prisma.bid.count({ where: { demandPoolId } });
    const bestBid = await prisma.bid.findFirst({
      where: { demandPoolId },
      orderBy: { pricePerUnit: 'asc' }
    });

    // Update demand pool bestBidPrice and bidsCount in DB
    await prisma.demandPool.update({
      where: { id: demandPoolId },
      data: {
        bidsCount: bidCount,
        bestBidPrice: bestBid?.pricePerUnit || null
      }
    });

    // Update leading vs outbid status for all bids in this pool
    const allBids = await prisma.bid.findMany({ where: { demandPoolId } });
    for (const b of allBids) {
      const isLead = bestBid && b.id === bestBid.id;
      await prisma.bid.update({
        where: { id: b.id },
        data: { status: isLead ? 'leading' : 'outbid' }
      });
    }

    // Update auction state in Redis for real-time tracking
    await setAuctionState(demandPoolId, {
      bidsCount: bidCount,
      bestBidPrice: bestBid?.pricePerUnit || null,
      lastBidAt: new Date().toISOString()
    });

    // Invalidate cached pool listings
    await cacheInvalidate('manufacturer:pools:*');

    // Return the updated/created bid
    const updatedBid = await prisma.bid.findUnique({ where: { id: bid.id } });
    return res.json(updatedBid);
  } catch (error) {
    console.error('Error submitting bid:', error);
    return res.status(500).json({ error: 'Failed to submit bid' });
  }
});

// ──────────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────────

// Get Manufacturer Profile
router.get('/profile', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const user = await prisma.user.findUnique({
      where: { id: manufacturerId },
      select: {
        id: true, name: true, email: true, phone: true, city: true, pincode: true,
        companyName: true, category: true, certifications: true,
        rating: true, totalOrders: true, revenue: true, verified: true,
        createdAt: true
      }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Manufacturer Profile
router.put('/profile', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const { name, phone, city, pincode, companyName, category, certifications } = req.body;

    const updated = await prisma.user.update({
      where: { id: manufacturerId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(city && { city }),
        ...(pincode && { pincode }),
        ...(companyName && { companyName }),
        ...(category && { category }),
        ...(certifications && { certifications }),
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ──────────────────────────────────────────────
// FULFILMENT
// ──────────────────────────────────────────────

// Get Manufacturer Orders (Fulfilment, with optional pagination)
router.get('/fulfilment', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { manufacturerId },
          include: { product: true },
          orderBy: { orderedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.order.count({ where: { manufacturerId } })
      ]);

      return res.json({
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      const orders = await prisma.order.findMany({
        where: { manufacturerId },
        include: { product: true },
        orderBy: { orderedAt: 'desc' }
      });
      return res.json(orders);
    }
  } catch (error) {
    console.error('Error fetching fulfilment orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update Order Status
router.put('/fulfilment/:id/status', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const { status, trackingId } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: req.params.id as string },
      include: { product: true, consumer: { select: { pincode: true, city: true } } }
    });
    if (!order || order.manufacturerId !== manufacturerId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // When shipping, geocode origin (manufacturer) and destination (consumer)
    let geoData: any = {};
    if (status === 'shipped' && !order.originLat) {
      const mfg = await prisma.user.findUnique({ where: { id: manufacturerId }, select: { pincode: true, city: true } });
      if (mfg?.pincode) {
        const origin = await geocodeFromPincode(mfg.pincode, mfg.city || undefined);
        if (origin) { geoData.originLat = origin.lat; geoData.originLng = origin.lng; geoData.currentLat = origin.lat; geoData.currentLng = origin.lng; }
      }
      if (order.consumer?.pincode) {
        const dest = await geocodeFromPincode(order.consumer.pincode, order.consumer.city || undefined);
        if (dest) { geoData.destLat = dest.lat; geoData.destLng = dest.lng; }
      }
    }

    const originalOrder = await prisma.order.findUnique({
      where: { id: req.params.id as string }
    });
    if (!originalOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const wasAlreadyDelivered = originalOrder.status === 'delivered';

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        status,
        ...(trackingId && { trackingId }),
        ...(status === 'delivered' && { deliveredAt: new Date(), paymentStatus: 'paid' }),
        ...geoData
      }
    });

    if (status === 'delivered' && !wasAlreadyDelivered) {
      await prisma.user.update({
        where: { id: manufacturerId },
        data: {
          totalOrders: { increment: 1 },
          revenue: { increment: updated.totalPrice }
        }
      });
    }

    // Notify the consumer about status change
    const statusMessages: Record<string, string> = {
      'manufacturing': `Your order for "${order.product.name}" is now being manufactured!`,
      'shipped': `Your order for "${order.product.name}" has been shipped!${trackingId ? ` Tracking ID: ${trackingId}` : ''}`,
      'delivered': `Your order for "${order.product.name}" has been delivered! Thank you for using Demandly.`,
    };

    if (statusMessages[status]) {
      await prisma.notification.create({
        data: {
          userId: order.consumerId,
          type: 'delivery_update',
          title: status === 'delivered' ? '✅ Order Delivered!' : status === 'shipped' ? '🚚 Order Shipped!' : '🏭 Manufacturing Started',
          message: statusMessages[status],
          actionUrl: `/consumer/orders`
        }
      });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ error: 'Failed to update order' });
  }
});

// Update GPS Location for an order
router.put('/fulfilment/:id/location', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const { lat, lng } = req.body;

    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order || order.manufacturerId !== manufacturerId) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { currentLat: lat, currentLng: lng }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating location:', error);
    return res.status(500).json({ error: 'Failed to update location' });
  }
});

// ──────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────

router.get('/analytics', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;

    const totalBids = await prisma.bid.count({ where: { manufacturerId } });
    const wonBids = await prisma.bid.count({ where: { manufacturerId, status: 'won' } });
    const totalOrders = await prisma.order.count({ where: { manufacturerId } });
    const deliveredOrders = await prisma.order.count({ where: { manufacturerId, status: 'delivered' } });

    // Calculate revenue from orders
    const orders = await prisma.order.findMany({
      where: { manufacturerId },
      select: { totalPrice: true, status: true, orderedAt: true }
    });
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Monthly breakdown (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentOrders = orders.filter(o => new Date(o.orderedAt) >= sixMonthsAgo);

    const monthlyRevenue: Record<string, number> = {};
    const monthlyOrders: Record<string, number> = {};
    recentOrders.forEach(o => {
      const key = new Date(o.orderedAt).toLocaleString('en', { month: 'short' });
      monthlyRevenue[key] = (monthlyRevenue[key] || 0) + o.totalPrice;
      monthlyOrders[key] = (monthlyOrders[key] || 0) + 1;
    });

    // Top products by order count
    const topProducts = await prisma.order.groupBy({
      by: ['productId'],
      where: { manufacturerId },
      _sum: { totalPrice: true, quantity: true },
      _count: true,
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    });

    // Fetch product names for top products
    const productIds = topProducts.map(tp => tp.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true }
    });
    const productMap = Object.fromEntries(products.map(p => [p.id, p.name]));

    return res.json({
      totalBids,
      wonBids,
      bidWinRate: totalBids > 0 ? Math.round((wonBids / totalBids) * 100) : 0,
      totalOrders,
      deliveredOrders,
      totalRevenue,
      monthlyRevenue,
      monthlyOrders,
      topProducts: topProducts.map(tp => ({
        productId: tp.productId,
        name: productMap[tp.productId] || 'Unknown',
        units: tp._sum.quantity || 0,
        revenue: tp._sum.totalPrice || 0,
        orderCount: tp._count,
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ──────────────────────────────────────────────
// PRODUCT PROPOSALS (Alibaba Model)
// ──────────────────────────────────────────────

// Submit a new product proposal
router.post('/proposals', verifyAuth, validate(proposeProductSchema), async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const { name, description, category, proposedPrice, unit, image } = req.body;

    const mfg = await prisma.user.findUnique({ where: { id: manufacturerId } });
    if (!mfg || !mfg.verified) {
      return res.status(403).json({ error: 'Forbidden: Your manufacturer account is pending admin verification.' });
    }

    const proposal = await prisma.productProposal.create({
      data: {
        manufacturerId,
        name,
        description,
        category,
        proposedPrice: parseFloat(proposedPrice),
        unit,
        image: image || 'https://images.unsplash.com/photo-1572635196237-14b3f281501f?q=80&w=500&auto=format&fit=crop'
      }
    });

    return res.status(201).json(proposal);
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return res.status(500).json({ error: 'Failed to submit product proposal' });
  }
});

// Get all proposals for this manufacturer (with optional pagination)
router.get('/proposals', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      const skip = (page - 1) * limit;

      const [proposals, total] = await Promise.all([
        prisma.productProposal.findMany({
          where: { manufacturerId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.productProposal.count({ where: { manufacturerId } })
      ]);

      return res.json({
        data: proposals,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      const proposals = await prisma.productProposal.findMany({
        where: { manufacturerId },
        orderBy: { createdAt: 'desc' }
      });
      return res.json(proposals);
    }
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Edit a pending proposal
router.put('/proposals/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const proposalId = req.params.id as string;
    const { name, description, category, proposedPrice, unit } = req.body;

    const proposal = await prisma.productProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.manufacturerId !== manufacturerId) return res.status(403).json({ error: 'Not your proposal' });
    if (proposal.status !== 'pending') return res.status(400).json({ error: 'Only pending proposals can be edited' });

    const updated = await prisma.productProposal.update({
      where: { id: proposalId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(proposedPrice && { proposedPrice: parseFloat(proposedPrice) }),
        ...(unit && { unit }),
      }
    });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating proposal:', error);
    return res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// Delete/withdraw a pending proposal
router.delete('/proposals/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const proposalId = req.params.id as string;

    const proposal = await prisma.productProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.manufacturerId !== manufacturerId) return res.status(403).json({ error: 'Not your proposal' });
    if (proposal.status !== 'pending') return res.status(400).json({ error: 'Only pending proposals can be withdrawn' });

    await prisma.productProposal.delete({ where: { id: proposalId } });
    return res.json({ message: 'Proposal withdrawn' });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return res.status(500).json({ error: 'Failed to withdraw proposal' });
  }
});

// Get manufacturer's orders (for order management, with optional pagination)
router.get('/orders', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const manufacturerId = (req as any).user.id;
    const hasPagination = req.query.page || req.query.limit;

    if (hasPagination) {
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '20');
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { manufacturerId },
          include: { 
            product: true,
            consumer: { select: { id: true, name: true, city: true, pincode: true, phone: true } }
          },
          orderBy: { orderedAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.order.count({ where: { manufacturerId } })
      ]);

      return res.json({
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    } else {
      const orders = await prisma.order.findMany({
        where: { manufacturerId },
        include: { 
          product: true,
          consumer: { select: { id: true, name: true, city: true, pincode: true, phone: true } }
        },
        orderBy: { orderedAt: 'desc' }
      });
      return res.json(orders);
    }
  } catch (error) {
    console.error('Error fetching manufacturer orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
