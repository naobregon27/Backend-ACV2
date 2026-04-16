import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ContactMessage } from '../../models/ContactMessage.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export const listContactsAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query as { page?: string; pageSize?: string });
  const status = req.query.status as string | undefined;
  const filter = status ? { status } : {};
  const [total, rows] = await Promise.all([
    ContactMessage.countDocuments(filter),
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
  ]);
  res.json({
    items: rows.map((x) => ({ ...x, id: String(x._id), _id: undefined })),
    meta: paginationMeta(total, page, pageSize),
  });
});

export const patchContactStatus: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const { status } = req.body as { status: 'new' | 'read' | 'replied' };
  const row = await ContactMessage.findByIdAndUpdate(id, { $set: { status } }, { new: true });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Mensaje no encontrado');
  res.json({ item: { ...row.toObject(), id: String(row._id), _id: undefined } });
});
