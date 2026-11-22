import { Schema, model } from 'mongoose';

const schema = new Schema({
  academyId: { type: Schema.Types.ObjectId, ref: 'Academy', required: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'AcademyMember', required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['present', 'absent', 'excused'], required: true },
  recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// One daily record per member, including concurrent retries across API workers.
schema.index({ academyId: 1, memberId: 1, date: 1 }, { unique: true });
schema.index({ academyId: 1, date: 1, _id: 1 });
export const AcademyAttendance = model('AcademyAttendance', schema);
