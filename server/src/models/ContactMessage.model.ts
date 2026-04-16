import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContactMessageStatus = 'new' | 'read' | 'replied';

export interface IContactMessage {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContactMessageDocument extends IContactMessage, Document {}

const contactMessageSchema = new Schema<IContactMessageDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied'],
      default: 'new',
      index: true,
    },
  },
  { timestamps: true },
);

export const ContactMessage: Model<IContactMessageDocument> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessageDocument>('ContactMessage', contactMessageSchema);
