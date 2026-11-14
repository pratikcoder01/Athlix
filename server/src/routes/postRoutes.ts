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

const router = Router();
const writeLimit = rateLimit({ windowMs: 15 * 60_000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many community writes. Please try again in 15 minutes.' } });

router.get('/', protect, getPosts);
router.post('/', protect, writeLimit, validateBody(communityPostSchema), createPost);
router.post('/:id/like', protect, writeLimit, toggleLikePost);
router.post('/:id/comments', protect, writeLimit, commentPost);
router.get('/:id/comments', protect, getCommentsByPostId);

export default router;
