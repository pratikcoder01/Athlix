import { Router } from 'express';
import {
  getPosts,
  createPost,
  toggleLikePost,
  commentPost,
  getCommentsByPostId,
} from '../controllers/postController';
import protect from '../middleware/authMiddleware';
import { validateBody } from '../utils/validation';
import { communityPostSchema } from '../utils/communityPolicy';
import rateLimit from 'express-rate-limit';
import { editCommunityPost, removeCommunityPost, editCommunityComment, removeCommunityComment } from '../controllers/communityAuthorController';
import { getCommunityReports, reportCommunityPost, reportCommunityComment, resolveCommunityReport } from '../controllers/communityModerationController';
import { AuthenticatedRequest } from '../types';

const router = Router();
const writeLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many community writes. Please try again in 15 minutes.' } });
const reportLimit = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: true, legacyHeaders: false,
  keyGenerator: req => String((req as AuthenticatedRequest).user!._id),
  message: { success: false, message: 'Too many reports. Please try again in 15 minutes.' } });

router.get('/', protect, getPosts);
router.post('/', protect, writeLimit, validateBody(communityPostSchema), createPost);
router.get('/moderation/reports', protect, getCommunityReports);
router.post('/moderation/reports/:reportId/resolve', protect, writeLimit, resolveCommunityReport);
router.patch('/:id', protect, writeLimit, editCommunityPost);
router.delete('/:id', protect, writeLimit, removeCommunityPost);
router.post('/:id/report', protect, reportLimit, reportCommunityPost);
router.post('/:id/comments/:commentId/report', protect, reportLimit, reportCommunityComment);
router.patch('/:id/comments/:commentId', protect, writeLimit, editCommunityComment);
router.delete('/:id/comments/:commentId', protect, writeLimit, removeCommunityComment);
router.post('/:id/like', protect, writeLimit, toggleLikePost);
router.post('/:id/comments', protect, writeLimit, commentPost);
router.get('/:id/comments', protect, getCommentsByPostId);

export default router;
