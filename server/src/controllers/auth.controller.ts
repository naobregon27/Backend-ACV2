import type { RequestHandler } from 'express';
import { User } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import {
  assertNotBlocked,
  clearRefreshToken,
  hashPassword,
  issueTokens,
  userPublic,
  verifyPassword,
  verifyRefreshTokenHash,
} from '../services/auth.service';
import { verifyRefreshToken } from '../utils/jwt';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as { name: string; email: string; password: string };
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'EMAIL_IN_USE', 'El correo ya está registrado');
  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'user',
    isBlocked: false,
    hasPremiumAccess: false,
  });
  const tokens = await issueTokens(user);
  res.status(201).json(tokens);
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokenHash');
  if (!user) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Credenciales inválidas');
  await assertNotBlocked(user);
  const tokens = await issueTokens(user);
  res.json(tokens);
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'INVALID_REFRESH', 'Refresh token inválido');
  }
  if (payload.type !== 'refresh') throw new ApiError(401, 'INVALID_REFRESH', 'Refresh token inválido');
  const user = await User.findById(payload.sub).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) throw new ApiError(401, 'INVALID_REFRESH', 'Sesión no válida');
  const match = await verifyRefreshTokenHash(refreshToken, user.refreshTokenHash);
  if (!match) throw new ApiError(401, 'INVALID_REFRESH', 'Sesión no válida');
  await assertNotBlocked(user);
  const tokens = await issueTokens(user);
  res.json(tokens);
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  if (req.user) await clearRefreshToken(String(req.user._id));
  res.status(204).send();
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'No autenticado');
  res.json({ user: userPublic(req.user) });
});
