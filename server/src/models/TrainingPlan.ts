import { Schema, model, Document } from 'mongoose';

export interface ITrainingPlan {
  athleteId: Schema.Types.ObjectId;
  weekOverview: string;
  days: Array<{
    day: string;
    focus: string;
    drills: string[];
    duration: string;
    intensity: 'low' | 'medium' | 'high';
  }>;
  notes: string;
  createdAt?: Date;
}

export interface ITrainingPlanDocument extends ITrainingPlan, Document {}

const TrainingPlanSchema = new Schema<ITrainingPlanDocument>(
  {
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    weekOverview: {
      type: String,
      required: true,
    },
    days: [
      {
        day: { type: String, required: true },
        focus: { type: String, required: true },
        drills: [{ type: String }],
        duration: { type: String, required: true },
        intensity: {
          type: String,
          enum: ['low', 'medium', 'high'],
          required: true,
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const TrainingPlanModel = model<ITrainingPlanDocument>('TrainingPlan', TrainingPlanSchema);
