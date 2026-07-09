import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMediaAsset {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  relativePath: string;
  /** URL pública HTTPS de Cloudinary. */
  publicUrl: string;
  cloudinaryPublicId?: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMediaAssetDocument extends IMediaAsset, Document {}

const mediaAssetSchema = new Schema<IMediaAssetDocument>(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, default: '' },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    relativePath: { type: String, default: '' },
    publicUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, index: true },
    width: { type: Number },
    height: { type: Number },
    durationSeconds: { type: Number },
  },
  { timestamps: true },
);

export const MediaAsset: Model<IMediaAssetDocument> =
  mongoose.models.MediaAsset || mongoose.model<IMediaAssetDocument>('MediaAsset', mediaAssetSchema);
