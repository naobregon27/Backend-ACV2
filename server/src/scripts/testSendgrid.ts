/**
 * Prueba puntual de SendGrid. Ejecutar: npx tsx src/scripts/testSendgrid.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import sgMail from '@sendgrid/mail';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL || from;
  const fromName = process.env.SENDGRID_FROM_NAME || 'ACV2.Music';

  console.log('API key presente:', Boolean(key), key ? `len=${key.length}` : '');
  console.log('FROM:', from);
  console.log('TO:', to);

  if (!key || !from || !to) {
    console.error('Faltan SENDGRID_API_KEY, SENDGRID_FROM_EMAIL o ADMIN_NOTIFICATION_EMAIL');
    process.exit(1);
  }

  sgMail.setApiKey(key);
  try {
    const [res] = await sgMail.send({
      to,
      from: { email: from, name: fromName },
      subject: `[ACV2 Test] Prueba de email ${new Date().toISOString()}`,
      text: 'Si recibis este correo, SendGrid funciona.',
      html: '<p>Si recibis este correo, <strong>SendGrid funciona</strong>.</p>',
    });
    console.log('OK status:', res.statusCode);
    console.log('x-message-id:', res.headers?.['x-message-id']);
  } catch (err: unknown) {
    const e = err as { message?: string; code?: number; response?: { body?: unknown } };
    console.error('ERROR message:', e?.message);
    console.error('ERROR code:', e?.code);
    console.error('ERROR response body:', JSON.stringify(e?.response?.body, null, 2));
    process.exit(1);
  }
}

main();
