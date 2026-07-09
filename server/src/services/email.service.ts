import sgMail from '@sendgrid/mail';
import { env } from '../config/env';
import {
  contactAdminEmail,
  contactConfirmationEmail,
  newUserAdminEmail,
  welcomeUserEmail,
} from '../templates/email.templates';

export function isEmailConfigured(): boolean {
  return Boolean(env.SENDGRID_API_KEY && env.SENDGRID_FROM_EMAIL);
}

export function logEmailStartupStatus(): void {
  if (!isEmailConfigured()) {
    console.warn(
      '[email] SendGrid NO configurado (faltan SENDGRID_API_KEY o SENDGRID_FROM_EMAIL). Los emails se omitirán.',
    );
    return;
  }
  const admin = adminNotificationEmail();
  console.info(
    `[email] SendGrid listo · from=${env.SENDGRID_FROM_EMAIL} · alertas admin=${admin ?? 'NO CONFIGURADO'}`,
  );
  if (!admin) {
    console.warn(
      '[email] Sin ADMIN_NOTIFICATION_EMAIL: no se enviarán alertas de contacto/registro al admin.',
    );
  }
}

/**
 * Destino de alertas al admin.
 * Solo ADMIN_NOTIFICATION_EMAIL: ADMIN_EMAIL suele ser la cuenta de login
 * (ej. admin@acv2.music) y no una casilla real donde leer correos.
 */
function adminNotificationEmail(): string | undefined {
  return env.ADMIN_NOTIFICATION_EMAIL;
}

function formatSendGridError(err: unknown): string {
  if (!err || typeof err !== 'object') return String(err);
  const e = err as {
    message?: string;
    code?: number | string;
    response?: { body?: unknown; headers?: Record<string, unknown> };
  };
  const body = e.response?.body != null ? ` | body=${JSON.stringify(e.response.body)}` : '';
  return `${e.message ?? 'error'}${e.code != null ? ` (code=${e.code})` : ''}${body}`;
}

async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.info(`[email] Omitido (SendGrid no configurado): ${params.subject} → ${params.to}`);
    return;
  }
  sgMail.setApiKey(env.SENDGRID_API_KEY!);
  try {
    const [res] = await sgMail.send({
      to: params.to,
      from: { email: env.SENDGRID_FROM_EMAIL!, name: env.SENDGRID_FROM_NAME },
      replyTo: params.replyTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    console.info(
      `[email] Enviado: "${params.subject}" → ${params.to} (status=${res.statusCode}, id=${res.headers?.['x-message-id'] ?? 'n/a'})`,
    );
  } catch (err) {
    console.error(`[email] Falló envío a ${params.to}:`, formatSendGridError(err));
    throw err;
  }
}

/** Envía emails en segundo plano; no interrumpe el flujo HTTP si falla. */
export function dispatchEmail(task: () => Promise<void>, context: string): void {
  void task().catch((err) => {
    console.error(`[email] Error en ${context}:`, formatSendGridError(err));
  });
}

export async function sendWelcomeEmail(params: { name: string; email: string }): Promise<void> {
  const tpl = welcomeUserEmail({ name: params.name, webUrl: env.PUBLIC_WEB_URL });
  await sendMail({ to: params.email, ...tpl });
}

export async function sendNewUserAdminNotification(params: {
  name: string;
  email: string;
  registeredAt: Date;
}): Promise<void> {
  const adminEmail = adminNotificationEmail();
  if (!adminEmail) {
    console.warn('[email] Sin ADMIN_NOTIFICATION_EMAIL: no se avisa al admin por registro.');
    return;
  }
  const tpl = newUserAdminEmail({
    name: params.name,
    email: params.email,
    registeredAt: params.registeredAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
  });
  await sendMail({ to: adminEmail, ...tpl });
}

export async function sendContactAdminNotification(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: Date;
}): Promise<void> {
  const adminEmail = adminNotificationEmail();
  if (!adminEmail) {
    console.warn('[email] Sin ADMIN_NOTIFICATION_EMAIL: no se avisa al admin por contacto.');
    return;
  }
  const tpl = contactAdminEmail({
    name: params.name,
    email: params.email,
    subject: params.subject,
    message: params.message,
    receivedAt: params.receivedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
  });
  await sendMail({ to: adminEmail, replyTo: params.email, ...tpl });
}

export async function sendContactConfirmation(params: {
  name: string;
  email: string;
  subject: string;
}): Promise<void> {
  const tpl = contactConfirmationEmail({ name: params.name, subject: params.subject });
  await sendMail({ to: params.email, ...tpl });
}
