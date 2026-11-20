import { Schema, model } from 'mongoose';

const schema = new Schema({
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  reason: { type: String, enum: ['spam', 'harassment', 'safety', 'privacy', 'other'], required: true },
  details: { type: String, maxlength: 1000, default: '' },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  version: { type: Number, default: 0 },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  action: { type: String, enum: ['dismiss', 'hide'] },
  resolutionNote: { type: String, maxlength: 1000 },
}, { timestamps: true });
schema.index({ reporterId: 1, targetType: 1, targetId: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1, _id: -1 });
export const CommunityReport = model('CommunityReport', schema);
