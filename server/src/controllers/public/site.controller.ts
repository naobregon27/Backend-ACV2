import type { RequestHandler } from 'express';
import { SiteConfig } from '../../models/SiteConfig.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

export const getSiteConfig: RequestHandler = asyncHandler(async (_req, res) => {
  const doc = await SiteConfig.findOne({ key: 'default' }).lean();
  if (!doc) throw new ApiError(404, 'SITE_CONFIG_NOT_FOUND', 'Configuración no inicializada');
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    navLinks: doc.navLinks.filter((l) => l.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    socialLinks: doc.socialLinks.filter((l) => l.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    highlights: doc.highlights.filter((h) => h.visible).sort((a, b) => a.sortOrder - b.sortOrder),
    siteSettings: doc.siteSettings,
  });
});
