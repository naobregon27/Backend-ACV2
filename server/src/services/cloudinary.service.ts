import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  resourceType: 'image' | 'video' | 'raw';
}

function resourceTypeForMime(mime: string): 'image' | 'video' | 'raw' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'video';
  return 'raw';
}

function sanitizePublicIdBase(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return (
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80) || 'upload'
  );
}

export async function uploadBufferToCloudinary(params: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}): Promise<CloudinaryUploadResult> {
  const resourceType = resourceTypeForMime(params.mimeType);
  const publicId = `${sanitizePublicIdBase(params.originalName)}-${uuidv4().slice(0, 8)}`;

  try {
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.CLOUDINARY_FOLDER,
          public_id: publicId,
          resource_type: resourceType,
          use_filename: false,
          unique_filename: false,
          overwrite: false,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({
            publicId: uploadResult.public_id,
            secureUrl: uploadResult.secure_url,
            bytes: uploadResult.bytes,
            width: uploadResult.width,
            height: uploadResult.height,
            duration: uploadResult.duration,
            resourceType,
          });
        },
      );
      stream.end(params.buffer);
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al subir a Cloudinary';
    throw new ApiError(502, 'CLOUDINARY_UPLOAD_FAILED', message);
  }
}
