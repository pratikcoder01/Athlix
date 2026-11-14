import { NextFunction, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { communityIdSchema, communityPostEditSchema, communityCommentEditSchema, communityRemoveSchema,
  communityVersionFilter, communityVisible } from '../utils/communityPolicy';
import { withCommunityPostWrite } from '../utils/communityTransaction';

const deny = (res: Response, status: number, message: string) => res.status(status).json({ success: false, message });

export const editCommunityPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return deny(res, 401, 'Not authorized');
    const parsed = communityPostEditSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.id).success) return deny(res, 400, 'Invalid post changes or identifier');
    const post = await Post.findOneAndUpdate({ _id: req.params.id, authorId: req.user._id, ...communityVisible, ...communityVersionFilter(parsed.data.expectedVersion) },
      { $set: { content: parsed.data.content }, $inc: { version: 1 } }, { new: true, runValidators: true }).select('version');
    if (!post) return deny(res, 409, 'Your post changed or is unavailable. Refresh the feed before editing.');
    return res.status(200).json({ success: true, message: 'Post changes saved', version: post.version });
  } catch (error) { next(error); }
};

export const removeCommunityPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return deny(res, 401, 'Not authorized');
    const parsed = communityRemoveSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.id).success) return deny(res, 400, 'Invalid post identifier or version');
    const post = await Post.findOneAndUpdate({ _id: req.params.id, authorId: req.user._id, visibility: { $ne: 'deleted' }, ...communityVersionFilter(parsed.data.expectedVersion) },
      { $set: { visibility: 'deleted' }, $inc: { version: 1 } }, { new: true, runValidators: true }).select('version');
    if (!post) return deny(res, 409, 'Your post changed or is unavailable. Refresh the feed before removing.');
    return res.status(200).json({ success: true, message: 'Post removed from the community', version: post.version });
  } catch (error) { next(error); }
};

export const editCommunityComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return deny(res, 401, 'Not authorized');
    const parsed = communityCommentEditSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.id).success || !communityIdSchema.safeParse(req.params.commentId).success) return deny(res, 400, 'Invalid comment changes or identifier');
    const comment = await withCommunityPostWrite(req.params.id, async session => {
      const saved = await Comment.findOneAndUpdate({ _id: req.params.commentId, postId: req.params.id, authorId: req.user!._id,
        ...communityVisible, ...communityVersionFilter(parsed.data.expectedVersion) },
      { $set: { content: parsed.data.content }, $inc: { version: 1 } }, { new: true, runValidators: true, session }).select('version');
      if (!saved) throw Object.assign(new Error('Your comment changed or is unavailable. Reload comments before editing.'), { statusCode: 409 });
      return saved;
    });
    return res.status(200).json({ success: true, message: 'Comment changes saved', version: comment.version });
  } catch (error) { next(error); }
};

export const removeCommunityComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) return deny(res, 401, 'Not authorized');
    const parsed = communityRemoveSchema.safeParse(req.body);
    if (!parsed.success || !communityIdSchema.safeParse(req.params.id).success || !communityIdSchema.safeParse(req.params.commentId).success) return deny(res, 400, 'Invalid comment identifier or version');
    const comment = await withCommunityPostWrite(req.params.id, async session => {
      const saved = await Comment.findOneAndUpdate({ _id: req.params.commentId, postId: req.params.id, authorId: req.user!._id,
        visibility: { $ne: 'deleted' }, ...communityVersionFilter(parsed.data.expectedVersion) },
      { $set: { visibility: 'deleted' }, $inc: { version: 1 } }, { new: true, runValidators: true, session }).select('version');
      if (!saved) throw Object.assign(new Error('Your comment changed or is unavailable. Reload comments before removing.'), { statusCode: 409 });
      return saved;
    });
    return res.status(200).json({ success: true, message: 'Comment removed from the community', version: comment.version });
  } catch (error) { next(error); }
};
