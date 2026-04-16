import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { mediaBase64UploadSchema } from '../validators/media.schemas';
import * as users from '../controllers/admin/users.controller';
import * as media from '../controllers/admin/media.controller';
import * as site from '../controllers/admin/site.controller';
import * as music from '../controllers/admin/music.controller';
import * as gallery from '../controllers/admin/gallery.controller';
import * as events from '../controllers/admin/events.controller';
import * as polls from '../controllers/admin/polls.controller';
import * as premium from '../controllers/admin/premium.controller';
import * as contacts from '../controllers/admin/contact.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', users.listUsers);
router.patch('/users/:id', users.patchUser);

router.post(
  '/media/upload',
  validateBody(mediaBase64UploadSchema),
  media.uploadMedia,
);
router.get('/media', media.listMedia);
router.get('/media/:id', media.getMedia);

router.get('/site-config', site.getSiteConfigAdmin);
router.put('/site-config', site.updateSiteConfig);

router.get('/music-tracks', music.listMusicAdmin);
router.post('/music-tracks', music.createMusic);
router.patch('/music-tracks/:id', music.updateMusic);
router.delete('/music-tracks/:id', music.deleteMusic);

router.get('/gallery', gallery.listGalleryAdmin);
router.post('/gallery', gallery.createGallery);
router.patch('/gallery/:id', gallery.updateGallery);
router.delete('/gallery/:id', gallery.deleteGallery);

router.get('/community-events', events.listEventsAdmin);
router.post('/community-events', events.createEvent);
router.patch('/community-events/:id', events.updateEvent);
router.delete('/community-events/:id', events.deleteEvent);

router.get('/polls', polls.listPollsAdmin);
router.post('/polls', polls.createPoll);
router.patch('/polls/:id', polls.updatePoll);
router.delete('/polls/:id', polls.deletePoll);

router.get('/premium-content', premium.listPremiumAdmin);
router.post('/premium-content', premium.createPremium);
router.patch('/premium-content/:id', premium.updatePremium);
router.delete('/premium-content/:id', premium.deletePremium);

router.get('/contact-messages', contacts.listContactsAdmin);
router.patch('/contact-messages/:id', contacts.patchContactStatus);

export { router as adminRoutes };
