import { NextFunction, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { CommunityReport } from '../models/CommunityReport';
import { CommunityModerationAudit } from '../models/CommunityModerationAudit';
import { communityIdSchema, communityReportQuerySchema, communityReportSchema, communityResolveSchema,
  communityVersionFilter, communityVisible } from '../utils/communityPolicy';
import { withCommunityPostWrite } from '../utils/communityTransaction';

const deny = (res: Response, status: number, message: string) => res.status(status).json({ success: false, message });
const admin = (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { deny(res, 401, 'Not authorized'); return false; }
  if (req.user.role !== 'admin') { deny(res, 403, 'Administrator access is required'); return false; }
  return true;
};

async function report(req: AuthenticatedRequest, res: Response, next: NextFunction, type: 'post' | 'comment') {
  try {
    if (!req.user) return deny(res, 401, 'Not authorized');
    const parsed = communityReportSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.id).success || (type === 'comment' && !communityIdSchema.safeParse(req.params.commentId).success)) return deny(res, 400, 'Invalid report target or details');
    const targetId = type === 'comment' ? req.params.commentId : req.params.id;
    await withCommunityPostWrite(req.params.id, async session => {
      if (type === 'comment' && !await Comment.exists({ _id: targetId, postId: req.params.id, ...communityVisible }).session(session)) {
        throw Object.assign(new Error('Comment not found'), { statusCode: 404 });
      }
      const saved = await CommunityReport.create([{ reporterId: req.user!._id, targetType: type, targetId, ...parsed.data }], { session });
      return saved[0];
    });
    return res.status(201).json({ success: true, message: 'Report saved for administrator review. A response time is not guaranteed.' });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) return res.status(200).json({ success: true, message: 'You have already reported this item. Your report remains recorded.' });
    next(error);
  }
}
export const reportCommunityPost = (req: AuthenticatedRequest, res: Response, next: NextFunction) => report(req, res, next, 'post');
export const reportCommunityComment = (req: AuthenticatedRequest, res: Response, next: NextFunction) => report(req, res, next, 'comment');

export const getCommunityReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!admin(req, res)) return;
    const parsed = communityReportQuerySchema.safeParse(req.query);
    if (!parsed.success) return deny(res, 400, 'Invalid report filters or pagination');
    const { page, limit, status } = parsed.data;
    const records = await CommunityReport.find({ status }).select('reporterId targetType targetId reason details status version createdAt resolvedAt action resolutionNote')
      .populate('reporterId', 'name role').sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit + 1).lean();
    const reports = await Promise.all(records.slice(0, limit).map(async record => {
      const target = record.targetType === 'post'
        ? await Post.findById(record.targetId).select('authorId content visibility version').populate('authorId', 'name role').lean()
        : await Comment.findById(record.targetId).select('authorId content visibility version postId').populate('authorId', 'name role').lean();
      return { ...record, target: target ? { ...target, version: target.version || 0, visibility: target.visibility || 'visible' } : null };
    }));
    return res.status(200).json({ success: true, reports, page, hasMore: records.length > limit });
  } catch (error) { next(error); }
};

export const resolveCommunityReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!admin(req, res)) return;
    const parsed = communityResolveSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.reportId).success) return deny(res, 400, 'Invalid moderation decision, target version or report');
    const { expectedVersion, action, note, expectedTargetVersion } = parsed.data;
    const session = await mongoose.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const report = await CommunityReport.findOne({ _id: req.params.reportId, status: 'open', version: expectedVersion }).session(session);
        if (!report) throw Object.assign(new Error('The report changed or is unavailable. Reload the queue.'), { statusCode: 409 });
        if (action === 'hide') {
          const filter = { _id: report.targetId, ...communityVisible, ...communityVersionFilter(expectedTargetVersion!) };
          const change = { $set: { visibility: 'hidden', hiddenAt: new Date(), hiddenBy: req.user!._id }, $inc: { version: 1 } };
          const target = report.targetType === 'post'
            ? await Post.findOneAndUpdate(filter, change, { new: true, runValidators: true, session }).select('_id')
            : await Comment.findOneAndUpdate(filter, change, { new: true, runValidators: true, session }).select('_id');
          if (!target) throw Object.assign(new Error('The reported content changed or is already unavailable. Reload before deciding.'), { statusCode: 409 });
        }
        const resolved = await CommunityReport.findOneAndUpdate({ _id: report._id, status: 'open', version: expectedVersion },
          { $set: { status: 'resolved', action, resolutionNote: note, resolvedAt: new Date(), resolvedBy: req.user!._id }, $inc: { version: 1 } }, { new: true, runValidators: true, session });
        if (!resolved) throw Object.assign(new Error('The report changed. Reload the queue.'), { statusCode: 409 });
        await CommunityModerationAudit.create([{ reportId: report._id, actorId: req.user!._id, targetType: report.targetType, targetId: report.targetId,
          action, note, ...(action === 'hide' ? { priorTargetVersion: expectedTargetVersion, resultingTargetVersion: expectedTargetVersion! + 1 } : {}) }], { session });
        return true;
      }, { readPreference: 'primary', readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' }, maxCommitTimeMS: 10000 });
      if (!result) throw new Error('Moderation transaction did not commit');
    } finally { await session.endSession(); }
    return res.status(200).json({ success: true, message: action === 'hide' ? 'Content hidden and report resolved; moderation audit saved' : 'Report dismissed; moderation audit saved' });
  } catch (error) { next(error); }
};
