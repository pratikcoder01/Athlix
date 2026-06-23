import { Schema, model, Document } from 'mongoose';
import { IProfile } from '../types';

export interface IProfileDocument extends IProfile, Document {}

const ProfileSchema = new Schema<IProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: {
      type: String,
      default: '',
    },
    discipline: {
      type: String,
      enum: ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'],
      default: 'BJJ',
    },
    beltRank: {
      type: String,
      default: 'White',
    },
    achievements: [
      {
        type: String,
      }
    ],
    location: {
      type: String,
      default: '',
      index: true,
    },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Profile = model<IProfileDocument>('Profile', ProfileSchema);
