import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPollOption {
  _id: Types.ObjectId;
  label: string;
  musicTrackId?: Types.ObjectId;
  sortOrder: number;
  voteCount: number;
}

export interface IPoll {
  title: string;
  startsAt?: Date;
  endsAt?: Date;
  published: boolean;
  sortOrder: number;
  options: IPollOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IPollDocument extends Omit<IPoll, 'options'>, Document {
  options: IPollOption[];
}

const pollOptionSchema = new Schema(
  {
    label: { type: String, required: true },
    musicTrackId: { type: Schema.Types.ObjectId, ref: 'MusicTrack' },
    sortOrder: { type: Number, default: 0 },
    voteCount: { type: Number, default: 0, min: 0 },
  },
  { _id: true },
);

const pollSchema = new Schema<IPollDocument>(
  {
    title: { type: String, required: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    published: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0 },
    options: { type: [pollOptionSchema], default: [] },
  },
  { timestamps: true },
);

export const Poll: Model<IPollDocument> =
  mongoose.models.Poll || mongoose.model<IPollDocument>('Poll', pollSchema);
