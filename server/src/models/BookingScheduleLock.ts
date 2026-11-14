import { Schema, model } from 'mongoose';

// The native unique _id index identifies a participant across every API process.
// No timestamps or booking information are stored in this coordination document.
const schema = new Schema({
  _id: { type: Schema.Types.ObjectId, required: true },
  revision: { type: Number, required: true, default: 0 },
}, { versionKey: false });

export const BookingScheduleLock = model('BookingScheduleLock', schema);
