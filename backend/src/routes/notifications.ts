import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { verifyAuth } from '../middlewares/auth';

const router = Router();

// Get notifications for the current user (+ global notifications)
router.get('/', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { userId: null } // global/admin notifications
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    const count = await prisma.notification.count({
      where: {
        read: false,
        OR: [
          { userId },
          { userId: null }
        ]
      }
    });
    return res.json({ count });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get count' });
  }
});

// Mark a notification as read
router.put('/:id/read', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id as string },
      data: { read: true }
    });
    return res.json(notification);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// Mark all as read
router.put('/mark-all-read', verifyAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = (req as any).user.id;
    await prisma.notification.updateMany({
      where: {
        read: false,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      data: { read: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
