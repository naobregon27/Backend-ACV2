import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import type { IPollOption } from '../../models/Poll.model';
import { Poll } from '../../models/Poll.model';
import { PollVote } from '../../models/PollVote.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';
import { parsePagination, paginationMeta } from '../../utils/pagination';

export const listPollsAdmin: RequestHandler = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query as { page?: string; pageSize?: string });
  const [total, rows] = await Promise.all([
    Poll.countDocuments({}),
    Poll.find({}).sort({ sortOrder: 1, createdAt: 1 }).skip(skip).limit(pageSize).lean(),
  ]);
  res.json({
    items: rows.map((x) => ({
      ...x,
      id: String(x._id),
      _id: undefined,
      options: x.options.map((o) => ({ ...o, id: String(o._id), _id: undefined })),
    })),
    meta: paginationMeta(total, page, pageSize),
  });
});

export const createPoll: RequestHandler = asyncHandler(async (req, res) => {
  const row = await Poll.create(req.body);
  res.status(201).json({
    item: {
      ...row.toObject(),
      id: String(row._id),
      _id: undefined,
      options: row.options.map((o) => {
        const sub = o as mongoose.Types.Subdocument & IPollOption;
        return { ...sub.toObject(), id: String(sub._id), _id: undefined };
      }),
    },
  });
});

export const updatePoll: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  const row = await Poll.findByIdAndUpdate(id, { $set: req.body }, { new: true });
  if (!row) throw new ApiError(404, 'NOT_FOUND', 'Encuesta no encontrada');
  res.json({
    item: {
      ...row.toObject(),
      id: String(row._id),
      _id: undefined,
      options: row.options.map((o) => {
        const sub = o as mongoose.Types.Subdocument & IPollOption;
        return { ...sub.toObject(), id: String(sub._id), _id: undefined };
      }),
    },
  });
});

export const deletePoll: RequestHandler = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  await Poll.findByIdAndDelete(id);
  await PollVote.deleteMany({ pollId: id });
  res.status(204).send();
});
