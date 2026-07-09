/**
 * Prueba de integración real contra Cloudinary y SendGrid.
 * Ejecutar: npx tsx src/scripts/integrationSmoke.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const PNG_1X1_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

type Check = { name: string; ok: boolean; detail: string };

const results: Check[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  const icon = ok ? '✓' : '✗';
  console.log(`${icon} ${name}: ${detail}`);
}

async function testCloudinaryDirect() {
  const { uploadBufferToCloudinary } = await import('../services/cloudinary.service');
  const buffer = Buffer.from(PNG_1X1_BASE64, 'base64');
  const uploaded = await uploadBufferToCloudinary({
    buffer,
    mimeType: 'image/png',
    originalName: `integration-test-${Date.now()}.png`,
  });
  const ok =
    uploaded.secureUrl.startsWith('https://res.cloudinary.com/') &&
    uploaded.publicId.includes('musica-acv');
  record(
    'Cloudinary upload directo',
    ok,
    ok ? uploaded.secureUrl : `URL inválida: ${uploaded.secureUrl}`,
  );
  return uploaded;
}

async function testSendGridDirect() {
  const {
    isEmailConfigured,
    sendWelcomeEmail,
    sendNewUserAdminNotification,
    sendContactAdminNotification,
    sendContactConfirmation,
  } = await import('../services/email.service');

  if (!isEmailConfigured()) {
    record('SendGrid configurado', false, 'Faltan SENDGRID_API_KEY o SENDGRID_FROM_EMAIL');
    return;
  }
  record('SendGrid configurado', true, 'API key y remitente presentes');

  const stamp = Date.now();
  const testEmail = process.env.SENDGRID_FROM_EMAIL!;

  await sendWelcomeEmail({ name: 'Test Integración', email: testEmail });
  record('SendGrid bienvenida', true, `Enviado a ${testEmail}`);

  await sendNewUserAdminNotification({
    name: 'Usuario Test',
    email: `test-${stamp}@example.com`,
    registeredAt: new Date(),
  });
  record('SendGrid alerta admin (registro)', true, 'Enviado al admin');

  await sendContactAdminNotification({
    name: 'Contacto Test',
    email: `contacto-${stamp}@example.com`,
    subject: 'Prueba integración contacto',
    message: 'Mensaje de prueba automática del backend ACV2.',
    receivedAt: new Date(),
  });
  record('SendGrid alerta admin (contacto)', true, 'Enviado al admin');

  await sendContactConfirmation({
    name: 'Contacto Test',
    email: testEmail,
    subject: 'Prueba integración contacto',
  });
  record('SendGrid confirmación contacto', true, `Enviado a ${testEmail}`);
}

async function testHttpFlow() {
  const { connectDatabase } = await import('../config/database');
  const { ensureDefaultSiteConfig, ensureInitialAdminUser } = await import('../services/bootstrap.service');
  const { createApp } = await import('../app');
  const request = (await import('supertest')).default;

  await connectDatabase();
  await ensureDefaultSiteConfig();
  await ensureInitialAdminUser();
  const app = createApp();

  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });

  if (login.status !== 200) {
    record('HTTP login admin', false, `Status ${login.status}: ${JSON.stringify(login.body)}`);
    return;
  }
  record('HTTP login admin', true, 'Token obtenido');
  const adminToken = login.body.accessToken as string;

  const upload = await request(app)
    .post('/api/v1/admin/media/upload')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      fileBase64: PNG_1X1_BASE64,
      mimeType: 'image/png',
      originalName: `http-integration-${Date.now()}.png`,
    });

  const uploadOk =
    upload.status === 201 &&
    typeof upload.body.media?.publicUrl === 'string' &&
    upload.body.media.publicUrl.startsWith('https://res.cloudinary.com/');
  record(
    'HTTP upload media → Cloudinary',
    uploadOk,
    uploadOk ? upload.body.media.publicUrl : JSON.stringify(upload.body),
  );

  const stamp = Date.now();
  const register = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Usuario Integración',
      email: `integracion-${stamp}@test.local`,
      password: 'Integracion123!',
    });
  record(
    'HTTP registro + emails',
    register.status === 201,
    register.status === 201 ? `Usuario integracion-${stamp}@test.local` : JSON.stringify(register.body),
  );

  const contact = await request(app).post('/api/v1/public/contact-messages').send({
    name: 'Integración Contacto',
    email: testEmailSafe(),
    subject: 'Prueba HTTP contacto',
    message: 'Mensaje de integración automática.',
  });
  record(
    'HTTP contacto + emails',
    contact.status === 201,
    contact.status === 201 ? 'Mensaje creado' : JSON.stringify(contact.body),
  );

  if (uploadOk && upload.body.media?.id) {
    const gallery = await request(app)
      .post('/api/v1/admin/gallery')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Integración galería',
        category: 'show',
        detailMediaType: 'image',
        thumbnailMediaId: upload.body.media.id,
        published: true,
        sortOrder: 0,
      });
    const publicGallery = await request(app).get('/api/v1/public/gallery');
    const hasItem = publicGallery.body.items?.some(
      (x: { title: string; thumbnailDataUrl?: string }) =>
        x.title === 'Integración galería' && x.thumbnailDataUrl?.startsWith('https://res.cloudinary.com/'),
    );
    record(
      'HTTP galería con URL Cloudinary pública',
      gallery.status === 201 && hasItem,
      hasItem ? 'thumbnailDataUrl es HTTPS Cloudinary' : JSON.stringify(publicGallery.body),
    );
  }
}

function testEmailSafe(): string {
  return process.env.SENDGRID_FROM_EMAIL ?? 'test@example.com';
}

async function main() {
  console.info('\n=== Integración ACV2: Cloudinary + SendGrid ===\n');

  try {
    await testCloudinaryDirect();
  } catch (err) {
    record('Cloudinary upload directo', false, err instanceof Error ? err.message : String(err));
  }

  try {
    await testSendGridDirect();
  } catch (err) {
    record('SendGrid envío', false, err instanceof Error ? err.message : String(err));
  }

  try {
    await testHttpFlow();
  } catch (err) {
    record('HTTP flow', false, err instanceof Error ? err.message : String(err));
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.info(`\n=== Resultado: ${passed} OK, ${failed} fallos ===\n`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
