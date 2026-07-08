import { Router, Request, Response } from 'express';
import { apiKeyAuth } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import authRouter from './auth';
import manufacturerRouter from './manufacturer';
import consumerRouter from './consumer';
import adminRouter from './admin';
import publicRouter from './public';
import notificationsRouter from './notifications';
import paymentRouter from './payment';
import uploadRouter from './upload';

const router = Router();
const v1Router = Router();

// All routes under /api/v1/*

// Public routes (still versioned per design decision)
v1Router.use('/auth', authLimiter, authRouter);
v1Router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running and accessible.' });
});

// Protected routes with API key auth
v1Router.use(apiKeyAuth);
v1Router.use('/manufacturer', manufacturerRouter);
v1Router.use('/consumer', consumerRouter);
v1Router.use('/admin', adminRouter);
v1Router.use('/public', publicRouter);
v1Router.use('/notifications', notificationsRouter);
v1Router.use('/payment', paymentRouter);
v1Router.use('/upload', uploadRouter);

router.use('/api/v1', v1Router);

export default router;