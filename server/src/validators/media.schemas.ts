import { z } from 'zod';

/** Cuerpo JSON: archivo en base64 (puro o data URL) → se sube a Cloudinary. */
export const mediaBase64UploadSchema = z.object({
  fileBase64: z.string().min(1, 'fileBase64 requerido'),
  mimeType: z.string().min(1).optional(),
  originalName: z.string().min(1).max(512).optional(),
});

export type MediaBase64UploadInput = z.infer<typeof mediaBase64UploadSchema>;
