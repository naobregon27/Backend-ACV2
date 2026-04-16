import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { User } from '../../models/User.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, paginationMeta } from '../../utils/pagination';
import { userPublic } from '../../services/auth.service';

export const listUsers: RequestHandler = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query as { page?: string; pageSize?: string });
  const filter: Record<string, unknown> = {};
  const q = (req.query.q as string | undefined)?.trim();
  if (q) {
    filter.$or = [
      { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
    ];
  }
  const [total, rows] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
  ]);
  res.json({
    items: rows.map((u) => ({
      id: String(u._id),
      email: u.email,
      name: u.name,
      role: u.role,
      isBlocked: u.isBlocked,
      hasPremiumAccess: u.hasPremiumAccess,
      createdAt: u.createdAt,
    })),
    meta: paginationMeta(total, page, pageSize),
  });
});

export const patchUser: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const { isBlocked, hasPremiumAccess } = req.body as {
    isBlocked?: boolean;
    hasPremiumAccess?: boolean;
  };
  const user = await User.findById(id);
  if (!user) throw new ApiError(404, 'USER_NOT_FOUND', 'Usuario no encontrado');
  if (user.role === 'admin' && isBlocked === true) {
    throw new ApiError(400, 'CANNOT_BLOCK_ADMIN', 'No se puede bloquear al administrador');
  }
  if (typeof isBlocked === 'boolean') user.isBlocked = isBlocked;
  if (typeof hasPremiumAccess === 'boolean') user.hasPremiumAccess = hasPremiumAccess;
  await user.save();
  res.json({ user: userPublic(user) });
});
