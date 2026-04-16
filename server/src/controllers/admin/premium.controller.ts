import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { PremiumContentItem } from '../../models/PremiumContentItem.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export const listPremiumAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query as { page?: string; pageSize?: string });
  const [total, rows] = await Promise.all([
    PremiumContentItem.countDocuments({}),
    PremiumContentItem.find({}).sort({ sortOrder: 1, createdAt: 1 }).skip(skip).limit(pageSize).lean(),
  ]);
  res.json({
    items: rows.map((x) => ({ ...x, id: String(x._id), _id: undefined })),
    meta: paginationMeta(total, page, pageSize),
  });
});

export const createPremium: RequestHandler = asyncHandler(async (req, res) => {
  const row = await PremiumContentItem.create(req.body);
  res.status(201).json({ item: { ...row.toObject(), id: String(row._id), _id: undefined } });
});

export const updatePremium: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const row = await PremiumContentItem.findByIdAndUpdate(id, { $set: req.body }, { new: true });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Ítem no encontrado');
  res.json({ item: { ...row.toObject(), id: String(row._id), _id: undefined } });
});

export const deletePremium: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  await PremiumContentItem.findByIdAndDelete(id);
  res.status(204).send();
});
