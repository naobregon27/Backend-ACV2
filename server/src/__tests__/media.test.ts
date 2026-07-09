import request from 'supertest';
import { createApp } from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './setup/dbHelper';

const app = createApp();

/** PNG de 1×1 px en base64 puro (37 bytes reales, 100% válido) */
const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

/** MP3 mínimo válido en base64 (silencio de 1 frame) */
const MP3_TINY_BASE64 =
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';

const CLOUDINARY_URL_PATTERN = /^https:\/\/res\.cloudinary\.com\//;

let adminToken: string;

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  const User = (await import('../models/User.model')).User;
  const { hashPassword } = await import('../services/auth.service');
  await User.create({
    name: 'Admin',
    email: 'admin@test.com',
    passwordHash: await hashPassword('Admin1234!'),
    role: 'admin',
    isBlocked: false,
    hasPremiumAccess: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin1234!' });
  adminToken = login.body.accessToken;
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('POST /api/v1/admin/media/upload', () => {
  it('sube una imagen PNG y devuelve URL de Cloudinary', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fileBase64: PNG_1X1_BASE64,
        mimeType: 'image/png',
        originalName: 'pixel.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.media).toHaveProperty('id');
    expect(res.body.media.publicUrl).toMatch(CLOUDINARY_URL_PATTERN);
    expect(res.body.media.cloudinaryPublicId).toMatch(/^musica-acv\//);
    expect(res.body.media.mimeType).toBe('image/png');
    expect(res.body.media.sizeBytes).toBeGreaterThan(0);
  });

  it('sube imagen usando data URL completa (data:mime;base64,...)', async () => {
    const dataUrl = `data:image/png;base64,${PNG_1X1_BASE64}`;
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: dataUrl });

    expect(res.status).toBe(201);
    expect(res.body.media.mimeType).toBe('image/png');
    expect(res.body.media.publicUrl).toMatch(CLOUDINARY_URL_PATTERN);
  });

  it('rechaza tipo MIME no permitido (400)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fileBase64: PNG_1X1_BASE64,
        mimeType: 'application/pdf',
        originalName: 'doc.pdf',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_FILE_TYPE');
  });

  it('rechaza sin autenticación (401)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .send({ fileBase64: PNG_1X1_BASE64, mimeType: 'image/png' });
    expect(res.status).toBe(401);
  });

  it('rechaza base64 vacío o inválido (400)', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: '!!!not-base64!!!', mimeType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('sube audio MP3 y devuelve URL de Cloudinary', async () => {
    const res = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fileBase64: MP3_TINY_BASE64,
        mimeType: 'audio/mpeg',
        originalName: 'silence.mp3',
      });

    expect(res.status).toBe(201);
    expect(res.body.media.publicUrl).toMatch(CLOUDINARY_URL_PATTERN);
    expect(res.body.media.mimeType).toBe('audio/mpeg');
  });
});

describe('GET /api/v1/admin/media', () => {
  it('devuelve lista paginada de assets (vacía inicialmente)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/media')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body).toHaveProperty('meta');
  });

  it('devuelve el asset subido con publicUrl de Cloudinary', async () => {
    await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: PNG_1X1_BASE64, mimeType: 'image/png', originalName: 'test.png' });

    const res = await request(app)
      .get('/api/v1/admin/media')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].publicUrl).toMatch(CLOUDINARY_URL_PATTERN);
  });
});

describe('GET /api/v1/admin/media/:id', () => {
  it('devuelve el asset por ID con publicUrl de Cloudinary', async () => {
    const upload = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: PNG_1X1_BASE64, mimeType: 'image/png', originalName: 'test.png' });

    const { id } = upload.body.media;
    const res = await request(app)
      .get(`/api/v1/admin/media/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.media.id).toBe(id);
    expect(res.body.media.publicUrl).toMatch(CLOUDINARY_URL_PATTERN);
  });

  it('devuelve 404 para ID inexistente', async () => {
    const res = await request(app)
      .get('/api/v1/admin/media/000000000000000000000001')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('devuelve 400 para ID con formato inválido', async () => {
    const res = await request(app)
      .get('/api/v1/admin/media/no-es-un-objectid')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
