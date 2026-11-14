import { Schema, model, Types } from 'mongoose';

interface ICoachClientNote {
  coachId: Types.ObjectId;
  athleteId: Types.ObjectId;
  notes: string;
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}
const schema = new Schema<ICoachClientNote>({
  coachId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  notes: { type: String, default: '', maxlength: 5000 },
  version: { type: Number, default: 0, min: 0, required: true },
}, { timestamps: true });
schema.index({ coachId: 1, athleteId: 1 }, { unique: true });
export const CoachClientNote = model<ICoachClientNote>('CoachClientNote', schema);
