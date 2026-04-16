import type { RequestHandler } from 'express';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { Poll } from '../../models/Poll.model';
import { PollVote } from '../../models/PollVote.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiError } from '../../utils/ApiError';

export const votePoll: RequestHandler = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(401, 'UNAUTHORIZED', 'Debes iniciar sesión para votar');
  const { id } = req.params;
  const { optionId } = req.body as { optionId: string };
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optionId)) {
    throw new ApiError(400, 'INVALID_ID', 'ID inválido');
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const poll = await Poll.findOne({ _id: id, published: true }).session(session);
      if (!poll) throw new ApiError(404, 'POLL_NOT_FOUND', 'Encuesta no encontrada');
      const option = poll.options.find((opt) => String(opt._id) === String(optionId));
      if (!option) throw new ApiError(400, 'INVALID_OPTION', 'Opción inválida');
      const now = new Date();
      if (poll.startsAt && now < poll.startsAt) throw new ApiError(400, 'POLL_NOT_STARTED', 'La encuesta no ha comenzado');
      if (poll.endsAt && now > poll.endsAt) throw new ApiError(400, 'POLL_ENDED', 'La encuesta finalizó');
      await PollVote.create(
        [
          {
            userId: user._id,
            pollId: poll._id,
            optionId: option._id,
          },
        ],
        { session },
      );
      option.voteCount = (option.voteCount || 0) + 1;
      await poll.save({ session });
    });
  } catch (e: unknown) {
    if (e instanceof MongoServerError && e.code === 11000) {
      throw new ApiError(409, 'ALREADY_VOTED', 'Ya registraste tu voto en esta encuesta');
    }
    throw e;
  } finally {
    session.endSession();
  }
  res.status(201).json({ ok: true });
});
