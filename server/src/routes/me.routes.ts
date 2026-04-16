import { Router } from 'express';
import * as meController from '../controllers/me.controller';
import { authenticate, requirePremium } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/premium-content', requirePremium, meController.listMyPremiumContent);

export { router as meRoutes };
