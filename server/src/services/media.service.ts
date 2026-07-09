import { env } from '../config/env';
import { MediaAsset, type IMediaAssetDocument } from '../models/MediaAsset.model';
import { ApiError } from '../utils/ApiError';
import { uploadBufferToCloudinary } from './cloudinary.service';

/** Límite seguro para subida vía JSON base64 antes de enviar a Cloudinary. */
const MONGO_DOC_SAFE_BYTES = 15 * 1024 * 1024;

export function maxBytesForMime(mime: string): number {
  if (mime.startsWith('image/')) return Math.min(env.MAX_UPLOAD_IMAGE_BYTES, MONGO_DOC_SAFE_BYTES);
  if (mime.startsWith('audio/')) return Math.min(env.MAX_UPLOAD_AUDIO_BYTES, MONGO_DOC_SAFE_BYTES);
  if (mime.startsWith('video/')) return Math.min(env.MAX_UPLOAD_VIDEO_BYTES, MONGO_DOC_SAFE_BYTES);
  return Math.min(env.MAX_UPLOAD_IMAGE_BYTES, MONGO_DOC_SAFE_BYTES);
}

export function isAllowedMediaMime(mime: string): boolean {
  return (
    mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')
  );
}

export function assertMediaSize(mimeType: string, sizeBytes: number): void {
  const max = maxBytesForMime(mimeType);
  if (sizeBytes > max) {
    throw new ApiError(413, 'FILE_TOO_LARGE', `El archivo supera el límite para ${mimeType}`);
  }
}

/** Acepta base64 puro o `data:mime;base64,...` en el body JSON del admin. */
export function parseBase64Field(fileBase64: string): { base64: string; mimeFromDataUrl?: string } {
  const oneLine = fileBase64.trim().replace(/\r?\n/g, '');
  const dataUrl = /^data:([^;]+);base64,(.*)$/is.exec(oneLine);
  if (dataUrl) {
    return {
      mimeFromDataUrl: dataUrl[1].trim(),
      base64: dataUrl[2].replace(/\s/g, ''),
    };
  }
  return { base64: oneLine.replace(/\s/g, '') };
}

export function extensionForMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/webm': '.weba',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
  };
  return map[mime.toLowerCase()] || '';
}

export function defaultOriginalNameForMime(mime: string): string {
  return `upload${extensionForMime(mime) || '.bin'}`;
}

/** Sube el buffer a Cloudinary y guarda metadatos en MongoDB (sin base64). */
export async function persistBufferAsMediaAsset(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<IMediaAssetDocument> {
  const uploaded = await uploadBufferToCloudinary(params);

  return MediaAsset.create({
    originalName: params.originalName,
    storedName: uploaded.publicId.split('/').pop() ?? uploaded.publicId,
    mimeType: params.mimeType,
    sizeBytes: uploaded.bytes,
    relativePath: env.CLOUDINARY_FOLDER,
    publicUrl: uploaded.secureUrl,
    cloudinaryPublicId: uploaded.publicId,
    width: uploaded.width,
    height: uploaded.height,
    durationSeconds: uploaded.duration,
  });
}

export function mediaPublic(m: IMediaAssetDocument) {
  return {
    id: String(m._id),
    originalName: m.originalName,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    publicUrl: m.publicUrl,
    cloudinaryPublicId: m.cloudinaryPublicId,
    width: m.width,
    height: m.height,
    durationSeconds: m.durationSeconds,
    createdAt: m.createdAt,
  };
}

export async function getMediaById(id: string): Promise<IMediaAssetDocument | null> {
  return MediaAsset.findById(id);
}
