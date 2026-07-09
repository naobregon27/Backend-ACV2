import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_NAME: z.string().optional(),
  MAX_UPLOAD_IMAGE_BYTES: z.coerce.number().default(15 * 1024 * 1024),
  MAX_UPLOAD_AUDIO_BYTES: z.coerce.number().default(50 * 1024 * 1024),
  MAX_UPLOAD_VIDEO_BYTES: z.coerce.number().default(200 * 1024 * 1024),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  /** Carpeta raíz en Cloudinary (ej. musica-acv). */
  CLOUDINARY_FOLDER: z.string().min(1).default('musica-acv'),
  /** SendGrid — si falta API key, los emails se omiten sin romper la API. */
  SENDGRID_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SENDGRID_FROM_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  SENDGRID_FROM_NAME: z.string().default('ACV2.Music'),
  /** Casilla real donde llegan alertas de contacto y registros (no usar el ADMIN_EMAIL de login). */
  ADMIN_NOTIFICATION_EMAIL: z.preprocess(emptyToUndefined, z.string().email().optional()),
  SITE_NAME: z.string().default('ACV2.Music'),
  PUBLIC_WEB_URL: z.string().url().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const corsOriginsList = env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
