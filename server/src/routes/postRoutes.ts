import { Router } from 'express';
import {
  getPosts,
  createPost,
  toggleLikePost,
  commentPost,
  getCommentsByPostId,
} from '../controllers/postController';
import protect from '../middleware/authMiddleware';
import { postSchema, validateBody } from '../utils/validation';

const router = Router();

router.get('/', protect, getPosts);
router.post('/', protect, validateBody(postSchema), createPost);
router.post('/:id/like', protect, toggleLikePost);
router.post('/:id/comments', protect, commentPost);
router.get('/:id/comments', protect, getCommentsByPostId);

export default router;
