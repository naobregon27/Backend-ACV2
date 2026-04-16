import type { RequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User.model';

function extractBearer(authorization?: string): string | null {
  if (!authorization || !authorization.startsWith('Bearer ')) return null;
  return authorization.slice(7).trim() || null;
}

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) throw new ApiError(401, 'UNAUTHORIZED', 'Token no enviado');
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new ApiError(401, 'INVALID_TOKEN', 'Token inválido');
    const user = await User.findById(payload.sub);
    if (!user || user.isBlocked) throw new ApiError(401, 'UNAUTHORIZED', 'Usuario no válido o bloqueado');
    req.user = user;
    next();
  } catch (e) {
    if (e instanceof ApiError) return next(e);
    next(new ApiError(401, 'INVALID_TOKEN', 'Token inválido o expirado'));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'FORBIDDEN', 'Se requiere rol administrador'));
  }
  next();
};

export const requirePremium: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'UNAUTHORIZED', 'Autenticación requerida'));
  if (!req.user.hasPremiumAccess) {
    return next(new ApiError(403, 'PREMIUM_REQUIRED', 'Se requiere acceso premium'));
  }
  next();
};
