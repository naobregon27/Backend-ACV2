import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PremiumContentType = 'video' | 'link' | 'download' | 'info';

export interface IPremiumContentItem {
  title: string;
  description: string;
  ctaLabel: string;
  contentType: PremiumContentType;
  mediaId?: Types.ObjectId;
  externalUrl?: string;
  downloadMediaId?: Types.ObjectId;
  requiresAuth: boolean;
  requiresPremium: boolean;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPremiumContentItemDocument extends IPremiumContentItem, Document {}

const premiumContentItemSchema = new Schema<IPremiumContentItemDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    ctaLabel: { type: String, default: 'Ver' },
    contentType: { type: String, enum: ['video', 'link', 'download', 'info'], required: true },
    mediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    externalUrl: { type: String },
    downloadMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    requiresAuth: { type: Boolean, default: true },
    requiresPremium: { type: Boolean, default: true },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

export const PremiumContentItem: Model<IPremiumContentItemDocument> =
  mongoose.models.PremiumContentItem ||
  mongoose.model<IPremiumContentItemDocument>('PremiumContentItem', premiumContentItemSchema);
