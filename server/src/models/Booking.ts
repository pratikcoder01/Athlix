import { Schema, model, Document } from 'mongoose';
import { IBooking } from '../types';

export interface IBookingDocument extends IBooking, Document {}

const BookingSchema = new Schema<IBookingDocument>(
  {
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      max: [240, 'Maximum duration is 240 minutes'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: { type: String, enum: ['INR', 'USD'] },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.index({ coachId: 1, status: 1, scheduledTime: 1 });
BookingSchema.index({ athleteId: 1, status: 1, scheduledTime: 1 });

export const Booking = model<IBookingDocument>('Booking', BookingSchema);
