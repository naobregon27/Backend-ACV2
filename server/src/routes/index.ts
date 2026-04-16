import { Router, type RequestHandler } from 'express';
import { authRoutes } from './auth.routes';
import { publicRoutes } from './public.routes';
import { meRoutes } from './me.routes';
import { adminRoutes } from './admin.routes';

const router = Router();

const health: RequestHandler = (_req, res) => {
  res.json({ status: 'ok', service: 'acv2-music-api' });
};

router.get('/health', health);

router.use('/auth', authRoutes);
router.use('/public', publicRoutes);
router.use('/me', meRoutes);
router.use('/admin', adminRoutes);

export { router as apiV1Router };
