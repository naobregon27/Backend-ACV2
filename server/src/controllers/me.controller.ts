import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { PremiumContentItem } from '../models/PremiumContentItem.model';
import { MediaAsset } from '../models/MediaAsset.model';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

async function resolveMediaUrl(mediaId?: mongoose.Types.ObjectId | null): Promise<string | undefined> {
  if (!mediaId) return undefined;
  const m = await MediaAsset.findById(mediaId).lean();
  return m?.publicUrl;
}

export const listMyPremiumContent: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'No autenticado');
  if (!req.user.hasPremiumAccess) {
    throw new ApiError(403, 'PREMIUM_REQUIRED', 'Se requiere acceso premium');
  }
  const items = await PremiumContentItem.find({ published: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  const out = [];
  for (const x of items) {
    const mediaUrl = await resolveMediaUrl(x.mediaId as mongoose.Types.ObjectId | undefined);
    const downloadUrl = await resolveMediaUrl(x.downloadMediaId as mongoose.Types.ObjectId | undefined);
    out.push({
      id: String(x._id),
      title: x.title,
      description: x.description,
      ctaLabel: x.ctaLabel,
      contentType: x.contentType,
      mediaUrl,
      externalUrl: x.externalUrl,
      downloadUrl,
      requiresAuth: x.requiresAuth,
      requiresPremium: x.requiresPremium,
    });
  }
  res.json({ items: out });
});
