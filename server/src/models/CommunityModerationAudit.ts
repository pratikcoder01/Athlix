import { Schema, model } from 'mongoose';

const schema = new Schema({
  reportId: { type: Schema.Types.ObjectId, ref: 'CommunityReport', required: true, immutable: true, unique: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true, immutable: true },
  targetId: { type: Schema.Types.ObjectId, required: true, immutable: true },
  action: { type: String, enum: ['dismiss', 'hide'], required: true, immutable: true },
  note: { type: String, required: true, maxlength: 1000, immutable: true },
  priorTargetVersion: { type: Number, immutable: true },
  resultingTargetVersion: { type: Number, immutable: true },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });
export const CommunityModerationAudit = model('CommunityModerationAudit', schema);
