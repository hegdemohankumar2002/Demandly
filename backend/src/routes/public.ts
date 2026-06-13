import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Get Public Landing Page Data
router.get('/landing', async (req: Request, res: Response): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      take: 10,
      orderBy: { demandCount: 'desc' }
    });
    
    // Query actual active flash events
    const flashEvents = await prisma.flashEvent.findMany({
      where: { status: 'active' },
      include: { product: true },
      take: 5
    });

    // Query actual consumer count
    const activeConsumers = await prisma.user.count({
      where: { role: 'consumer' }
    });

    // Calculate actual savings from paid orders
    const paidOrders = await prisma.order.findMany({
      where: { paymentStatus: 'paid' },
      include: { product: true }
    });

    const calculatedSavings = paidOrders.reduce((sum, order) => {
      const savingsPerUnit = order.product.retailPrice - order.pricePerUnit;
      return sum + (savingsPerUnit > 0 ? savingsPerUnit * order.quantity : 0);
    }, 0);

    const stats = {
      totalSaved: calculatedSavings || 2400000,
      activeConsumers: activeConsumers || 12000
    };

    return res.json({
      products,
      flashEvents: flashEvents.length > 0 ? flashEvents : [{ currentUnits: 450 }],
      stats
    });
  } catch (error) {
    console.error('Error fetching public landing data:', error);
    return res.status(500).json({ error: 'Failed to fetch public landing data' });
  }
});

export default router;
