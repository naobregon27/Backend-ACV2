import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type GalleryCategory = 'show' | 'backstage';
export type GalleryDetailMediaType = 'image' | 'video';

export interface IGalleryItem {
  title: string;
  category: GalleryCategory;
  thumbnailImageUrl?: string;
  thumbnailMediaId?: Types.ObjectId;
  detailMediaType: GalleryDetailMediaType;
  detailImageUrl?: string;
  detailImageMediaId?: Types.ObjectId;
  detailVideoUrl?: string;
  detailVideoMediaId?: Types.ObjectId;
  externalVideoUrl?: string;
  caption: string;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGalleryItemDocument extends IGalleryItem, Document {}

const galleryItemSchema = new Schema<IGalleryItemDocument>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: ['show', 'backstage'], required: true, index: true },
    thumbnailImageUrl: { type: String },
    thumbnailMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    detailMediaType: { type: String, enum: ['image', 'video'], required: true },
    detailImageUrl: { type: String },
    detailImageMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    detailVideoUrl: { type: String },
    detailVideoMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    externalVideoUrl: { type: String },
    caption: { type: String, default: '' },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

export const GalleryItem: Model<IGalleryItemDocument> =
  mongoose.models.GalleryItem ||
  mongoose.model<IGalleryItemDocument>('GalleryItem', galleryItemSchema);
