import { Schema, model } from 'mongoose';

const schema = new Schema({
  academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true, index: true },
  memberCode: { type: String, required: true, maxlength: 40 },
  name: { type: String, required: true, maxlength: 150 },
  email: { type: String, maxlength: 254, default: '' },
  discipline: { type: String, required: true },
  beltRank: { type: String, maxlength: 80, default: '' },
  joinedOn: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', required: true },
  notes: { type: String, maxlength: 1000, default: '' },
  permissionRecordedAt: { type: Date, required: true },
  version: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

schema.index({ academyId: 1, memberCode: 1 }, { unique: true });
schema.index({ academyId: 1, status: 1, name: 1, _id: 1 });
export const AcademyMember = model('AcademyMember', schema);
