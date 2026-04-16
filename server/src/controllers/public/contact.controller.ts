import type { RequestHandler } from 'express';
import { ContactMessage } from '../../models/ContactMessage.model';
import { asyncHandler } from '../../utils/asyncHandler';

export const createContactMessage: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  await ContactMessage.create({ name, email, subject, message, status: 'new' });
  res.status(201).json({ ok: true });
});
