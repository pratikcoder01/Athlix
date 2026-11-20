import mongoose, { ClientSession } from 'mongoose';
import { BookingScheduleLock } from '../models/BookingScheduleLock';

/** Serialize schedule mutations before reading availability/conflicts. */
export const withScheduleTransaction = async <T>(participantIds: string[], work: (session: ClientSession) => Promise<T>): Promise<T> => {
  const participants = [...new Set(participantIds)].sort();
  // Create stable lock documents before starting the transaction. The primary
  // key makes concurrent first-use initialization safe across API processes.
  for (const id of participants) {
    try {
      await BookingScheduleLock.updateOne({ _id: id }, { $setOnInsert: { revision: 0 } }, { upsert: true, writeConcern: { w: 'majority' } });
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000)) throw error;
    }
  }
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      for (const id of participants) {
        const lock = await BookingScheduleLock.updateOne({ _id: id }, { $inc: { revision: 1 } }, { session });
        if (lock.matchedCount !== 1) throw new Error('Booking schedule lock is unavailable');
      }
      return work(session);
    }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
    if (result === undefined) throw new Error('Booking transaction did not commit');
    return result;
  } finally {
    await session.endSession();
  }
};
