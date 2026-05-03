import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as site from '../controllers/public/site.controller';
import * as catalog from '../controllers/public/catalog.controller';
import * as contact from '../controllers/public/contact.controller';
import * as pollVote from '../controllers/public/pollVote.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { contactMessageSchema } from '../validators/contact.schemas';
import { voteSchema } from '../validators/poll.schemas';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.get('/site-config', site.getSiteConfig);
router.get('/music-tracks', catalog.listMusicTracks);
router.get('/gallery', catalog.listGallery);
router.get('/community-events', catalog.listCommunityEvents);
router.get('/polls/:id', catalog.getPollPublic);
router.post('/polls/:id/vote', authenticate, validateBody(voteSchema), pollVote.votePoll);
router.get('/premium-preview', catalog.listPremiumPreview);
router.post(
  '/contact-messages',
  contactLimiter,
  validateBody(contactMessageSchema),
  contact.createContactMessage,
);

export { router as publicRoutes };
