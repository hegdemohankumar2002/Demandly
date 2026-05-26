import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { verifyAuth } from '../middlewares/auth';
import { cacheGet } from '../cache/redis';
import { resolveAuction } from '../utils/auction';

const router = Router();

// Get Admin Stats (cached for 60s)
router.get('/stats', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const stats = await cacheGet('admin:stats', 60, async () => {
      const activeConsumers = await prisma.user.count({ where: { role: 'consumer' } });
      const verifiedManufacturers = await prisma.user.count({ where: { role: 'manufacturer' } });
      const pendingVerifications = 0;

      // Real commission from orders
      const orders = await prisma.order.aggregate({
        _sum: { commissionAmount: true },
        where: { paymentStatus: 'paid' }
      });
      const commissionEarned = orders._sum.commissionAmount || 0;

      return {
        activeConsumers,
        verifiedManufacturers,
        pendingVerifications,
        commissionEarned
      };
    });

    return res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

// Get Pending Verifications
router.get('/verifications/pending', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    // Return empty array for now since we don't have a strict verification workflow yet
    return res.json([]);
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return res.status(500).json({ error: 'Failed to fetch verifications' });
  }
});

// Approve a Manufacturer
router.post('/verifications/:id/approve', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { verified: true }
    });
    return res.json({ message: 'Manufacturer approved', user });
  } catch (error) {
    console.error('Error approving manufacturer:', error);
    return res.status(500).json({ error: 'Failed to approve' });
  }
});

// Reject a Manufacturer
router.post('/verifications/:id/reject', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { verified: false }
    });
    return res.json({ message: 'Manufacturer rejected', user });
  } catch (error) {
    console.error('Error rejecting manufacturer:', error);
    return res.status(500).json({ error: 'Failed to reject' });
  }
});

// Get All Users
router.get('/users', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, name: true, email: true, role: true, city: true, pincode: true,
        phone: true, companyName: true, verified: true, createdAt: true,
        _count: { select: { interests: true, bids: true, campaigns: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get All Demand Pools (admin view)
router.get('/demand-pools', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const pools = await prisma.demandPool.findMany({
      include: { product: true, bids: { select: { id: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(pools);
  } catch (error) {
    console.error('Error fetching demand pools:', error);
    return res.status(500).json({ error: 'Failed to fetch demand pools' });
  }
});

// Update Demand Pool Status (admin can start auction, close, etc.)
router.put('/demand-pools/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { status } = req.body;
    const poolId = req.params.id as string;

    const pool = await prisma.demandPool.findUnique({
      where: { id: poolId },
      include: { product: true }
    });

    if (!pool) {
      return res.status(404).json({ error: 'Demand pool not found' });
    }

    if (status === 'auction_active') {
      // 1. Read platform settings (or default to 48 hours) to set the auction's final closing deadline.
      const settings = await prisma.platformSettings.findUnique({
        where: { id: 'default' }
      });
      const durationHours = settings?.auctionDurationHours ?? 48;
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + durationHours);

      // 2. Update pool status and deadline
      const updatedPool = await prisma.demandPool.update({
        where: { id: poolId },
        data: {
          status: 'auction_active',
          deadline
        }
      });

      // 3. Find and update all associated consumer interests to auction_active
      const consumersInPincode = await prisma.user.findMany({
        where: { pincode: pool.pincode, role: 'consumer' },
        select: { id: true }
      });
      const consumerIds = consumersInPincode.map(c => c.id);

      if (consumerIds.length > 0) {
        await prisma.interest.updateMany({
          where: {
            productId: pool.productId,
            userId: { in: consumerIds },
            status: { in: ['aggregating', 'threshold_met'] }
          },
          data: { status: 'auction_active' }
        });
      }

      // 4. Notify all manufacturers
      const manufacturers = await prisma.user.findMany({
        where: { role: 'manufacturer' },
        select: { id: true }
      });

      for (const manufacturer of manufacturers) {
        await prisma.notification.create({
          data: {
            userId: manufacturer.id,
            type: 'general',
            title: '📢 New Auction Started!',
            message: `A new auction for "${pool.product.name}" in ${pool.geography} is now active. Place your bids!`,
            actionUrl: `/manufacturer/active-auctions`
          }
        });
      }

      return res.json(updatedPool);
    } else if (status === 'fulfilled' || status === 'closed') {
      // Execute the winner-determination and order-creation routine
      await resolveAuction(poolId);

      // Fetch the updated pool status
      const updatedPool = await prisma.demandPool.findUnique({
        where: { id: poolId },
        include: { product: true }
      });

      return res.json(updatedPool);
    } else {
      const updatedPool = await prisma.demandPool.update({
        where: { id: poolId },
        data: { status }
      });
      return res.json(updatedPool);
    }
  } catch (error) {
    console.error('Error updating demand pool:', error);
    return res.status(500).json({ error: 'Failed to update demand pool' });
  }
});

// ──────────────────────────────────────────────
// PLATFORM SETTINGS
// ──────────────────────────────────────────────

// Get Platform Settings (upserts default row if none exists)
router.get('/settings', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: { id: 'default' }
    });
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update Platform Settings
router.put('/settings', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      platformName, currency, region,
      defaultThreshold, auctionDurationHours, autoCloseNoActivityHrs,
      commissionPercent, flashEventMinUnits, campaignVoteGoal,
      emailNewRegistrations, emailThresholdMet, emailDailyDigest, emailNewDemandPools,
      requireEmailVerification, twoFactorForAdmins, autoLockAfterAttempts,
    } = req.body;

    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {
        ...(platformName !== undefined && { platformName }),
        ...(currency !== undefined && { currency }),
        ...(region !== undefined && { region }),
        ...(defaultThreshold !== undefined && { defaultThreshold }),
        ...(auctionDurationHours !== undefined && { auctionDurationHours }),
        ...(autoCloseNoActivityHrs !== undefined && { autoCloseNoActivityHrs }),
        ...(commissionPercent !== undefined && { commissionPercent }),
        ...(flashEventMinUnits !== undefined && { flashEventMinUnits }),
        ...(campaignVoteGoal !== undefined && { campaignVoteGoal }),
        ...(emailNewRegistrations !== undefined && { emailNewRegistrations }),
        ...(emailThresholdMet !== undefined && { emailThresholdMet }),
        ...(emailDailyDigest !== undefined && { emailDailyDigest }),
        ...(emailNewDemandPools !== undefined && { emailNewDemandPools }),
        ...(requireEmailVerification !== undefined && { requireEmailVerification }),
        ...(twoFactorForAdmins !== undefined && { twoFactorForAdmins }),
        ...(autoLockAfterAttempts !== undefined && { autoLockAfterAttempts }),
      }
    });
    return res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ──────────────────────────────────────────────
// PRODUCT PROPOSAL APPROVALS
// ──────────────────────────────────────────────

// Get pending proposals
router.get('/proposals/pending', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const proposals = await prisma.productProposal.findMany({
      where: { status: 'pending' },
      include: {
        manufacturer: {
          select: { name: true, companyName: true, rating: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(proposals);
  } catch (error) {
    console.error('Error fetching pending proposals:', error);
    return res.status(500).json({ error: 'Failed to fetch pending proposals' });
  }
});

// Approve a proposal
router.post('/proposals/:id/approve', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { demandThreshold, retailPrice } = req.body;

    if (!demandThreshold) {
      return res.status(400).json({ error: 'Demand threshold is required' });
    }

    const proposal = await prisma.productProposal.findUnique({ where: { id: id as string } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    if (proposal.status !== 'pending') return res.status(400).json({ error: 'Proposal already processed' });

    // Create the actual product
    const product = await prisma.product.create({
      data: {
        name: proposal.name,
        description: proposal.description,
        category: proposal.category,
        image: proposal.image || '',
        retailPrice: retailPrice || proposal.proposedPrice,
        demandThreshold: parseInt(demandThreshold),
        unit: proposal.unit,
        tags: []
      }
    });

    // Mark proposal as approved
    await prisma.productProposal.update({
      where: { id: id as string },
      data: { status: 'approved' }
    });

    // (Optional) Automatically create a demand pool aggregating stage here if you want it to immediately start gathering demand
    // For now, consumers can just see it in the catalog and register interest.

    return res.json({ message: 'Product approved and added to catalog', product });
  } catch (error) {
    console.error('Error approving proposal:', error);
    return res.status(500).json({ error: 'Failed to approve proposal' });
  }
});

// Reject a proposal
router.post('/proposals/:id/reject', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const proposal = await prisma.productProposal.findUnique({ where: { id: id as string } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

    await prisma.productProposal.update({
      where: { id: id as string },
      data: { status: 'rejected' }
    });

    // Notify the manufacturer
    await prisma.notification.create({
      data: {
        userId: proposal.manufacturerId,
        type: 'general',
        title: '❌ Proposal Rejected',
        message: `Your product proposal "${proposal.name}" was not approved.${reason ? ` Reason: ${reason}` : ''} You may edit and resubmit.`,
        actionUrl: `/manufacturer/propose-product`
      }
    });

    return res.json({ message: 'Proposal rejected' });
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    return res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

// Edit a pending proposal (admin can adjust before approving)
router.put('/proposals/:id', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const proposalId = req.params.id as string;
    const { name, description, category, proposedPrice, unit } = req.body;

    const proposal = await prisma.productProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
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

// ──────────────────────────────────────────────
// ORDERS (Admin view)
// ──────────────────────────────────────────────

// Get all orders (admin overview)
router.get('/orders', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true,
        consumer: { select: { id: true, name: true, city: true, pincode: true, phone: true } },
        manufacturer: { select: { id: true, name: true, companyName: true, city: true } }
      },
      orderBy: { orderedAt: 'desc' }
    });
    return res.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Update order status (admin can force status changes)
router.put('/orders/:id/status', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const orderId = req.params.id as string;
    const { status, trackingId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingId && { trackingId }),
        ...(status === 'delivered' && { deliveredAt: new Date(), paymentStatus: 'paid' })
      }
    });

    // Notify the consumer about status change
    const statusMessages: Record<string, string> = {
      'manufacturing': `Your order for "${order.product.name}" is now being manufactured!`,
      'shipped': `Your order for "${order.product.name}" has been shipped!${trackingId ? ` Tracking: ${trackingId}` : ''}`,
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

export default router;
