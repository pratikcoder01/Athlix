import mongoose, { ClientSession } from 'mongoose';
import { Post } from '../models/Post';
import { communityVisible } from './communityPolicy';

// Parent coordination prevents comment/report writes racing a post's removal.
export const withCommunityPostWrite = async <T>(postId: string, work: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();
  try {
    const result = await session.withTransaction(async () => {
      const parent = await Post.updateOne({ _id: postId, ...communityVisible }, { $inc: { interactionRevision: 1 } }, { session });
      if (parent.matchedCount !== 1) throw Object.assign(new Error('Post not found'), { statusCode: 404 });
      return work(session);
    }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
    if (result === undefined) throw new Error('Community transaction did not commit');
    return result;
  } finally { await session.endSession(); }
};
