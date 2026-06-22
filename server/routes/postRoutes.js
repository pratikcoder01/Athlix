const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { createPost, getFeed, likePost } = require('../controllers/postController');
const { postSchema, validateBody } = require('../utils/validation');

// Feed endpoints require login
router.use(protect);

router.get('/', getFeed);
router.post('/', validateBody(postSchema), createPost);
router.post('/:id/like', likePost);

module.exports = router;
