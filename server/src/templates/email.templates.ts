import { env } from '../config/env';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(title: string, bodyHtml: string): string {
  const siteName = env.SITE_NAME;
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Arial,sans-serif;line-height:1.5;color:#111;max-width:560px;margin:0 auto;padding:24px;">
  <h1 style="font-size:20px;margin:0 0 16px;">${siteName}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#666;">Este es un mensaje automático de ${siteName}.</p>
</body>
</html>`;
}

export function welcomeUserEmail(params: { name: string; webUrl: string }) {
  const subject = `¡Bienvenido/a a ${env.SITE_NAME}!`;
  const html = layout(
    subject,
    `<p>Hola <strong>${esc(params.name)}</strong>,</p>
     <p>Tu cuenta fue creada correctamente. Ya podés iniciar sesión en la app y acceder a todo el contenido público.</p>
     <p><a href="${params.webUrl}" style="color:#111;">Ir a ${env.SITE_NAME}</a></p>`,
  );
  const text = `Hola ${params.name}, tu cuenta en ${env.SITE_NAME} fue creada. Visitá: ${params.webUrl}`;
  return { subject, html, text };
}

export function newUserAdminEmail(params: { name: string; email: string; registeredAt: string }) {
  const subject = `[${env.SITE_NAME}] Nuevo usuario registrado`;
  const html = layout(
    subject,
    `<p>Se registró un nuevo usuario en la app web:</p>
     <ul>
       <li><strong>Nombre:</strong> ${esc(params.name)}</li>
       <li><strong>Email:</strong> ${esc(params.email)}</li>
       <li><strong>Fecha:</strong> ${params.registeredAt}</li>
     </ul>`,
  );
  const text = `Nuevo usuario: ${params.name} (${params.email}) — ${params.registeredAt}`;
  return { subject, html, text };
}

export function contactAdminEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  receivedAt: string;
}) {
  const subject = `[${env.SITE_NAME}] Nuevo mensaje de contacto: ${params.subject}`;
  const html = layout(
    subject,
    `<p>Llegó un mensaje desde el formulario de contacto:</p>
     <ul>
       <li><strong>Nombre:</strong> ${esc(params.name)}</li>
       <li><strong>Email:</strong> ${esc(params.email)}</li>
       <li><strong>Asunto:</strong> ${esc(params.subject)}</li>
       <li><strong>Fecha:</strong> ${params.receivedAt}</li>
     </ul>
     <p style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:6px;">${esc(params.message)}</p>`,
  );
  const text = `Contacto de ${params.name} (${params.email})\nAsunto: ${params.subject}\n\n${params.message}`;
  return { subject, html, text };
}

export function contactConfirmationEmail(params: { name: string; subject: string }) {
  const subject = `Recibimos tu mensaje — ${env.SITE_NAME}`;
  const html = layout(
    subject,
    `<p>Hola <strong>${esc(params.name)}</strong>,</p>
     <p>Recibimos tu consulta sobre <strong>${esc(params.subject)}</strong>. El equipo de ${env.SITE_NAME} la revisará y te responderá a la brevedad.</p>
     <p>Gracias por escribirnos.</p>`,
  );
  const text = `Hola ${params.name}, recibimos tu mensaje sobre "${params.subject}". Te responderemos pronto.`;
  return { subject, html, text };
}
