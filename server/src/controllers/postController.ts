import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Post } from '../models/Post';
import { Comment } from '../models/Comment';
import { AuthenticatedRequest } from '../types';
import { communityIdSchema, communityPostSchema, communityCommentSchema, communityLikeSchema, communityQuerySchema } from '../utils/communityPolicy';

const invalid = (res: Response, message: string) => res.status(400).json({ success: false, message });
const authorized = (req: AuthenticatedRequest, res: Response) => {
  if (req.user) return true;
  res.status(401).json({ success: false, message: 'Not authorized' });
  return false;
};

export const getPosts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!authorized(req, res)) return;
    const parsed = communityQuerySchema.safeParse(req.query);
    if (!parsed.success) return invalid(res, 'Invalid community pagination');
    const { page, limit } = parsed.data;
    const records = await Post.find().select('authorId content likes createdAt')
      .populate('authorId', 'name role').sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit).limit(limit + 1).lean();
    const selected = records.slice(0, limit);
    // Persisted comments are the source of truth. A separate mutable counter can
    // drift on failed writes and concurrent comments; never present it as fact.
    const counts = selected.length ? await Comment.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { postId: { $in: selected.map(post => post._id) } } },
      { $group: { _id: '$postId', count: { $sum: 1 } } },
    ]) : [];
    const totals = new Map(counts.map(count => [String(count._id), count.count]));
    const posts = selected.map(post => ({
      _id: post._id, authorId: post.authorId, content: post.content, createdAt: post.createdAt,
      likesCount: new Set((post.likes || []).map(String)).size,
      likedByMe: !!post.likes?.some(id => String(id) === String(req.user!._id)),
      commentsCount: totals.get(String(post._id)) || 0,
    }));
    return res.status(200).json({ success: true, posts, page, limit, hasMore: records.length > limit });
  } catch (error) { next(error); }
};

export const createPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!authorized(req, res)) return;
    const parsed = communityPostSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, 'Post must contain 1–5000 characters of text only');
    const saved = await Post.create({ authorId: req.user!._id, content: parsed.data.content, mediaUrl: '', mediaType: 'none' });
    const post = { _id: saved._id, authorId: { _id: req.user!._id, name: req.user!.name, role: req.user!.role },
      content: saved.content, createdAt: saved.get('createdAt'), likesCount: 0, likedByMe: false, commentsCount: 0 };
    try {
      req.app.get('io')?.emit('new_post', post);
    } catch {
      // Publication is already persisted. A transient realtime failure must not
      // invite a duplicate retry or expose transport details to the client.
      console.warn(JSON.stringify({ event: 'community_realtime_delivery_failed', postId: String(saved._id) }));
    }
    return res.status(201).json({ success: true, message: 'Post published', post });
  } catch (error) { next(error); }
};

// Compatibility route name retained; clients now request an idempotent desired
// state. $addToSet/$pull avoid duplicate actors and lost updates across processes.
export const toggleLikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!authorized(req, res)) return;
    if (!communityIdSchema.safeParse(req.params.id).success) return invalid(res, 'Invalid post ID');
    const parsed = communityLikeSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, 'Choose liked: true or false');
    const operation = parsed.data.liked ? { $addToSet: { likes: req.user!._id } } : { $pull: { likes: req.user!._id } };
    const post = await Post.findByIdAndUpdate(req.params.id, operation, { new: true, runValidators: true }).select('likes');
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    return res.status(200).json({ success: true, liked: !!post.likes?.some(id => String(id) === String(req.user!._id)), likesCount: new Set((post.likes || []).map(String)).size });
  } catch (error) { next(error); }
};

export const commentPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!authorized(req, res)) return;
    if (!communityIdSchema.safeParse(req.params.id).success) return invalid(res, 'Invalid post ID');
    const parsed = communityCommentSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, 'Comment must contain 1–2000 characters of text');
    if (!await Post.exists({ _id: req.params.id })) return res.status(404).json({ success: false, message: 'Post not found' });
    const saved = await Comment.create({ authorId: req.user!._id, postId: req.params.id, content: parsed.data.content });
    const comment = { _id: saved._id, authorId: { _id: req.user!._id, name: req.user!.name, role: req.user!.role },
      content: saved.content, createdAt: saved.get('createdAt') };
    return res.status(201).json({ success: true, message: 'Comment published', comment });
  } catch (error) { next(error); }
};

export const getCommentsByPostId = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!authorized(req, res)) return;
    if (!communityIdSchema.safeParse(req.params.id).success) return invalid(res, 'Invalid post ID');
    const parsed = communityQuerySchema.safeParse(req.query);
    if (!parsed.success) return invalid(res, 'Invalid comment pagination');
    if (!await Post.exists({ _id: req.params.id })) return res.status(404).json({ success: false, message: 'Post not found' });
    const { page, limit } = parsed.data;
    const records = await Comment.find({ postId: req.params.id }).select('authorId content createdAt')
      .populate('authorId', 'name role').sort({ createdAt: 1, _id: 1 })
      .skip((page - 1) * limit).limit(limit + 1).lean();
    return res.status(200).json({ success: true, comments: records.slice(0, limit), page, limit, hasMore: records.length > limit });
  } catch (error) { next(error); }
};
