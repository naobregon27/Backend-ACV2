import type { RequestHandler } from 'express';
import { SiteConfig } from '../../models/SiteConfig.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

export const getSiteConfigAdmin: RequestHandler = asyncHandler(async (_req, res) => {
  const doc = await SiteConfig.findOne({ key: 'default' });
  if (!doc) throw new ApiError(404, 'SITE_CONFIG_NOT_FOUND', 'Configuración no inicializada');
  res.json({
    id: String(doc._id),
    navLinks: doc.navLinks,
    socialLinks: doc.socialLinks,
    highlights: doc.highlights,
    siteSettings: doc.siteSettings,
  });
});

export const updateSiteConfig: RequestHandler = asyncHandler(async (req, res) => {
  const { navLinks, socialLinks, highlights, siteSettings } = req.body as {
    navLinks?: unknown;
    socialLinks?: unknown;
    highlights?: unknown;
    siteSettings?: unknown;
  };
  const doc = await SiteConfig.findOne({ key: 'default' });
  if (!doc) throw new ApiError(404, 'SITE_CONFIG_NOT_FOUND', 'Configuración no inicializada');
  if (Array.isArray(navLinks)) {
    doc.set('navLinks', navLinks);
    doc.markModified('navLinks');
  }
  if (Array.isArray(socialLinks)) {
    doc.set('socialLinks', socialLinks);
    doc.markModified('socialLinks');
  }
  if (Array.isArray(highlights)) {
    doc.set('highlights', highlights);
    doc.markModified('highlights');
  }
  if (siteSettings && typeof siteSettings === 'object') {
    doc.set('siteSettings', { ...doc.siteSettings, ...(siteSettings as object) });
    doc.markModified('siteSettings');
  }
  await doc.save();
  res.json({ ok: true });
});
