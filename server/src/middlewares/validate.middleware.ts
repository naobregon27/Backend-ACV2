import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

type Schema = ZodTypeAny;

export function validateBody(schema: Schema): RequestHandler {
  return (req, _res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success)
      return next(new ApiError(400, 'VALIDATION_ERROR', 'Cuerpo inválido', r.error.flatten() as Record<string, unknown>));
    req.body = r.data;
    next();
  };
}

export function validateQuery(schema: Schema): RequestHandler {
  return (req, _res, next) => {
    const r = schema.safeParse(req.query);
    if (!r.success)
      return next(new ApiError(400, 'VALIDATION_ERROR', 'Query inválida', r.error.flatten() as Record<string, unknown>));
    req.query = r.data as typeof req.query;
    next();
  };
}
