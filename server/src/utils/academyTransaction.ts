import mongoose, { ClientSession } from 'mongoose';
import { Academy } from '../models/Academy';

/** Serialize member/attendance writes with listing archive, in the same transaction. */
export const withAcademyWrite = async <T>(scope: Record<string, unknown>, work: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const active = await Academy.updateOne({ ...scope, archivedAt: null }, { $inc: { operationsRevision: 1 } }, { session });
      if (active.matchedCount !== 1) throw Object.assign(new Error('Academy is archived or unavailable'), { statusCode: 409 });
      return work(session);
    }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
    if (result === undefined) throw new Error('Academy transaction did not commit');
    return result;
  } finally { await session.endSession(); }
};
