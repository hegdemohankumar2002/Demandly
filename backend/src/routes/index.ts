import { Router, Request, Response } from 'express';
import authRouter from './auth';
import manufacturerRouter from './manufacturer';
import consumerRouter from './consumer';
import adminRouter from './admin';
import publicRouter from './public';
import notificationsRouter from './notifications';
import paymentRouter from './payment';
import uploadRouter from './upload';
// We'll apply apiKeyAuth conditionally or differently if needed, 
// since auth routes usually shouldn't require an api key if they are public.
// But for now, we can leave it or remove it. Let's remove the global apiKeyAuth 
// and only apply it to specific routes later, or just keep it and ensure the frontend sends the key.

const router = Router();

// router.use(apiKeyAuth); // commented out to allow public login/register

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running and accessible.' });
});

router.use('/auth', authRouter);
router.use('/manufacturer', manufacturerRouter);
router.use('/consumer', consumerRouter);
router.use('/admin', adminRouter);
router.use('/public', publicRouter);
router.use('/notifications', notificationsRouter);
router.use('/payment', paymentRouter);
router.use('/upload', uploadRouter);

export default router;
