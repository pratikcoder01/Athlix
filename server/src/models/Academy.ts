import { Schema, model, Document } from 'mongoose';
import { IAcademy } from '../types';

export interface IAcademyDocument extends IAcademy, Document {}

const AcademySchema = new Schema<IAcademyDocument>(
  {
    name: {
      type: String,
      required: [true, 'Academy name is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, 'Academy address is required'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    disciplines: [
      {
        type: String,
        enum: ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'],
        required: true,
      }
    ],
    description: {
      type: String,
      default: '',
    },
    schedule: {
      type: String,
      default: '',
    },
    gallery: [
      {
        type: String, // Cloudinary URLs
      }
    ],
    membersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location query
AcademySchema.index({ location: '2dsphere' });

export const Academy = model<IAcademyDocument>('Academy', AcademySchema);
