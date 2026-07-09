import type { RequestHandler } from 'express';
import { ContactMessage } from '../../models/ContactMessage.model';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  dispatchEmail,
  sendContactAdminNotification,
  sendContactConfirmation,
} from '../../services/email.service';

export const createContactMessage: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  const doc = await ContactMessage.create({ name, email, subject, message, status: 'new' });
  dispatchEmail(
    () =>
      Promise.all([
        sendContactAdminNotification({
          name,
          email,
          subject,
          message,
          receivedAt: doc.createdAt,
        }),
        sendContactConfirmation({ name, email, subject }),
      ]).then(() => undefined),
    'mensaje de contacto',
  );
  res.status(201).json({ ok: true });
});
