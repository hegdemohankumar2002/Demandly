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
    
    // Create some dummy mock flash events for display since we don't have flash events populated
    const flashEvents = [
      { currentUnits: 450 }
    ];

    const stats = {
      totalSaved: 2400000,
      activeConsumers: 12000
    };

    return res.json({
      products,
      flashEvents,
      stats
    });
  } catch (error) {
    console.error('Error fetching public landing data:', error);
    return res.status(500).json({ error: 'Failed to fetch public landing data' });
  }
});

export default router;
