import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IPollVote {
  userId: Types.ObjectId;
  pollId: Types.ObjectId;
  optionId: Types.ObjectId;
  createdAt: Date;
}

export interface IPollVoteDocument extends IPollVote, Document {}

const pollVoteSchema = new Schema<IPollVoteDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pollId: { type: Schema.Types.ObjectId, ref: 'Poll', required: true, index: true },
    optionId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

pollVoteSchema.index({ userId: 1, pollId: 1 }, { unique: true });

export const PollVote: Model<IPollVoteDocument> =
  mongoose.models.PollVote || mongoose.model<IPollVoteDocument>('PollVote', pollVoteSchema);
