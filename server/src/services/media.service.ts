import { env } from '../config/env';
import { MediaAsset, type IMediaAssetDocument } from '../models/MediaAsset.model';
import { ApiError } from '../utils/ApiError';

/** Límite seguro para un documento MongoDB (16 MB). Reservamos 512 KB para metadatos. */
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

/** Acepta base64 puro o `data:mime;base64,...`. */
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

/**
 * Persiste el archivo como base64 directamente en MongoDB.
 * El campo `dataUrl` queda como `data:<mime>;base64,<datos>` listo para
 * ser usado en `<img src>`, `<audio src>`, `<video src>` desde el frontend.
 */
export async function persistBufferAsMediaAsset(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}): Promise<IMediaAssetDocument> {
  const base64 = params.buffer.toString('base64');
  const dataUrl = `data:${params.mimeType};base64,${base64}`;

  return MediaAsset.create({
    originalName: params.originalName,
    storedName: '',
    mimeType: params.mimeType,
    sizeBytes: params.buffer.length,
    relativePath: '',
    publicUrl: dataUrl,
    dataUrl,
  });
}

export function mediaPublic(m: IMediaAssetDocument) {
  return {
    id: String(m._id),
    originalName: m.originalName,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    publicUrl: m.publicUrl,
    dataUrl: m.dataUrl ?? m.publicUrl,
    width: m.width,
    height: m.height,
    durationSeconds: m.durationSeconds,
    createdAt: m.createdAt,
  };
}

export async function getMediaById(id: string): Promise<IMediaAssetDocument | null> {
  return MediaAsset.findById(id);
}

