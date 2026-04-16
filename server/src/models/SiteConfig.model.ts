import mongoose, { Schema, Document, Model } from 'mongoose';

const navLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    path: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

const socialLinkSchema = new Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

const highlightSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
  },
  { _id: false },
);

export interface ISiteSettings {
  siteTitle: string;
  siteDescription: string;
  defaultOgImageUrl?: string;
}

export interface ISiteConfig {
  key: string;
  navLinks: Array<{ label: string; path: string; sortOrder: number; visible: boolean }>;
  socialLinks: Array<{ platform: string; url: string; sortOrder: number; visible: boolean }>;
  highlights: Array<{ title: string; description: string; sortOrder: number; visible: boolean }>;
  siteSettings: ISiteSettings;
  updatedAt: Date;
}

export interface ISiteConfigDocument extends ISiteConfig, Document {}

const siteConfigSchema = new Schema<ISiteConfigDocument>(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    navLinks: [navLinkSchema],
    socialLinks: [socialLinkSchema],
    highlights: [highlightSchema],
    siteSettings: {
      siteTitle: { type: String, default: 'ACV2.Music' },
      siteDescription: { type: String, default: '' },
      defaultOgImageUrl: { type: String },
    },
  },
  { timestamps: true },
);

export const SiteConfig: Model<ISiteConfigDocument> =
  mongoose.models.SiteConfig ||
  mongoose.model<ISiteConfigDocument>('SiteConfig', siteConfigSchema);
