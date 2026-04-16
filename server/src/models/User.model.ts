import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface IUser {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  isBlocked: boolean;
  hasPremiumAccess: boolean;
  refreshTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    isBlocked: { type: Boolean, default: false },
    hasPremiumAccess: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false, default: null },
  },
  { timestamps: true },
);

export const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
