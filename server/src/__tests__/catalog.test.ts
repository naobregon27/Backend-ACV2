import request from 'supertest';
import { createApp } from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './setup/dbHelper';

const app = createApp();

const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

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
    email: 'admin@catalog.com',
    passwordHash: await hashPassword('Admin1234!'),
    role: 'admin',
    isBlocked: false,
    hasPremiumAccess: true,
  });
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@catalog.com', password: 'Admin1234!' });
  adminToken = login.body.accessToken;
});

afterAll(async () => {
  await disconnectTestDB();
});

// ─── Galería ─────────────────────────────────────────────────────────────────

describe('GET /api/v1/public/gallery', () => {
  it('devuelve lista vacía cuando no hay ítems publicados', async () => {
    const res = await request(app).get('/api/v1/public/gallery');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('devuelve galería con thumbnailDataUrl populado desde MediaAsset', async () => {
    // Subir imagen
    const mediaRes = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: PNG_1X1_BASE64, mimeType: 'image/png', originalName: 'thumb.png' });
    const mediaId = mediaRes.body.media.id;

    // Crear ítem de galería apuntando al MediaAsset
    await request(app)
      .post('/api/v1/admin/gallery')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Foto del show',
        category: 'show',
        detailMediaType: 'image',
        thumbnailMediaId: mediaId,
        published: true,
        sortOrder: 0,
      });

    const res = await request(app).get('/api/v1/public/gallery');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);

    const item = res.body.items[0];
    expect(item.title).toBe('Foto del show');
    // El thumbnailDataUrl debe resolverse desde el MediaAsset
    expect(item.thumbnailDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('no devuelve ítems no publicados', async () => {
    await request(app)
      .post('/api/v1/admin/gallery')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Oculto',
        category: 'backstage',
        detailMediaType: 'image',
        published: false,
        sortOrder: 0,
      });

    const res = await request(app).get('/api/v1/public/gallery');
    expect(res.body.items).toHaveLength(0);
  });
});

// ─── Música ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/public/music-tracks', () => {
  it('devuelve lista vacía cuando no hay tracks publicados', async () => {
    const res = await request(app).get('/api/v1/public/music-tracks');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('devuelve tracks con coverDataUrl populado desde MediaAsset', async () => {
    const mediaRes = await request(app)
      .post('/api/v1/admin/media/upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fileBase64: PNG_1X1_BASE64, mimeType: 'image/png', originalName: 'cover.png' });
    const mediaId = mediaRes.body.media.id;

    await request(app)
      .post('/api/v1/admin/music-tracks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Mi Canción',
        type: 'single',
        coverMediaId: mediaId,
        published: true,
        sortOrder: 0,
        status: 'activo',
        mood: 'feliz',
        duration: '3:30',
      });

    const res = await request(app).get('/api/v1/public/music-tracks');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);

    const track = res.body.items[0];
    expect(track.title).toBe('Mi Canción');
    expect(track.coverDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});

// ─── Eventos comunitarios ────────────────────────────────────────────────────

describe('GET /api/v1/public/community-events', () => {
  it('devuelve lista vacía cuando no hay eventos', async () => {
    const res = await request(app).get('/api/v1/public/community-events');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  it('devuelve eventos publicados', async () => {
    await request(app)
      .post('/api/v1/admin/community-events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Concierto en vivo',
        description: 'Gran concierto',
        published: true,
        sortOrder: 0,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
      });

    const res = await request(app).get('/api/v1/public/community-events');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].title).toBe('Concierto en vivo');
  });
});

// ─── Health + 404 ────────────────────────────────────────────────────────────

describe('Rutas generales', () => {
  it('GET /api/v1/health retorna 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('ruta inexistente retorna 404', async () => {
    const res = await request(app).get('/api/v1/ruta-que-no-existe');
    expect(res.status).toBe(404);
  });
});
