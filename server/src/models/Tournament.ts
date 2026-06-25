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
      seeds: [
        {
          fighterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          seed: { type: Number, required: true },
          rationale: { type: String, required: true },
        }
      ],
      rounds: [
        {
          round: { type: String, required: true },
          matches: [
            {
              p1: { type: String, required: true },
              p1_rationale: { type: String },
              p2: { type: String, required: true },
              p2_rationale: { type: String },
              score: { type: String, default: 'Pending...' },
              winner: { type: String, default: '' },
            }
          ]
        }
      ]
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
