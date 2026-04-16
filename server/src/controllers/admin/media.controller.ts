import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { MediaAsset } from '../../models/MediaAsset.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import {
  assertMediaSize,
  defaultOriginalNameForMime,
  isAllowedMediaMime,
  mediaPublic,
  parseBase64Field,
  persistBufferAsMediaAsset,
} from '../../services/media.service';
import { parsePagination, paginationMeta } from '../../utils/pagination';
import type { MediaBase64UploadInput } from '../../validators/media.schemas';

export const uploadMedia: RequestHandler = asyncHandler(async (req, res) => {
  const body = req.body as MediaBase64UploadInput;
  const { base64, mimeFromDataUrl } = parseBase64Field(body.fileBase64);
  const mimeType = (mimeFromDataUrl ?? body.mimeType)?.trim();
  if (!mimeType) {
    throw new ApiError(
      400,
      'MIME_REQUIRED',
      'Indica mimeType en el JSON o usa data URL (data:mime;base64,...)',
    );
  }
  if (!isAllowedMediaMime(mimeType)) {
    throw new ApiError(400, 'INVALID_FILE_TYPE', 'Tipo de archivo no permitido');
  }
  const buffer = Buffer.from(base64, 'base64');
  if (!buffer.length) {
    throw new ApiError(400, 'INVALID_BASE64', 'No se pudo decodificar el base64');
  }
  assertMediaSize(mimeType, buffer.length);
  const originalName = body.originalName?.trim() || defaultOriginalNameForMime(mimeType);
  const doc = await persistBufferAsMediaAsset({ buffer, originalName, mimeType });
  res.status(201).json({ media: mediaPublic(doc) });
});

export const listMedia: RequestHandler = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query as { page?: string; pageSize?: string });
  const [total, rows] = await Promise.all([
    MediaAsset.countDocuments({}),
    MediaAsset.find({}).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
  ]);
  res.json({
    items: rows.map((m) => ({ ...m, id: String(m._id), _id: undefined })),
    meta: paginationMeta(total, page, pageSize),
  });
});

export const getMedia: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const m = await MediaAsset.findById(id);
  if (!m) throw new ApiError(404, 'MEDIA_NOT_FOUND', 'Medio no encontrado');
  res.json({ media: mediaPublic(m) });
});
