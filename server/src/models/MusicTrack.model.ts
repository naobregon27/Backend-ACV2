import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type MusicTrackType = 'single' | 'live' | 'ep';

export interface IMusicTrack {
  title: string;
  status: string;
  mood: string;
  duration: string;
  type: MusicTrackType;
  coverImageUrl?: string;
  coverMediaId?: Types.ObjectId;
  previewAudioUrl?: string;
  previewMediaId?: Types.ObjectId;
  spotifyUrl?: string;
  youtubeUrl?: string;
  appleMusicUrl?: string;
  published: boolean;
  sortOrder: number;
  releasedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMusicTrackDocument extends IMusicTrack, Document {}

const musicTrackSchema = new Schema<IMusicTrackDocument>(
  {
    title: { type: String, required: true, trim: true },
    status: { type: String, default: '' },
    mood: { type: String, default: '' },
    duration: { type: String, default: '' },
    type: { type: String, enum: ['single', 'live', 'ep'], required: true, index: true },
    coverImageUrl: { type: String },
    coverMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    previewAudioUrl: { type: String },
    previewMediaId: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    spotifyUrl: { type: String },
    youtubeUrl: { type: String },
    appleMusicUrl: { type: String },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    releasedAt: { type: Date },
  },
  { timestamps: true },
);

export const MusicTrack: Model<IMusicTrackDocument> =
  mongoose.models.MusicTrack ||
  mongoose.model<IMusicTrackDocument>('MusicTrack', musicTrackSchema);
