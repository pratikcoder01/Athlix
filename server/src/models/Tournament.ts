import { Schema, model, Document } from 'mongoose';
import { ITournament } from '../types';

export interface ITournamentDocument extends ITournament, Document {}

const TournamentSchema = new Schema<ITournamentDocument>(
  {
    title: {
      type: String,
      required: [true, 'Tournament title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Tournament description is required'],
    },
    date: {
      type: Date,
      required: [true, 'Tournament date is required'],
      index: true,
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    entryFee: {
      type: Number,
      required: [true, 'Entry fee is required'],
      min: [0, 'Entry fee cannot be negative'],
    },
    disciplines: [
      {
        type: String,
        enum: ['Karate', 'BJJ', 'Judo', 'Muay Thai', 'Taekwondo', 'Boxing', 'MMA', 'Wrestling', 'Other'],
        required: true,
      }
    ],
    organizerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    registrations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    brackets: {
      type: String, // Bracket structure (JSON or imageUrl)
      default: '',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Tournament = model<ITournamentDocument>('Tournament', TournamentSchema);
