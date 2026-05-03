import request from 'supertest';
import { createApp } from '../app';
import { connectTestDB, clearTestDB, disconnectTestDB } from './setup/dbHelper';

const app = createApp();

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

// ─── Registro ───────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  it('registra un usuario nuevo y devuelve accessToken + refreshToken', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rechaza registro con email ya existente (409)', async () => {
    const payload = { name: 'User', email: 'dup@example.com', password: 'password123' };
    await request(app).post('/api/v1/auth/register').send(payload);
    const res = await request(app).post('/api/v1/auth/register').send(payload);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_IN_USE');
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'secret123',
    });
  });

  it('devuelve tokens con credenciales correctas', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'secret123',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('rechaza credenciales incorrectas (401)', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

// ─── Refresh Token ───────────────────────────────────────────────────────────

describe('POST /api/v1/auth/refresh', () => {
  it('renueva el accessToken con un refreshToken válido', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Refresh User',
      email: 'refresh@example.com',
      password: 'password123',
    });
    const { refreshToken } = reg.body;

    const res = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rechaza un refreshToken inválido (401)', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({
      refreshToken: 'token-falso',
    });
    expect(res.status).toBe(401);
  });
});

// ─── /me ─────────────────────────────────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {
  it('devuelve el usuario autenticado', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Me User',
      email: 'me@example.com',
      password: 'password123',
    });
    const { accessToken } = reg.body;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('me@example.com');
  });

  it('rechaza sin token (401)', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/logout', () => {
  it('desloguea correctamente (204)', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send({
      name: 'Logout User',
      email: 'logout@example.com',
      password: 'password123',
    });
    const { accessToken } = reg.body;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(204);
  });
});

// ─── Health ──────────────────────────────────────────────────────────────────

describe('GET /api/v1/health', () => {
  it('responde 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });
});
