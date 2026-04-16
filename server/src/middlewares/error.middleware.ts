import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json(err.toJSON());
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Datos de entrada inválidos',
      details: err.flatten(),
    });
    return;
  }
  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      code: 'MONGOOSE_VALIDATION',
      message: err.message,
    });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      code: 'INVALID_ID',
      message: 'Identificador inválido',
    });
    return;
  }
  console.error(err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
  });
};
