import bcrypt from 'bcryptjs';
import { User, type IUserDocument } from '../models/User.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken, signRefreshToken } from '../utils/jwt';

const SALT = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashRefreshToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT);
}

export async function verifyRefreshTokenHash(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

export function userPublic(user: IUserDocument) {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    hasPremiumAccess: user.hasPremiumAccess,
    createdAt: user.createdAt,
  };
}

export async function issueTokens(user: IUserDocument) {
  const accessToken = signAccessToken(String(user._id), user.role);
  const refreshToken = signRefreshToken(String(user._id));
  const refreshTokenHash = await hashRefreshToken(refreshToken);
  await User.findByIdAndUpdate(user._id, { refreshTokenHash });
  return { accessToken, refreshToken, user: userPublic(user) };
}

export async function clearRefreshToken(userId: string): Promise<void> {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
}

export async function assertNotBlocked(user: IUserDocument): Promise<void> {
  if (user.isBlocked) throw new ApiError(403, 'USER_BLOCKED', 'Tu cuenta está bloqueada');
}
