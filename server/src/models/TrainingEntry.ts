import { Schema, model, Types } from 'mongoose';

export interface ITrainingEntry {
  athleteId: Types.ObjectId;
  clientRequestId: string;
  date: string;
  discipline: string;
  durationMinutes: number;
  focus: string;
  notes: string;
  effort?: number;
  version: number;
  deletedAt?: Date;
}

const schema = new Schema<ITrainingEntry>({
  athleteId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  clientRequestId: { type: String, required: true },
  date: { type: String, required: true },
  discipline: { type: String, required: true },
  durationMinutes: { type: Number, min: 1, max: 1440, required: true },
  focus: { type: String, maxlength: 200, required: true },
  notes: { type: String, maxlength: 3000, default: '' },
  effort: { type: Number, min: 1, max: 10 },
  version: { type: Number, default: 0, min: 0, required: true },
  deletedAt: { type: Date },
}, { timestamps: true });
schema.index({ athleteId: 1, clientRequestId: 1 }, { unique: true });
schema.index({ athleteId: 1, deletedAt: 1, date: -1, _id: -1 });
export const TrainingEntry = model<ITrainingEntry>('TrainingEntry', schema);
