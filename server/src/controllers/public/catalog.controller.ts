import type { RequestHandler } from 'express';
import { MusicTrack } from '../../models/MusicTrack.model';
import { GalleryItem } from '../../models/GalleryItem.model';
import { CommunityEvent } from '../../models/CommunityEvent.model';
import { Poll } from '../../models/Poll.model';
import { PremiumContentItem } from '../../models/PremiumContentItem.model';
import type { IMediaAsset } from '../../models/MediaAsset.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import mongoose from 'mongoose';

/** Extrae la dataUrl de un campo populado (o undefined si no existe). */
function resolveDataUrl(ref: unknown): string | undefined {
  if (!ref || typeof ref !== 'object') return undefined;
  const media = ref as Partial<IMediaAsset>;
  return media.dataUrl ?? media.publicUrl ?? undefined;
}

export const listMusicTracks: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await MusicTrack.find({ published: true })
    .populate('coverMediaId', 'dataUrl publicUrl mimeType')
    .populate('previewMediaId', 'dataUrl publicUrl mimeType')
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    items: items.map((x) => ({
      ...x,
      id: String(x._id),
      _id: undefined,
      coverDataUrl: resolveDataUrl(x.coverMediaId) ?? x.coverImageUrl,
      previewDataUrl: resolveDataUrl(x.previewMediaId) ?? x.previewAudioUrl,
    })),
  });
});

export const listGallery: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await GalleryItem.find({ published: true })
    .populate('thumbnailMediaId', 'dataUrl publicUrl mimeType')
    .populate('detailImageMediaId', 'dataUrl publicUrl mimeType')
    .populate('detailVideoMediaId', 'dataUrl publicUrl mimeType')
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    items: items.map((x) => ({
      ...x,
      id: String(x._id),
      _id: undefined,
      thumbnailDataUrl: resolveDataUrl(x.thumbnailMediaId) ?? x.thumbnailImageUrl,
      detailImageDataUrl: resolveDataUrl(x.detailImageMediaId) ?? x.detailImageUrl,
      detailVideoDataUrl: resolveDataUrl(x.detailVideoMediaId) ?? x.detailVideoUrl ?? x.externalVideoUrl,
    })),
  });
});

export const listCommunityEvents: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await CommunityEvent.find({ published: true }).sort({ sortOrder: 1, startsAt: 1 }).lean();
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    items: items.map((x) => ({
      ...x,
      id: String(x._id),
      _id: undefined,
      startsAt: x.startsAt?.toISOString(),
    })),
  });
});

export const getPollPublic: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const poll = await Poll.findOne({ _id: id, published: true }).lean();
  if (!poll) throw new ApiError(404, 'POLL_NOT_FOUND', 'Encuesta no encontrada');
  const totalVotes = poll.options.reduce((s, o) => s + (o.voteCount || 0), 0);
  res.set('Cache-Control', 'public, max-age=15');
  res.json({
    id: String(poll._id),
    title: poll.title,
    startsAt: poll.startsAt,
    endsAt: poll.endsAt,
    totalVotes,
    options: poll.options
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => ({
        id: String(o._id),
        label: o.label,
        musicTrackId: o.musicTrackId ? String(o.musicTrackId) : undefined,
        voteCount: o.voteCount || 0,
        percentage: totalVotes > 0 ? Math.round(((o.voteCount || 0) / totalVotes) * 1000) / 10 : 0,
      })),
  });
});

export const listPremiumPreview: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await PremiumContentItem.find({ published: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();
  res.set('Cache-Control', 'public, max-age=30');
  res.json({
    items: items.map((x) => ({
      id: String(x._id),
      title: x.title,
      description: x.description,
      ctaLabel: x.ctaLabel,
      contentType: x.contentType,
      requiresAuth: x.requiresAuth,
      requiresPremium: x.requiresPremium,
    })),
  });
});
