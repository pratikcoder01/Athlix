import { Schema, model, Document } from 'mongoose';
import { ICoachProfile } from '../types';

export interface ICoachProfileDocument extends ICoachProfile, Document {}

const AvailabilitySchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:MM
        },
        message: (props: any) => `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v); // HH:MM
        },
        message: (props: any) => `${props.value} is not a valid time format (HH:MM)!`,
      },
    },
  },
  { _id: false }
);

const CoachProfileSchema = new Schema<ICoachProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    certifications: [
      {
        type: String,
      }
    ],
    experienceYears: {
      type: Number,
      default: 0,
      min: [0, 'Experience years cannot be negative'],
    },
    pricingPerHour: {
      type: Number,
      default: 0,
      min: [0, 'Pricing per hour cannot be negative'],
    },
    availability: [AvailabilitySchema],
    ratings: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    active: {
      type: Boolean,
      default: true,
    },
    autoConfirm: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const CoachProfile = model<ICoachProfileDocument>('CoachProfile', CoachProfileSchema);
