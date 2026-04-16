import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommunityEvent {
  title: string;
  city: string;
  startsAt: Date;
  timezone: string;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICommunityEventDocument extends ICommunityEvent, Document {}

const communityEventSchema = new Schema<ICommunityEventDocument>(
  {
    title: { type: String, required: true },
    city: { type: String, required: true },
    startsAt: { type: Date, required: true, index: true },
    timezone: { type: String, default: 'America/Argentina/Buenos_Aires' },
    published: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0, index: true },
  },
  { timestamps: true },
);

export const CommunityEvent: Model<ICommunityEventDocument> =
  mongoose.models.CommunityEvent ||
  mongoose.model<ICommunityEventDocument>('CommunityEvent', communityEventSchema);
