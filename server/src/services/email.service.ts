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

function adminNotificationEmail(): string | undefined {
  return env.ADMIN_NOTIFICATION_EMAIL ?? env.ADMIN_EMAIL;
}

async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.info(`[email] Omitido (SendGrid no configurado): ${params.subject} → ${params.to}`);
    return;
  }
  sgMail.setApiKey(env.SENDGRID_API_KEY!);
  await sgMail.send({
    to: params.to,
    from: { email: env.SENDGRID_FROM_EMAIL!, name: env.SENDGRID_FROM_NAME },
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}

/** Envía emails en segundo plano; no interrumpe el flujo HTTP si falla. */
export function dispatchEmail(task: () => Promise<void>, context: string): void {
  void task().catch((err) => {
    console.error(`[email] Error en ${context}:`, err instanceof Error ? err.message : err);
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
    console.warn('[email] Sin ADMIN_NOTIFICATION_EMAIL ni ADMIN_EMAIL: no se avisa al admin por registro.');
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
    console.warn('[email] Sin ADMIN_NOTIFICATION_EMAIL ni ADMIN_EMAIL: no se avisa al admin por contacto.');
    return;
  }
  const tpl = contactAdminEmail({
    name: params.name,
    email: params.email,
    subject: params.subject,
    message: params.message,
    receivedAt: params.receivedAt.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
  });
  await sendMail({ to: adminEmail, ...tpl });
}

export async function sendContactConfirmation(params: {
  name: string;
  email: string;
  subject: string;
}): Promise<void> {
  const tpl = contactConfirmationEmail({ name: params.name, subject: params.subject });
  await sendMail({ to: params.email, ...tpl });
}
